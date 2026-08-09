# Product Requirements

## Product statement

The ABTalks Interview Agent conducts personalized technical interviews based on a learner's journey through the 31-day Enterprise AI Engineering cohort.

The goal is to help learners explain the systems they built and defend the engineering decisions behind those systems in a realistic interview conversation.

## Primary user

A learner who has completed part or all of the ABTalks AI cohort and wants to practise technical communication before an interview.

## User journey

1. Review the purpose of the product.
2. Select a candidate profile.
3. Start a personalized interview.
4. Answer at least eight technical questions.
5. Receive contextual follow-up questions.
6. Complete coverage across at least four curriculum days.
7. Review a structured feedback report.

## Functional requirements

| ID | Requirement | Implementation |
| --- | --- | --- |
| FR-01 | Conduct a conversational technical interview | Chat-style interview room at `/interview` |
| FR-02 | Ask at least eight questions | Session completes only after the eighth answer |
| FR-03 | Cover at least four curriculum days | Question planner selects six distinct completed days when available |
| FR-04 | Generate follow-up questions | The semantic interviewer selects follow-up, clarification, challenge, new-topic, or synthesis mode from answer evidence |
| FR-05 | Maintain context | `sessionId` addresses strongly consistent Netlify session state, with memory caching and validated browser recovery |
| FR-06 | Personalize the interview | Planner uses completed missions, attempt counts, candidate signals, role, and prior-answer performance |
| FR-07 | Produce actionable feedback | Final response contains `summary`, `strengths`, `gaps`, and `next`, plus additive five-dimension evaluation metadata |
| FR-08 | Expose the required endpoint | `POST /api/interview` |

## Experience requirements

- The experience must resemble an interview rather than a questionnaire.
- Live scoring remains hidden to avoid disrupting the interview rhythm.
- The current topic, question progress, and covered days remain visible.
- Candidate answers support multiple lines and keyboard submission.
- The report separates demonstrated strengths, gaps, and next actions.
- The report exposes five post-interview evaluation dimensions while keeping live scores hidden.
- Light and dark themes must both remain readable and accessible.
- Motion must be reduced when the operating system requests reduced motion.

## Data requirements

- `data/curriculum.json` is the source of curriculum days, tools, and objectives.
- `data/candidates.json` is the source of candidate profiles, missions, attempts, skipped topics, and learning signals.
- Candidate and curriculum data are synthetic.

## Non-goals

The following are intentionally excluded:

- Voice interaction
- Authentication
- Real user accounts
- Production user database
- Long-term conversation history
- Mobile-native application

## Acceptance criteria

- A valid candidate can start a session.
- The API returns `done: false` before completion.
- Every subsequent message uses the same `sessionId`.
- The agent asks exactly eight questions in the included MVP.
- The final response returns `done: true` and the four required feedback fields.
- Direct navigation to `/`, `/setup`, `/interview`, and `/report` renders safely.
- The production build succeeds without TypeScript errors.
