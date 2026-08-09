import curriculumData from "@/data/curriculum.json";
import type {
  Candidate,
  CurriculumDay,
  EvaluationDimensions,
  EvaluationSummary,
  Feedback,
  InterviewRecoveryMessage,
} from "@/lib/types";

export type Verdict = "strong" | "partial" | "weak" | "incorrect" | "evasive";

export type AnswerAssessment = {
  verdict: Verdict;
  scores: EvaluationDimensions;
  strengths: string[];
  gaps: string[];
  evidence: string[];
  needsClarification: boolean;
  engine: "gemini" | "deterministic-fallback";
};

export type InterviewRecord = {
  question: string;
  answer: string;
  day: number;
  topic: string;
  assessment: AnswerAssessment;
};

export type InterviewSession = {
  candidate: Candidate;
  plan: CurriculumDay[];
  questionNumber: number;
  daysCovered: number[];
  records: InterviewRecord[];
  lastQuestion: string;
  currentDay: number;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
};

export const TOTAL_QUESTIONS = 8;
export const MINIMUM_DAYS = 4;
export const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

export const curriculumDays = curriculumData.days as CurriculumDay[];
export const dayByNumber = new Map(curriculumDays.map((day) => [day.day, day]));

export function moduleForDay(day: number) {
  const curriculumModule = curriculumData.modules.find(
    (item) => day >= item.days[0] && day <= item.days[1],
  );
  return curriculumModule?.title ?? "AI Engineering";
}

export function buildPlan(candidate: Candidate): CurriculumDay[] {
  const passed = candidate.missions
    .filter((mission) => mission.passed === true && dayByNumber.has(mission.day))
    .sort((a, b) => {
      const attempts = (b.attempts ?? 1) - (a.attempts ?? 1);
      return attempts || a.day - b.day;
    });

  const eligible = [...new Map(passed.map((mission) => [mission.day, mission])).values()];
  if (eligible.length < MINIMUM_DAYS) {
    throw new Error(
      `Candidate must have at least ${MINIMUM_DAYS} completed curriculum days for a valid interview.`,
    );
  }

  const selected: CurriculumDay[] = [];
  const seenModules = new Set<string>();

  for (const mission of eligible) {
    const day = dayByNumber.get(mission.day);
    if (!day) continue;
    const moduleName = moduleForDay(day.day);
    if (!seenModules.has(moduleName)) {
      selected.push(day);
      seenModules.add(moduleName);
    }
    if (selected.length === 6) break;
  }

  for (const mission of eligible) {
    if (selected.length === 6) break;
    const day = dayByNumber.get(mission.day);
    if (day && !selected.some((item) => item.day === day.day)) selected.push(day);
  }

  return selected;
}

export function createSession(candidate: Candidate): InterviewSession {
  const plan = buildPlan(candidate);
  const now = Date.now();
  return {
    candidate,
    plan,
    questionNumber: 1,
    daysCovered: [plan[0].day],
    records: [],
    lastQuestion: "",
    currentDay: plan[0].day,
    createdAt: now,
    updatedAt: now,
    expiresAt: now + SESSION_TTL_MS,
  };
}

export function allowedNextDays(session: InterviewSession) {
  const unseen = session.plan.filter((day) => !session.daysCovered.includes(day.day));
  const requiredNewDays = Math.max(0, MINIMUM_DAYS - session.daysCovered.length);
  const futureSlotsAfterNext = TOTAL_QUESTIONS - (session.questionNumber + 1);

  if (requiredNewDays > futureSlotsAfterNext && unseen.length > 0) return unseen;
  return session.plan;
}

export function sanitizeNextDay(session: InterviewSession, proposedDay: number) {
  const allowed = allowedNextDays(session);
  return allowed.find((day) => day.day === proposedDay) ?? chooseFallbackNextDay(session);
}

export function chooseFallbackNextDay(session: InterviewSession) {
  const allowed = allowedNextDays(session);
  const lastAssessment = session.records.at(-1)?.assessment;
  const current = allowed.find((day) => day.day === session.currentDay);

  if (
    current &&
    lastAssessment &&
    ["weak", "incorrect", "evasive"].includes(lastAssessment.verdict) &&
    session.questionNumber < 6
  ) {
    return current;
  }

  return allowed.find((day) => !session.daysCovered.includes(day.day)) ?? current ?? allowed[0];
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function containsAny(text: string, expressions: string[]) {
  return expressions.some((expression) => text.includes(expression));
}

export function deterministicAssessment(answer: string, day: CurriculumDay): AnswerAssessment {
  const normalized = answer.toLowerCase();
  const words = answer.trim().split(/\s+/).filter(Boolean);
  const vocabulary = [...day.tools, ...day.objectives.flatMap((objective) => objective.split(/\s+/))]
    .map((word) => word.toLowerCase().replace(/[^a-z0-9-]/g, ""))
    .filter((word) => word.length > 4);
  const keywordCount = new Set(vocabulary.filter((word) => normalized.includes(word))).size;
  const hasReasoning = containsAny(normalized, ["because", "therefore", "trade-off", "tradeoff", "whereas", "depends on"]);
  const hasProduction = containsAny(normalized, ["latency", "throughput", "scale", "monitor", "failure", "security", "cost", "reliability"]);
  const hasEvidence = containsAny(normalized, ["metric", "measure", "benchmark", "test", "evaluate", "log", "trace"]);
  const evasive = words.length < 8 || containsAny(normalized, ["i don't know", "i do not know", "not sure"]);

  const base = Math.min(60, words.length * 1.1) + Math.min(18, keywordCount * 6);
  const technicalAccuracy = clampScore(base + (hasReasoning ? 8 : 0));
  const technicalSpecificity = clampScore(base + keywordCount * 3 + (hasEvidence ? 8 : 0));
  const reasoning = clampScore(base + (hasReasoning ? 18 : 0));
  const communication = clampScore(Math.min(88, 35 + words.length * 1.2));
  const productionAwareness = clampScore(base + (hasProduction ? 20 : 0) + (hasEvidence ? 8 : 0));
  const average = (technicalAccuracy + technicalSpecificity + reasoning + communication + productionAwareness) / 5;
  const verdict: Verdict = evasive ? "evasive" : average >= 78 ? "strong" : average >= 58 ? "partial" : "weak";

  const strengths: string[] = [];
  const gaps: string[] = [];
  if (keywordCount >= 2) strengths.push(`Used relevant ${day.title} concepts rather than staying purely abstract.`);
  if (hasReasoning) strengths.push("Connected the recommendation to an explicit reason or trade-off.");
  if (hasProduction) strengths.push("Considered production constraints or failure modes.");
  if (keywordCount < 2) gaps.push(`Ground the answer in the tools and objectives from ${day.title}.`);
  if (!hasReasoning) gaps.push("State the rejected alternative, governing constraint, and resulting trade-off.");
  if (!hasEvidence) gaps.push("Explain how the decision would be tested or measured.");
  if (evasive) gaps.unshift("The response did not contain enough technical reasoning to evaluate confidently.");

  return {
    verdict,
    scores: { technicalAccuracy, technicalSpecificity, reasoning, communication, productionAwareness },
    strengths: strengths.slice(0, 2),
    gaps: gaps.slice(0, 2),
    evidence: words.slice(0, 12).length ? [words.slice(0, 12).join(" ")] : [],
    needsClarification: evasive || verdict === "weak",
    engine: "deterministic-fallback",
  };
}

function conceptFromAnswer(answer: string) {
  const ignore = new Set([
    "about", "after", "because", "could", "from", "have", "into", "that", "their", "then", "there",
    "these", "they", "this", "using", "what", "when", "where", "which", "with", "would", "your",
  ]);
  const words = answer.toLowerCase().match(/[a-z][a-z0-9-]{4,}/g) ?? [];
  return words.find((word) => !ignore.has(word)) ?? "your proposed approach";
}

export function deterministicQuestion(
  session: InterviewSession,
  day: CurriculumDay,
  nextQuestionNumber: number,
  previousAnswer = "",
) {
  const objective = day.objectives[(nextQuestionNumber - 1) % Math.max(day.objectives.length, 1)] ?? day.title;
  const concept = conceptFromAnswer(previousAnswer);
  const assessment = session.records.at(-1)?.assessment;

  if (nextQuestionNumber === 1) {
    return `Welcome, ${session.candidate.member.name}. We’ll focus on systems you completed during the cohort. Starting with Day ${day.day}: ${day.title}, explain how you would ${objective.toLowerCase()}. Defend the most important engineering decision and name the evidence you would use to validate it.`;
  }

  if (nextQuestionNumber === TOTAL_QUESTIONS) {
    return `Final question. Connect Day ${day.day}: ${day.title} to one other system you built in the cohort. Defend one decision, challenge one assumption you previously made, and explain what production evidence would make you revise the design.`;
  }

  if (assessment?.needsClarification && day.day === session.currentDay) {
    return `Your answer referenced “${concept},” but the implementation decision is not yet clear. Reframe it for a production system: what would you build first, what could fail, and which measurement would tell you whether the approach is working?`;
  }

  if (day.day === session.currentDay) {
    return `You argued for “${concept}.” Pressure-test that decision: identify a credible alternative, the constraint that makes your choice preferable, and a failure scenario in which you would switch approaches.`;
  }

  return `Let’s move to Day ${day.day}: ${day.title}. Design a production-conscious implementation for this objective: ${objective}. Describe the components, data flow, failure boundary, and one deliberate trade-off.`;
}

function unique(items: string[], limit = 3) {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))].slice(0, limit);
}

export function summarizeEvaluation(records: InterviewRecord[]): EvaluationSummary {
  const dimensions: EvaluationDimensions = {
    technicalAccuracy: 0,
    technicalSpecificity: 0,
    reasoning: 0,
    communication: 0,
    productionAwareness: 0,
  };

  for (const record of records) {
    for (const key of Object.keys(dimensions) as (keyof EvaluationDimensions)[]) {
      dimensions[key] += record.assessment.scores[key];
    }
  }

  const divisor = Math.max(records.length, 1);
  for (const key of Object.keys(dimensions) as (keyof EvaluationDimensions)[]) {
    dimensions[key] = clampScore(dimensions[key] / divisor);
  }

  const overallScore = clampScore(
    dimensions.technicalAccuracy * 0.28 +
      dimensions.technicalSpecificity * 0.2 +
      dimensions.reasoning * 0.22 +
      dimensions.communication * 0.12 +
      dimensions.productionAwareness * 0.18,
  );
  const engines = new Set(records.map((record) => record.assessment.engine));

  return {
    overallScore,
    dimensions,
    engine: engines.size > 1 ? "hybrid" : engines.has("gemini") ? "gemini" : "deterministic-fallback",
  };
}

export function deterministicFeedback(session: InterviewSession): Feedback {
  const strengths = unique(session.records.flatMap((record) => record.assessment.strengths));
  const gaps = unique(session.records.flatMap((record) => record.assessment.gaps));
  const score = summarizeEvaluation(session.records).overallScore;
  const covered = session.daysCovered.map((day) => `Day ${day}`).join(", ");

  return {
    summary: `${session.candidate.member.name} completed an eight-question interview covering ${covered}. The evidence produced an overall readiness signal of ${score}/100, with the clearest opportunities concentrated in the specific gaps below.`,
    strengths: strengths.length ? strengths : ["Maintained a coherent response across multiple curriculum domains."],
    gaps: gaps.length ? gaps : ["Make every decision defensible through a constraint, alternative, failure mode, and measurable result."],
    next: [
      `Revisit ${session.plan[0].title} and practise a two-minute answer using architecture, trade-off, failure mode, and metric.`,
      `Write one production incident scenario for ${session.plan[1].title} and explain the debugging sequence aloud.`,
      "Repeat the interview with shorter answers that make assumptions and evidence explicit.",
    ],
  };
}

export function rebuildSessionFromHistory(candidate: Candidate, history: InterviewRecoveryMessage[]) {
  const session = createSession(candidate);
  let pendingQuestion: { text: string; day: number; topic: string } | undefined;

  for (const message of history.slice(0, TOTAL_QUESTIONS * 2)) {
    if (message.role === "agent") {
      const day = message.meta?.day;
      if (!day || !session.plan.some((item) => item.day === day)) continue;
      pendingQuestion = { text: message.content, day, topic: message.meta?.topic ?? moduleForDay(day) };
      session.lastQuestion = message.content;
      session.currentDay = day;
      if (!session.daysCovered.includes(day)) session.daysCovered.push(day);
      continue;
    }

    if (pendingQuestion) {
      const day = dayByNumber.get(pendingQuestion.day);
      if (day) {
        session.records.push({
          question: pendingQuestion.text,
          answer: message.content,
          day: pendingQuestion.day,
          topic: pendingQuestion.topic,
          assessment: deterministicAssessment(message.content, day),
        });
      }
      pendingQuestion = undefined;
    }
  }

  session.questionNumber = Math.min(TOTAL_QUESTIONS, session.records.length + 1);
  session.updatedAt = Date.now();
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  return session;
}

export function rebuildSessionFromAnswers(candidate: Candidate, answers: string[]) {
  const session = createSession(candidate);
  session.lastQuestion = deterministicQuestion(session, session.plan[0], 1);

  for (const answer of answers.slice(0, TOTAL_QUESTIONS - 1)) {
    const day = dayByNumber.get(session.currentDay);
    if (!day) break;
    const assessment = deterministicAssessment(answer, day);
    session.records.push({
      question: session.lastQuestion,
      answer,
      day: day.day,
      topic: moduleForDay(day.day),
      assessment,
    });
    const nextNumber = session.questionNumber + 1;
    const nextDay = chooseFallbackNextDay(session);
    session.questionNumber = nextNumber;
    session.currentDay = nextDay.day;
    if (!session.daysCovered.includes(nextDay.day)) session.daysCovered.push(nextDay.day);
    session.lastQuestion = deterministicQuestion(session, nextDay, nextNumber, answer);
  }

  session.updatedAt = Date.now();
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  return session;
}