# ABTalks Interview Agent

A professional, curriculum-aware technical interview experience for the ABTalks 31-day Enterprise AI Engineering cohort.

- Live application: [abtalks-interview-agent-ng.netlify.app](https://abtalks-interview-agent-ng.netlify.app/)
- Source repository: [team-nisq-guardians](https://github.com/pulijala-bhavani/team-nisq-guardians)

The agent selects questions from a candidate's completed missions, uses Gemini to understand and challenge each answer, maintains session context, covers multiple curriculum days, and produces evidence-grounded actionable feedback. A deterministic controller enforces the interview contract and provides a complete fallback if the model is unavailable.

## Core capabilities

- Personalized interview planning from `candidates.json`
- Questions grounded in the 31-day `curriculum.json`
- Minimum of eight questions per completed interview
- Coverage of at least four curriculum days
- Semantic answer evaluation and answer-dependent follow-ups through Gemini
- Deterministic coverage, validation, and fallback authority
- Session-scoped context through `sessionId`
- Durable Netlify Blobs session storage with browser-assisted recovery
- Structured feedback with `summary`, `strengths`, `gaps`, and `next`
- Grounded readiness scoring across five evaluation dimensions
- Candidate selection, live interview room, and feedback report
- Light cloud-glass theme and a distinct cinematic dark theme
- Responsive layouts and reduced-motion support
- Required `POST /api/interview` endpoint

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Product overview and landing experience |
| `/setup` | Candidate selection and interview configuration |
| `/interview` | Multi-turn technical interview room |
| `/report` | Structured final feedback |
| `/api/interview` | Required interview API endpoint |

## Technology

- Next.js 16 App Router
- React 19
- TypeScript
- Gemini 2.5 Flash through server-side structured JSON requests
- Netlify Blobs for strongly consistent deployed session storage
- Custom responsive CSS and CSS-based 3D animation
- Browser `localStorage` for device-local interview/report continuity
- Hybrid session continuity: durable store, memory cache, and client-assisted reconstruction

No authentication, persistent user accounts, or voice interaction is required. Without a Gemini key, the deterministic fallback still provides a complete working interview.

## Project structure

```text
app/
  api/interview/route.ts   Required API endpoint and adaptive interview engine
  interview/page.tsx       Interview route
  report/page.tsx          Feedback route
  setup/page.tsx           Candidate-selection route
  globals.css              Complete design system and responsive styles
  layout.tsx               Root metadata and theme initialization
  page.tsx                 Landing page
components/
  interview-room.tsx       Multi-turn interview UI
  report-view.tsx          Structured feedback UI
  setup-client.tsx         Candidate selection and session initialization
  site-nav.tsx             Navigation and theme control
data/
  candidates.json          Provided synthetic candidate profiles
  curriculum.json          Provided 31-day curriculum
  technical-spec.md        Provided API specification
docs/                      Product, architecture, API, design, and QA documents
lib/types.ts               Shared TypeScript contracts
lib/interview-engine.ts    Coverage controller, fallback engine, and recovery logic
lib/gemini-interviewer.ts  Structured semantic generation and evaluation adapter
public/                    ABTalks wordmark asset
```

## Local setup

Requirements:

- Node.js 20.9 or newer
- npm 10 or newer

Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Enable semantic AI locally

1. Create an API key in [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Copy `.env.example` to `.env.local`.
3. Set `GEMINI_API_KEY` in `.env.local`.
4. Restart `npm run dev`.

The key is read only by the server route. Never prefix it with `NEXT_PUBLIC_` or commit `.env.local`.

## Validation

```bash
npm run typecheck
npm run lint
npm run build
```

## Required API contract

Start a session:

```bash
curl -X POST http://localhost:3000/api/interview \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"demo-123","candidate":{"member":{"id":"CAND-001","name":"Sarah Johnson","jobRole":"Senior Data Engineer","yearsExperience":9,"education":"MS Computer Science","status":"COMPLETED"},"missions":[{"day":7,"title":"Embeddings Explained","passed":true,"attempts":1},{"day":12,"title":"Prompt Engineering Fundamentals","passed":true,"attempts":4},{"day":22,"title":"Multi-Agent Orchestration","passed":true,"attempts":2},{"day":28,"title":"Docker & Kubernetes Deployment","passed":true,"attempts":3}],"signals":{"commitDays":28,"missionsCompleted":30,"missionsFirstTry":20}}}'
```

Continue the same session:

```bash
curl -X POST http://localhost:3000/api/interview \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"demo-123","message":"My answer..."}'
```

See [docs/03-API-CONTRACT.md](docs/03-API-CONTRACT.md) for the complete contract.

## Deployment

### Vercel

1. Push this folder to GitHub.
2. Import the repository into Vercel.
3. Keep the detected Next.js settings.
4. Deploy.

### Netlify

1. Push this folder to GitHub.
2. Import the repository into Netlify.
3. Netlify will read `netlify.toml` and use the Next.js adapter.
4. Deploy.

For the full semantic interviewer, configure `GEMINI_API_KEY` in the deployment dashboard and redeploy. `GEMINI_MODEL`, `GEMINI_TIMEOUT_MS`, and `INTERVIEW_LLM_ENABLED` are optional. Netlify Blobs is provisioned automatically for the deployed site. If the model is unavailable, the deterministic fallback preserves the full interview flow.

## Data and privacy

All supplied curriculum and candidate data are synthetic and intended only for the hackathon. The project does not implement authentication, persistent user accounts, or cross-device report history. Active Netlify sessions expire after two hours; completed reports remain device-local.

## Documentation

- [Product requirements](docs/01-PRODUCT-REQUIREMENTS.md)
- [Architecture](docs/02-ARCHITECTURE.md)
- [API contract](docs/03-API-CONTRACT.md)
- [Design system](docs/04-DESIGN-SYSTEM.md)
- [Testing and submission](docs/05-TESTING-AND-SUBMISSION.md)
- [Security and limitations](docs/06-SECURITY-AND-LIMITATIONS.md)
- [Submission checklist](SUBMISSION_CHECKLIST.md)
