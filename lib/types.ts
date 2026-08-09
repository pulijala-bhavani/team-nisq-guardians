export type CandidateMember = {
  id: string;
  name: string;
  jobRole: string;
  yearsExperience: number;
  education: string;
  status: string;
};

export type Mission = {
  day: number;
  title: string;
  passed?: boolean;
  skipped?: boolean;
  attempts?: number;
};

export type Candidate = {
  member: CandidateMember;
  missions: Mission[];
  signals: {
    commitDays: number;
    missionsCompleted: number;
    missionsFirstTry: number;
  };
};

export type CurriculumDay = {
  day: number;
  title: string;
  type: string;
  tools: string[];
  objectives: string[];
};

export type Feedback = {
  summary: string;
  strengths: string[];
  gaps: string[];
  next: string[];
};

export type EvaluationDimensions = {
  technicalAccuracy: number;
  technicalSpecificity: number;
  reasoning: number;
  communication: number;
  productionAwareness: number;
};

export type EvaluationSummary = {
  overallScore: number;
  dimensions: EvaluationDimensions;
  engine: "gemini" | "deterministic-fallback" | "hybrid";
};

export type InterviewMeta = {
  questionNumber: number;
  day: number;
  topic: string;
  isFollowUp: boolean;
  daysCovered: number[];
};

export type InterviewApiResponse = {
  reply: string;
  done: boolean;
  feedback?: Feedback;
  evaluation?: EvaluationSummary;
  meta?: InterviewMeta;
};

export type InterviewRecoveryMessage = {
  role: "agent" | "user";
  content: string;
  meta?: InterviewMeta;
};

export type StoredMessage = {
  id: string;
  role: "agent" | "user";
  content: string;
  meta?: InterviewMeta;
};

export type StoredSession = {
  sessionId: string;
  candidate: Candidate;
  messages: StoredMessage[];
  startedAt: number;
  questionCount: number;
  daysCovered: number[];
};