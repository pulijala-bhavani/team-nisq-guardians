import { getStore } from "@netlify/blobs";
import { NextResponse } from "next/server";
import type { Candidate, InterviewApiResponse, InterviewRecoveryMessage } from "@/lib/types";
import {
  SESSION_TTL_MS,
  TOTAL_QUESTIONS,
  chooseFallbackNextDay,
  createSession,
  dayByNumber,
  deterministicAssessment,
  deterministicFeedback,
  deterministicQuestion,
  moduleForDay,
  rebuildSessionFromAnswers,
  rebuildSessionFromHistory,
  sanitizeNextDay,
  summarizeEvaluation,
  type InterviewSession,
} from "@/lib/interview-engine";
import { generateSemanticOpening, generateSemanticTurn } from "@/lib/gemini-interviewer";

type RequestBody = {
  sessionId?: unknown;
  candidate?: unknown;
  message?: unknown;
  answers?: unknown;
  history?: unknown;
};

type RateBucket = { count: number; resetAt: number };

const globalStore = globalThis as typeof globalThis & {
  __abtalksSessions?: Map<string, InterviewSession>;
  __abtalksRateBuckets?: Map<string, RateBucket>;
  __abtalksProcessing?: Set<string>;
};
const sessions = globalStore.__abtalksSessions ?? new Map<string, InterviewSession>();
const rateBuckets = globalStore.__abtalksRateBuckets ?? new Map<string, RateBucket>();
const processing = globalStore.__abtalksProcessing ?? new Set<string>();
globalStore.__abtalksSessions = sessions;
globalStore.__abtalksRateBuckets = rateBuckets;
globalStore.__abtalksProcessing = processing;

const MAX_BODY_BYTES = 120_000;
const MAX_MESSAGE_CHARACTERS = 8_000;
const SESSION_STORE_NAME = "abtalks-interview-sessions";

function jsonError(reply: string, status = 400, headers?: HeadersInit) {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("Cache-Control", "no-store");
  responseHeaders.set("X-Content-Type-Options", "nosniff");
  return NextResponse.json({ reply, done: false }, { status, headers: responseHeaders });
}

function jsonResponse(body: InterviewApiResponse) {
  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isShortString(value: unknown, max = 300): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max;
}

function isBoundedNumber(value: unknown, min: number, max: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

function validateCandidate(value: unknown): value is Candidate {
  if (!isObject(value) || !isObject(value.member) || !isObject(value.signals) || !Array.isArray(value.missions)) {
    return false;
  }
  const { member, signals, missions } = value;
  if (
    !isShortString(member.id, 100) ||
    !isShortString(member.name, 120) ||
    !isShortString(member.jobRole, 160) ||
    !isShortString(member.education, 200) ||
    !isShortString(member.status, 60) ||
    !isBoundedNumber(member.yearsExperience, 0, 80) ||
    !isBoundedNumber(signals.commitDays, 0, 31) ||
    !isBoundedNumber(signals.missionsCompleted, 0, 31) ||
    !isBoundedNumber(signals.missionsFirstTry, 0, 31) ||
    missions.length > 31
  ) {
    return false;
  }

  const seenDays = new Set<number>();
  for (const mission of missions) {
    if (!isObject(mission) || !Number.isInteger(mission.day) || !dayByNumber.has(mission.day as number)) return false;
    if (seenDays.has(mission.day as number) || !isShortString(mission.title, 220)) return false;
    seenDays.add(mission.day as number);
    if (mission.passed !== undefined && typeof mission.passed !== "boolean") return false;
    if (mission.skipped !== undefined && typeof mission.skipped !== "boolean") return false;
    if (mission.attempts !== undefined && !isBoundedNumber(mission.attempts, 1, 50)) return false;
    if (mission.passed === true && mission.skipped === true) return false;
  }

  return true;
}

function parseSessionId(value: unknown) {
  if (typeof value !== "string") return undefined;
  const sessionId = value.trim();
  if (!/^[A-Za-z0-9._:-]{6,128}$/.test(sessionId)) return undefined;
  return sessionId;
}

function parseMessage(value: unknown) {
  if (typeof value !== "string") return undefined;
  const message = value.trim();
  if (!message || message.length > MAX_MESSAGE_CHARACTERS) return undefined;
  return message;
}

function parseAnswers(value: unknown) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > TOTAL_QUESTIONS - 1) return undefined;
  const answers = value.map((answer) => parseMessage(answer));
  return answers.every(Boolean) ? (answers as string[]) : undefined;
}

function parseHistory(value: unknown): InterviewRecoveryMessage[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > TOTAL_QUESTIONS * 2) return undefined;
  const history: InterviewRecoveryMessage[] = [];

  for (const item of value) {
    if (!isObject(item) || (item.role !== "agent" && item.role !== "user")) return undefined;
    const content = parseMessage(item.content);
    if (!content) return undefined;
    const entry: InterviewRecoveryMessage = { role: item.role, content };
    if (item.meta !== undefined) {
      if (!isObject(item.meta)) return undefined;
      const meta = item.meta;
      if (
        !Number.isInteger(meta.questionNumber) ||
        !Number.isInteger(meta.day) ||
        !dayByNumber.has(meta.day as number) ||
        !isShortString(meta.topic, 200) ||
        typeof meta.isFollowUp !== "boolean" ||
        !Array.isArray(meta.daysCovered) ||
        !meta.daysCovered.every((day) => Number.isInteger(day) && dayByNumber.has(day as number))
      ) {
        return undefined;
      }
      entry.meta = {
        questionNumber: meta.questionNumber as number,
        day: meta.day as number,
        topic: meta.topic,
        isFollowUp: meta.isFollowUp,
        daysCovered: meta.daysCovered as number[],
      };
    }
    history.push(entry);
  }

  return history;
}

function clientAddress(request: Request) {
  return (
    request.headers.get("x-nf-client-connection-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function consumeRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }
  if (bucket.count >= limit) {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  bucket.count += 1;
  return { allowed: true, retryAfter: 0 };
}

function checkRateLimits(request: Request, sessionId: string) {
  const ipResult = consumeRateLimit(`ip:${clientAddress(request)}`, 90, 60_000);
  if (!ipResult.allowed) return ipResult;
  return consumeRateLimit(`session:${sessionId}`, 30, 30 * 60_000);
}

function blobsAvailable() {
  return Boolean(process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT);
}

async function loadPersistentSession(sessionId: string) {
  if (!blobsAvailable()) return undefined;
  try {
    const store = getStore({ name: SESSION_STORE_NAME, consistency: "strong" });
    const value = (await store.get(sessionId, { type: "json", consistency: "strong" })) as InterviewSession | null;
    if (!value || !validateCandidate(value.candidate) || !Array.isArray(value.plan) || !Array.isArray(value.records)) {
      return undefined;
    }
    if (value.expiresAt <= Date.now()) {
      await store.delete(sessionId);
      return undefined;
    }
    return value;
  } catch (error) {
    console.warn(`[interview] Durable session read unavailable (${error instanceof Error ? error.name : "UnknownError"}).`);
    return undefined;
  }
}

async function loadSession(sessionId: string) {
  const memory = sessions.get(sessionId);
  if (memory?.expiresAt && memory.expiresAt > Date.now()) return memory;
  if (memory) sessions.delete(sessionId);
  const durable = await loadPersistentSession(sessionId);
  if (durable) sessions.set(sessionId, durable);
  return durable;
}

async function saveSession(sessionId: string, session: InterviewSession) {
  session.updatedAt = Date.now();
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  sessions.set(sessionId, session);
  if (!blobsAvailable()) return;
  try {
    const store = getStore({ name: SESSION_STORE_NAME, consistency: "strong" });
    await store.setJSON(sessionId, session, { metadata: { expiresAt: session.expiresAt } });
  } catch (error) {
    console.warn(`[interview] Durable session write unavailable (${error instanceof Error ? error.name : "UnknownError"}).`);
  }
}

async function deleteSession(sessionId: string) {
  sessions.delete(sessionId);
  if (!blobsAvailable()) return;
  try {
    const store = getStore({ name: SESSION_STORE_NAME, consistency: "strong" });
    await store.delete(sessionId);
  } catch (error) {
    console.warn(`[interview] Durable session cleanup unavailable (${error instanceof Error ? error.name : "UnknownError"}).`);
  }
}

function recoverSession(body: RequestBody, candidate: Candidate | undefined) {
  if (!candidate) return undefined;
  const history = parseHistory(body.history);
  if (body.history !== undefined && !history) return undefined;
  if (history?.length) return rebuildSessionFromHistory(candidate, history);
  const answers = parseAnswers(body.answers);
  if (body.answers !== undefined && !answers) return undefined;
  if (answers) return rebuildSessionFromAnswers(candidate, answers);
  return undefined;
}

async function startInterview(sessionId: string, candidate: Candidate) {
  let session: InterviewSession;
  try {
    session = createSession(candidate);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Candidate cannot support a valid interview.", 422);
  }

  const opening = await generateSemanticOpening(session).catch((error) => {
    console.warn(`[interview] Invalid semantic opening; using fallback (${error instanceof Error ? error.name : "UnknownError"}).`);
    return undefined;
  });
  session.lastQuestion = opening ?? deterministicQuestion(session, session.plan[0], 1);
  await saveSession(sessionId, session);

  const response: InterviewApiResponse = {
    reply: session.lastQuestion,
    done: false,
    meta: {
      questionNumber: 1,
      day: session.currentDay,
      topic: moduleForDay(session.currentDay),
      isFollowUp: false,
      daysCovered: session.daysCovered,
    },
  };
  return jsonResponse(response);
}

async function continueInterview(sessionId: string, session: InterviewSession, message: string) {
  const answeredDay = dayByNumber.get(session.currentDay);
  if (!answeredDay) return jsonError("The active interview references an invalid curriculum day.", 409);

  const semantic = await generateSemanticTurn(session, message).catch((error) => {
    console.warn(`[interview] Invalid semantic turn; using fallback (${error instanceof Error ? error.name : "UnknownError"}).`);
    return undefined;
  });
  const assessment = semantic?.assessment ?? deterministicAssessment(message, answeredDay);
  session.records.push({
    question: session.lastQuestion,
    answer: message,
    day: answeredDay.day,
    topic: moduleForDay(answeredDay.day),
    assessment,
  });

  if (session.questionNumber >= TOTAL_QUESTIONS) {
    const feedback = semantic?.feedback ?? deterministicFeedback(session);
    const evaluation = summarizeEvaluation(session.records);
    await deleteSession(sessionId);
    const response: InterviewApiResponse = {
      reply: "Interview completed. Your evidence-based feedback is ready.",
      done: true,
      feedback,
      evaluation,
    };
    return jsonResponse(response);
  }

  const nextNumber = session.questionNumber + 1;
  const semanticDay = semantic?.nextQuestion?.day;
  const nextDay = semanticDay ? sanitizeNextDay(session, semanticDay) : chooseFallbackNextDay(session);
  const nextQuestion = semantic?.nextQuestion?.text ?? deterministicQuestion(session, nextDay, nextNumber, message);
  const mode = semantic?.nextQuestion?.mode;

  session.questionNumber = nextNumber;
  session.currentDay = nextDay.day;
  session.lastQuestion = nextQuestion;
  if (!session.daysCovered.includes(nextDay.day)) session.daysCovered.push(nextDay.day);
  await saveSession(sessionId, session);

  const response: InterviewApiResponse = {
    reply: nextQuestion,
    done: false,
    meta: {
      questionNumber: nextNumber,
      day: nextDay.day,
      topic: moduleForDay(nextDay.day),
      isFollowUp: nextDay.day === answeredDay.day || mode === "follow_up" || mode === "clarification" || mode === "challenge",
      daysCovered: session.daysCovered,
    },
  };
  return jsonResponse(response);
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return jsonError("Content-Type must be application/json.", 415);

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return jsonError("Request body could not be read.");
  }
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return jsonError("Request body is too large.", 413);
  }

  let body: RequestBody;
  try {
    body = JSON.parse(rawBody) as RequestBody;
  } catch {
    return jsonError("Request body must be valid JSON.");
  }
  if (!isObject(body)) return jsonError("Request body must be a JSON object.");

  const sessionId = parseSessionId(body.sessionId);
  if (!sessionId) return jsonError("A valid sessionId between 6 and 128 characters is required.");
  const rateLimit = checkRateLimits(request, sessionId);
  if (!rateLimit.allowed) {
    return jsonError("Too many interview requests. Please wait briefly and retry.", 429, {
      "Retry-After": String(rateLimit.retryAfter),
    });
  }

  const candidate = body.candidate === undefined ? undefined : validateCandidate(body.candidate) ? body.candidate : undefined;
  if (body.candidate !== undefined && !candidate) return jsonError("candidate does not match the required candidate schema.");

  const message = parseMessage(body.message);
  if (body.message !== undefined && !message) {
    return jsonError(`message must contain between 1 and ${MAX_MESSAGE_CHARACTERS} characters.`);
  }

  if (candidate && !message) return startInterview(sessionId, candidate);
  if (!message) return jsonError("message is required for an active interview.");
  if (processing.has(sessionId)) return jsonError("This interview turn is already being processed.", 409);

  processing.add(sessionId);
  try {
    const session = (await loadSession(sessionId)) ?? recoverSession(body, candidate);
    if (!session) {
      return jsonError("Interview session not found. Restart or include the candidate and recovery history.", 404);
    }
    return await continueInterview(sessionId, session, message);
  } finally {
    processing.delete(sessionId);
  }
}