ABTalks Interview Agent — Prompt Record

This file documents the structured AI-assisted workflow used to design, build, test, and present the ABTalks Interview Agent.

It has been cleaned for submission: conversational phrasing, abandoned architectures, unused providers, and speculative features have been removed.

Important implementation disclosure

The submitted MVP does not call an external LLM at runtime. Its interview behaviour is produced by a deterministic, curriculum-aware engine implemented in app/api/interview/route.ts.

The engine:

reads the supplied curriculum and candidate data;

prioritizes completed and higher-attempt missions;

plans coverage across multiple curriculum days;

extracts a meaningful concept from the previous answer for follow-ups;

evaluates answer length and curriculum vocabulary;

generates structured feedback after eight answers; and

preserves the organiser's required POST /api/interview contract.

The prompts below were development instructions given to coding and presentation assistants. They are not hidden runtime prompts.

Prompt structure used

The main prompts use six layers of context:

Identity context — who the assistant should act as.

World context — the product situation and constraints.

Task context — the concrete outcome required.

Example context — examples of acceptable and unacceptable outcomes.

Instruction context — implementation and quality rules.

Data context — authoritative files and contracts.

Whenever a prompt creates documentation, the output must be a Markdown .md file.

1. Source audit and requirements prompt

IDENTITY CONTEXT
Act as a senior product analyst and technical-specification reviewer. Be precise, conservative, and traceable. Do not invent requirements.

WORLD CONTEXT
ABTalks runs a 31-day Enterprise AI Engineering Cohort. Learners complete missions covering RAG, vector databases, prompt engineering, agentic AI, MCP, deployment, and production AI systems. They need practice explaining what they built and defending their engineering decisions.

The challenge is to build the interviewer, not a prewritten interview. The experience must be personalized, conversational, multi-turn, contextual, and capable of producing actionable final feedback.

TASK CONTEXT
Read the supplied curriculum, candidate profiles, and technical specification completely. Produce the following Markdown documents:

- docs/01-PRODUCT-REQUIREMENTS.md
- docs/03-API-CONTRACT.md
- docs/05-TESTING-AND-SUBMISSION.md

Extract mandatory requirements, explicit non-goals, candidate and curriculum schemas, API payloads, response shapes, edge cases, risks, acceptance criteria, and a definition of done.

EXAMPLE CONTEXT
Bad outcome:
- Treating candidate profile fields as optional guesses.
- Adding authentication, accounts, voice, or a database as mandatory scope.
- Changing the public API response to a custom schema.
- Saying that an interview is adaptive without defining how to verify it.

Good outcome:
- Every requirement has a source and a testable acceptance criterion.
- The start, turn, and completion requests match the organiser contract.
- Completion is verified only after eight answered questions.
- Feedback contains summary, strengths, gaps, and next arrays.

INSTRUCTION CONTEXT
- Treat supplied files as authoritative.
- Separate mandatory, optional, and out-of-scope requirements.
- Require at least eight questions across at least four curriculum days.
- Require answer-dependent follow-ups and maintained session context.
- Do not design application code yet.
- Every generated document must be a Markdown `.md` file.

DATA CONTEXT
- data/curriculum.json
- data/candidates.json
- data/technical-spec.md
- Required endpoint: POST /api/interview

2. Architecture and implementation prompt

IDENTITY CONTEXT
Act as a senior full-stack TypeScript engineer and pragmatic AI systems architect. Optimize for correctness, explainability, deployment reliability, and hackathon delivery speed.

WORLD CONTEXT
The repository must contain one deployable web application. The dataset is small and synthetic. Authentication, production user accounts, long-term history, voice interaction, vector databases, and heavy multi-agent orchestration are out of scope.

The MVP must work without an external model key. It must remain honest about this architectural choice.

TASK CONTEXT
Build the ABTalks Interview Agent as a self-contained Next.js application with:

- Next.js App Router, React, and TypeScript;
- a landing page at `/`;
- candidate selection at `/setup`;
- a multi-turn interview room at `/interview`;
- a feedback report at `/report`;
- the required `POST /api/interview` endpoint;
- supplied files preserved under `data/`; and
- product, architecture, API, design, testing, and limitations documentation under `docs/`.

Implement a deterministic curriculum-aware interview engine. Select relevant completed missions, prefer module diversity, prioritize higher-attempt concepts, ask exactly eight questions, create answer-dependent follow-ups, and return structured final feedback.

EXAMPLE CONTEXT
Bad outcome:
- A static array of unrelated questions.
- A UI-only prototype with a fake submit button.
- Completing the interview before the eighth answer.
- Asking about skipped topics as though they were completed.
- Requiring a secret API key that judges do not have.
- Returning HTML error pages to a client expecting JSON.

Good outcome:
- Candidate selection changes the planned curriculum topics.
- Questions 2, 4, and 6 build on the previous response.
- The interface displays question progress and days covered.
- Scores remain hidden until completion.
- The eighth answer returns `done: true` and valid feedback.
- The app deploys on Netlify or Vercel without environment variables.

INSTRUCTION CONTEXT
- Preserve the exact public API contract.
- Use the caller-provided sessionId throughout the interview.
- Validate malformed JSON, missing sessionId, invalid candidate data, and empty messages.
- Keep runtime behaviour deterministic and testable.
- Do not claim that an external LLM is used.
- Do not add unnecessary dependencies or infrastructure.
- Use typed request, response, candidate, curriculum, and feedback models.
- Any generated documentation must be a Markdown `.md` file.

DATA CONTEXT
- data/curriculum.json
- data/candidates.json
- data/technical-spec.md
- docs/01-PRODUCT-REQUIREMENTS.md
- docs/03-API-CONTRACT.md

3. Deterministic interview-engine prompt

IDENTITY CONTEXT
Act as an interview-systems engineer. Design a controlled adaptive interviewer whose behaviour can be explained and tested.

WORLD CONTEXT
The interviewer must personalize questions from candidate missions and a 31-day curriculum. The public experience should feel conversational even though the MVP uses deterministic logic rather than an external LLM.

TASK CONTEXT
Implement the interview engine inside `app/api/interview/route.ts`.

For a new session:
1. Filter the candidate's passed missions.
2. Sort higher-attempt missions first.
3. Prefer different curriculum modules before choosing additional days from the same module.
4. Build a plan containing enough days to support eight questions and at least four-day coverage.
5. Return the welcome message and first grounded question.

For subsequent turns:
1. Evaluate the latest answer using length, relevant curriculum vocabulary, implementation detail, and evidence.
2. Extract a meaningful concept from the answer.
3. Use that concept in follow-up questions.
4. Track question number, evaluations, and covered days.
5. Return only one next question per response.
6. Complete only after the eighth answer.

For completion:
Return `reply`, `done: true`, and feedback containing `summary`, `strengths`, `gaps`, and `next`.

EXAMPLE CONTEXT
Bad follow-up:
"Can you explain more?"

Good follow-up:
"You mentioned caching. Suppose it succeeds in a prototype but becomes inconsistent under production traffic. What would you inspect first, and what evidence would change your design?"

Bad feedback:
"Good job. Keep learning."

Good feedback:
"Make trade-offs explicit: name the rejected option, the constraint, and the evidence supporting your choice."

INSTRUCTION CONTEXT
- Ask one question per turn.
- Do not expose internal scores or reasoning.
- Ground baseline questions in curriculum titles and objectives.
- Use role and experience only for respectful calibration.
- Use deterministic tie-breaking.
- Deduplicate repeated feedback items.
- Delete completed server sessions after producing feedback.
- Preserve the exact API response contract.

DATA CONTEXT
- Candidate member details, missions, attempts, passed status, and signals.
- Curriculum day titles, objectives, tools, and module ranges.
- Session fields: candidate, plan, questionNumber, daysCovered, evaluations, and lastQuestion.

4. Premium frontend and UI/UX redesign prompt

IDENTITY CONTEXT
Act as an award-level product designer and senior frontend engineer specializing in premium AI SaaS interfaces, information hierarchy, accessibility, responsive design, and restrained motion.

WORLD CONTEXT
This is a professional technical interview product. The experience must build trust, reduce confusion, and keep candidates focused under pressure. The visual personality is immersive and futuristic, but the interface must never feel like a game or a generic neon AI dashboard.

TASK CONTEXT
Redesign all user-facing routes while preserving working interview behaviour.

Create:
- a high-impact product landing page;
- a searchable candidate-selection experience;
- a focused three-column desktop interview room;
- a clear single-column mobile interview room;
- a structured feedback report;
- meaningful empty, loading, retry, and completed states;
- a distinct light theme and dark theme; and
- CSS-based dimensional visuals and subtle animation without heavy 3D libraries.

VISUAL DIRECTION
- Light-blue and white glassmorphism.
- Pale cloud-like radial gradients.
- Translucent white surfaces with restrained borders and shadows.
- Navy typography with cobalt and cyan actions.
- Generous whitespace and editorial hierarchy.
- A CSS-based floating Interview Core using rings, blur, transforms, and context cards.
- A separate cinematic dark system using near-black navy, luminous azure surfaces, and cyan status indicators.

EXAMPLE CONTEXT
Bad outcome:
- Excessive neon, glow, blur, gradients, or animation.
- Tiny low-contrast text.
- Decorative charts with fake data.
- A dark theme that is only a color inversion.
- A landing page that looks unrelated to the interview room.

Good outcome:
- The landing page explains the product within one screen.
- Candidate learning signals are readable and useful.
- The active question and response field dominate the interview room.
- Progress and curriculum coverage are always understandable.
- Dark mode has its own intentional visual character.
- Reduced-motion users receive a stable equivalent experience.

INSTRUCTION CONTEXT
- Preserve all routes, API calls, and functional state.
- Use semantic HTML and visible keyboard focus.
- Provide practical touch targets and responsive layouts.
- Support `prefers-reduced-motion`.
- Keep live scores hidden.
- Avoid WebGL, remote 3D models, and unnecessary asset downloads.
- Derive component states from real application data.
- Any generated design documentation must be a Markdown `.md` file.

DATA CONTEXT
- Existing Next.js routes and components.
- Candidate and curriculum datasets.
- ABTalks wordmark asset.
- Required product behaviour from the technical specification.

5. Session isolation, reset, and recovery prompt

IDENTITY CONTEXT
Act as a senior frontend-state and serverless reliability engineer.

WORLD CONTEXT
Many people may open the deployed application from different devices. There are no user accounts or production databases. Each browser must have independent state, and starting a new interview must not reuse stale feedback.

Serverless platforms may route consecutive requests to different instances, so in-memory state alone cannot be assumed to survive every turn.

TASK CONTEXT
Audit and fix session lifecycle behaviour.

Required behaviour:
- Every browser/device has independent localStorage.
- Selecting "Begin personalized interview" creates a new UUID sessionId.
- Starting a new session clears the previous active transcript and visible final report.
- Completing an interview stores its final report only on the current device.
- "New session" clears active interview state and returns to candidate selection.
- A refresh during an interview restores the local transcript.
- If the server session is unavailable, the client may send the candidate and prior answers so the API can reconstruct deterministic progression.
- One user's session must never become visible to another user.

EXAMPLE CONTEXT
Bad outcome:
- A completed report appears for every visitor.
- A second candidate inherits the first candidate's transcript.
- Refreshing produces an unrecoverable 404.
- Starting a new interview silently resumes an old session.

Good outcome:
- State persists only for the current browser where appropriate.
- A new device starts with no report.
- New session creates a clean interview.
- Serverless reconstruction produces the same next-question state.

INSTRUCTION CONTEXT
- Use clearly namespaced localStorage keys.
- Never place data in a shared static JSON file.
- Clear stale report state at interview start.
- Prevent double submission.
- Preserve the candidate's typed answer after a recoverable network error.
- Keep long-term accounts and server-side history out of scope.
- Document the lifecycle in a Markdown `.md` file.

DATA CONTEXT
- sessionId
- selected candidate
- previous answer list
- active transcript
- final feedback
- theme preference

6. API error-handling prompt

IDENTITY CONTEXT
Act as a TypeScript API integration engineer focused on resilient user-facing error handling.

WORLD CONTEXT
The client expects JSON, but hosting proxies and failed server routes can sometimes return HTML. Calling `response.json()` blindly produces errors such as "Unexpected token '<', '<!doctype' is not valid JSON."

TASK CONTEXT
Harden the interview client and API route so invalid or non-JSON responses do not crash the experience.

EXAMPLE CONTEXT
Bad outcome:
- Showing raw parser errors to the candidate.
- Clearing the typed answer when retry is needed.
- Treating an HTML error page as an interview response.

Good outcome:
- Check `response.ok` and the response content type.
- Parse JSON safely.
- Return controlled JSON errors from the API route.
- Display a concise retry message.
- Preserve the candidate's answer for resubmission.

INSTRUCTION CONTEXT
- Validate the response object before accessing `reply`, `done`, or `feedback`.
- Do not expose stack traces or infrastructure details.
- Keep error messages actionable and professional.
- Do not advance the local question number after a failed request.
- Preserve the required successful response schema.

DATA CONTEXT
- POST /api/interview
- InterviewApiResponse
- HTTP status
- Content-Type response header
- Current typed answer and session state

7. Final QA and submission-audit prompt

IDENTITY CONTEXT
Act as a hackathon technical reviewer, QA engineer, accessibility auditor, and skeptical judge.

WORLD CONTEXT
The submission must demonstrate working behaviour, not just polished screenshots. It will be inspected through the deployed site, GitHub repository, and required API endpoint.

TASK CONTEXT
Audit the complete repository and deployed experience.

Verify:
- all supplied source files are present and unmodified;
- all routes load directly and after refresh;
- candidate selection changes interview focus;
- every completed interview asks eight questions;
- at least four curriculum days are covered;
- follow-ups use concepts from previous responses;
- `POST /api/interview` matches the organiser contract;
- feedback contains only the required structured fields;
- new sessions clear stale active feedback;
- separate browsers do not share local state;
- light and dark themes work;
- keyboard focus and reduced motion work;
- mobile and desktop layouts remain usable;
- README setup, validation, live demo, and architecture claims are accurate;
- no secrets, unsupported claims, or unnecessary generated files are committed.

EXAMPLE CONTEXT
Bad outcome:
- Declaring readiness because the landing page looks polished.
- Claiming an external LLM, database, authentication, or persistence that is not implemented.
- Ignoring a contract mismatch because the frontend appears to work.

Good outcome:
- A traceable PASS/FAIL checklist with reproducible commands.
- Exact defect descriptions and minimal fixes.
- Honest limitations documented before submission.

INSTRUCTION CONTEXT
- Run typecheck, lint, and production build.
- Exercise one complete interview from start through feedback.
- Test malformed JSON, missing sessionId, unknown session, empty message, refresh, retry, and new-session reset.
- Review the final Git diff for secrets and accidental files.
- Do not commit or push until the user reviews the result.
- Write the audit as a Markdown `.md` file.

DATA CONTEXT
- Complete repository
- Supplied technical specification
- Deployed Netlify application
- README.md
- docs/
- POST /api/interview

8. Presentation video prompt

This prompt was used only to prepare the project presentation. It is not part of the application runtime.

Create a polished 3–4 minute hackathon product-presentation video for ABTalks Interview Agent by Team NISQ Guardians.

Use a premium modern SaaS storytelling style that matches the supplied UI: light-blue glassmorphism, white space, subtle cloud-like gradients, elegant motion, crisp typography, and occasional deep-navy dark-mode transitions. Use the supplied product screenshots as the primary visuals and do not invent unrelated screens.

Tell a clear story:
1. Learners complete a 31-day AI engineering cohort but struggle to explain their systems in technical interviews.
2. ABTalks Interview Agent transforms each learner's completed missions and learning signals into a personalized technical interview.
3. Show candidate selection and likely focus areas.
4. Show the eight-question interview, multi-day curriculum coverage, answer-dependent follow-ups, maintained context, and hidden scores.
5. Show structured feedback containing strengths, gaps, and practical next actions.
6. Briefly explain the deterministic curriculum-aware engine, session recovery, and device-local continuity.
7. Do not claim that an external LLM is used.
8. Highlight the premium light-blue glassmorphism interface and distinct dark mode.

Keep the narration concise, credible, and understandable to hackathon judges.

Mention the team once near the end:
- Pulijala Bhavani — Frontend, UI/UX, and integration
- Ashok Vallabhuni — Backend development
- Sannith Reddy — Testing and documentation

Close with: "ABTalks Interview Agent — turn completed lessons into confident answers."

Presentation visual-style prompt

Premium futuristic SaaS product film. Use a refined light-blue and white glassmorphism aesthetic with soft cloud-like gradients, floating translucent panels, clean navy typography, subtle luminous-blue accents, smooth elegant motion, and occasional deep-navy dark-mode transitions.

Keep the result professional, minimal, and high-end. Avoid cartoonish visuals, excessive neon, busy compositions, fake analytics, and unrelated interface designs. Match the supplied ABTalks Interview Agent screenshots closely.

Final source-of-truth order

When any prompt conflicts with another source, use this priority:

data/technical-spec.md

data/curriculum.json

data/candidates.json

Existing verified application behaviour

Approved architecture and product documentation

Development prompts in this file

Project references

Live application: https://abtalks-interview-agent-ng.netlify.app/

Repository: https://github.com/pulijala-bhavani/team-nisq-guardians

