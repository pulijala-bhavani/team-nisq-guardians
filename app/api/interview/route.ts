import { NextResponse } from "next/server";
import curriculumData from "@/data/curriculum.json";
import type { Candidate, CurriculumDay, Feedback, InterviewApiResponse } from "@/lib/types";

type Evaluation = { strength?: string; gap?: string; length: number; keywords: number };
type Session = {
  candidate: Candidate;
  plan: CurriculumDay[];
  questionNumber: number;
  daysCovered: number[];
  evaluations: Evaluation[];
  lastQuestion: string;
};

const days = curriculumData.days as CurriculumDay[];
const dayByNumber = new Map(days.map((day) => [day.day, day]));
const globalStore = globalThis as typeof globalThis & { __abtalksSessions?: Map<string, Session> };
const sessions = globalStore.__abtalksSessions ?? new Map<string, Session>();
globalStore.__abtalksSessions = sessions;

function moduleForDay(day: number) {
  const curriculumModule = curriculumData.modules.find((item) => day >= item.days[0] && day <= item.days[1]);
  return curriculumModule?.title ?? "AI Engineering";
}

function buildPlan(candidate: Candidate): CurriculumDay[] {
  const passed = candidate.missions
    .filter((mission) => mission.passed)
    .sort((a,b) => (b.attempts ?? 1) - (a.attempts ?? 1));
  const picked: CurriculumDay[] = [];
  const seenModules = new Set<string>();

  for (const mission of passed) {
    const day = dayByNumber.get(mission.day);
    if (!day) continue;
    const curriculumModule = moduleForDay(day.day);
    if (!seenModules.has(curriculumModule)) {
      picked.push(day);
      seenModules.add(curriculumModule);
    }
    if (picked.length === 6) break;
  }

  for (const mission of passed) {
    if (picked.length === 6) break;
    const day = dayByNumber.get(mission.day);
    if (day && !picked.some((item) => item.day === day.day)) picked.push(day);
  }

  for (const fallback of days) {
    if (picked.length === 6) break;
    if (!picked.some((item) => item.day === fallback.day)) picked.push(fallback);
  }
  return picked;
}

function conceptFromAnswer(answer: string) {
  const ignore = new Set(["about","after","because","could","from","have","into","that","their","then","there","these","they","this","using","what","when","where","which","with","would","your"]);
  const words = answer.toLowerCase().match(/[a-z][a-z0-9-]{4,}/g) ?? [];
  return words.find((word) => !ignore.has(word)) ?? "that approach";
}

function questionFor(session: Session, previousAnswer = "") {
  const n = session.questionNumber;
  const sequence = [0,0,1,2,3,1,4,5];
  const day = session.plan[sequence[Math.min(n - 1, sequence.length - 1)]] ?? session.plan[0];
  const objective = day.objectives[(n - 1) % Math.max(day.objectives.length,1)] ?? `explain ${day.title}`;
  const topic = moduleForDay(day.day);
  const concept = conceptFromAnswer(previousAnswer);
  const attempts = session.candidate.missions.find((mission) => mission.day === day.day)?.attempts ?? 1;
  const followUp = n === 2 || n === 4 || n === 6;

  let question: string;
  if (n === 1) {
    question = `Welcome, ${session.candidate.member.name}. We’ll focus on systems you completed during the cohort. Let’s begin with Day ${day.day}: ${day.title}. Walk me through how you would ${objective.toLowerCase()}, and explain the most important engineering decision you would make.`;
  } else if (n === 2) {
    question = `You mentioned “${concept}.” Suppose that choice works in a prototype but fails under production traffic. What would you inspect first, and what evidence would change your design?`;
  } else if (n === 3) {
    question = `Let’s move to Day ${day.day}: ${day.title}. Design a small but production-conscious implementation. Describe the components, data flow, and one trade-off you would deliberately accept.`;
  } else if (n === 4) {
    question = `In your answer, “${concept}” stood out. Compare that approach with one credible alternative. When would the alternative be the better engineering choice?`;
  } else if (n === 5) {
    question = `Consider Day ${day.day}: ${day.title}. A teammate says the system works locally but behaves inconsistently after deployment. Give me a structured debugging plan, including what you would log or measure.`;
  } else if (n === 6) {
    question = `You connected the problem to “${concept}.” Now make the failure more subtle: the output looks plausible but is wrong. How would you detect, evaluate, and prevent that class of failure?`;
  } else if (n === 7) {
    question = `For Day ${day.day}: ${day.title}, identify the highest-risk production failure. What guardrail would you add, and how would you verify that it actually works?`;
  } else {
    question = `Final question. Using what you built on Day ${day.day}: ${day.title}, explain one decision you would defend in a real interview, one decision you would now change, and the evidence behind both.`;
  }

  if (attempts >= 4 && !followUp && n > 1) question += " This was a higher-attempt mission in your learning history, so be precise about the reasoning.";
  return { question, day, topic, followUp };
}

function evaluate(answer: string, day: CurriculumDay): Evaluation {
  const normalized = answer.toLowerCase();
  const vocabulary = [...day.tools, ...day.objectives.flatMap((objective) => objective.split(/\s+/))]
    .map((word) => word.toLowerCase().replace(/[^a-z0-9-]/g,""))
    .filter((word) => word.length > 4);
  const keywords = new Set(vocabulary.filter((word) => normalized.includes(word))).size;
  const length = answer.trim().split(/\s+/).filter(Boolean).length;
  if (length >= 45 && keywords >= 2) return { length, keywords, strength: `Connected ${day.title} to concrete implementation details and trade-offs.` };
  if (length >= 28) return { length, keywords, strength: `Explained the ${day.title} approach with a clear, structured line of reasoning.` };
  return { length, keywords, gap: `Answers about ${day.title} need more implementation detail, failure modes, and measurable evidence.` };
}

function feedbackFor(session: Session): Feedback {
  const strengths = session.evaluations.flatMap((item) => item.strength ? [item.strength] : []);
  const gaps = session.evaluations.flatMap((item) => item.gap ? [item.gap] : []);
  const unique = (items: string[]) => [...new Set(items)].slice(0,3);
  const avgLength = session.evaluations.reduce((sum,item) => sum + item.length,0) / Math.max(session.evaluations.length,1);
  const covered = session.daysCovered.map((day) => `Day ${day}`).join(", ");
  const strengthList = unique(strengths);
  const gapList = unique(gaps);
  if (strengthList.length < 2) strengthList.push("Maintained the conversation across multiple technical domains without losing the core question.");
  if (gapList.length < 2) gapList.push("Make trade-offs explicit: name the rejected option, the constraint, and the evidence for your choice.");

  return {
    summary: `${session.candidate.member.name} completed an 8-question personalized interview covering ${covered}. The responses averaged ${Math.round(avgLength)} words and showed ${strengths.length >= gaps.length ? "solid working knowledge with room to sharpen production reasoning" : "foundational understanding that now needs deeper system-level explanation"}.`,
    strengths: unique(strengthList),
    gaps: unique(gapList),
    next: [
      `Revisit ${session.plan[0].title} and practise a two-minute answer using architecture, trade-off, failure mode, and metric.`,
      `Create one production incident scenario for ${session.plan[3]?.title ?? session.plan[1].title} and explain the debugging sequence out loud.`,
      "Repeat the interview after writing concise STAR-style engineering stories for two cohort projects.",
    ],
  };
}

function badRequest(reply: string, status = 400) {
  return NextResponse.json({ reply, done:false }, { status });
}

export async function POST(request: Request) {
  let body: { sessionId?: string; candidate?: Candidate; message?: string };
  try { body = await request.json(); } catch { return badRequest("Request body must be valid JSON."); }
  if (!body.sessionId?.trim()) return badRequest("sessionId is required.");

  if (body.candidate) {
    if (!body.candidate.member?.id || !Array.isArray(body.candidate.missions)) return badRequest("candidate does not match the required candidate schema.");
    const plan = buildPlan(body.candidate);
    const session: Session = { candidate:body.candidate, plan, questionNumber:1, daysCovered:[], evaluations:[], lastQuestion:"" };
    const next = questionFor(session);
    session.daysCovered = [next.day.day];
    session.lastQuestion = next.question;
    sessions.set(body.sessionId, session);
    const response: InterviewApiResponse = { reply:next.question, done:false, meta:{ questionNumber:1, day:next.day.day, topic:next.topic, isFollowUp:false, daysCovered:session.daysCovered } };
    return NextResponse.json(response);
  }

  const session = sessions.get(body.sessionId);
  if (!session) return badRequest("Interview session not found. Start again with the candidate object.", 404);
  if (!body.message?.trim()) return badRequest("message is required for an active interview.");

  const sequence = [0,0,1,2,3,1,4,5];
  const answeredDay = session.plan[sequence[Math.min(session.questionNumber - 1, sequence.length - 1)]] ?? session.plan[0];
  session.evaluations.push(evaluate(body.message, answeredDay));

  if (session.questionNumber >= 8) {
    const feedback = feedbackFor(session);
    sessions.delete(body.sessionId);
    return NextResponse.json({ reply:"Interview completed. Your feedback is ready.", done:true, feedback } satisfies InterviewApiResponse);
  }

  session.questionNumber += 1;
  const next = questionFor(session, body.message);
  if (!session.daysCovered.includes(next.day.day)) session.daysCovered.push(next.day.day);
  session.lastQuestion = next.question;
  return NextResponse.json({ reply:next.question, done:false, meta:{ questionNumber:session.questionNumber, day:next.day.day, topic:next.topic, isFollowUp:next.followUp, daysCovered:session.daysCovered } } satisfies InterviewApiResponse);
}
