# ABTalks Interview Agent

A professional, curriculum-aware technical interview experience for the ABTalks 31-day Enterprise AI Engineering cohort.

The agent selects questions from a candidate's completed missions, adapts follow-up questions to previous answers, maintains session context, covers multiple curriculum days, and produces structured actionable feedback.

## Core capabilities

- Personalized interview planning from `candidates.json`
- Questions grounded in the 31-day `curriculum.json`
- Minimum of eight questions per completed interview
- Coverage of at least four curriculum days
- Follow-up questions based on previous answers
- Session-scoped context through `sessionId`
- Structured feedback with `summary`, `strengths`, `gaps`, and `next`
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
- Custom responsive CSS and CSS-based 3D animation
- Browser `localStorage` for device-local interview/report continuity
- Server-side session map for the included self-contained MVP interview engine

No authentication, production user database, voice interaction, or external LLM key is required.

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
Live demo: [https://abtalks-interview-agent-ng.netlify.app/](https://abtalks-interview-agent-ng.netlify.app/)

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
  -d '{"sessionId":"demo-123","candidate":{"member":{"id":"CAND-001","name":"Sarah Johnson","jobRole":"Senior Data Engineer","yearsExperience":9,"education":"MS Computer Science","status":"COMPLETED"},"missions":[],"signals":{"commitDays":28,"missionsCompleted":30,"missionsFirstTry":20}}}'
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

No environment variables are required for the included MVP.

## Data and privacy

All supplied curriculum and candidate data are synthetic and intended only for the hackathon. The project does not implement authentication, persistent user accounts, or long-term conversation history.

## Documentation

- [Product requirements](docs/01-PRODUCT-REQUIREMENTS.md)
- [Architecture](docs/02-ARCHITECTURE.md)
- [API contract](docs/03-API-CONTRACT.md)
- [Design system](docs/04-DESIGN-SYSTEM.md)
- [Testing and submission](docs/05-TESTING-AND-SUBMISSION.md)
- [Security and limitations](docs/06-SECURITY-AND-LIMITATIONS.md)
- [Submission checklist](SUBMISSION_CHECKLIST.md)
