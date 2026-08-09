# Testing and Submission

## Automated checks

Run before submission:

```bash
npm install
npm run typecheck
npm run lint
npm run build
```

## Required functional test

1. Open `/setup`.
2. Confirm that 20 candidate profiles are available.
3. Select a candidate.
4. Start the interview.
5. Confirm that Question 1 references a completed curriculum day.
6. Answer all eight questions.
7. Give one strong answer and one vague answer; confirm that subsequent questions challenge, clarify, or change direction appropriately.
8. Confirm that at least four different days appear in the coverage panel.
9. Complete Question 8.
10. Confirm navigation to `/report`.
11. Confirm that the report displays a summary, strengths, gaps, next actions, and five evaluation dimensions.

## API test matrix

| Test | Expected result |
| --- | --- |
| Missing `sessionId` | HTTP 400 and `done: false` |
| Invalid candidate schema | HTTP 400 and `done: false` |
| Candidate with fewer than four passed days | HTTP 422 and `done: false` |
| Valid candidate start | First question and `done: false` |
| Unknown session message | HTTP 404 and `done: false` |
| Turns 1–7 | Next question and `done: false` |
| Turn 8 | `done: true` and complete feedback object |
| Non-JSON body | HTTP 400 with a controlled JSON response |
| Oversized message/body | HTTP 400/413 with a controlled JSON response |
| Rapid abusive requests | HTTP 429 with `Retry-After` |

## Semantic and resilience QA

- With `GEMINI_API_KEY` configured, verify that a technically wrong but long answer receives a low technical-accuracy score and an appropriate clarification or challenge.
- Verify that a strong answer receives a deeper production constraint rather than a generic template.
- Disable `INTERVIEW_LLM_ENABLED` and complete all eight questions to verify the fallback path.
- During a Netlify interview, allow a cold function invocation and confirm the session resumes from Netlify Blobs.
- Confirm that final responses contain `Cache-Control: no-store` and never expose the API key.

## Responsive QA

Check at minimum:

- 320 × 568
- 390 × 844
- 768 × 1024
- 1366 × 768
- 1440 × 900

Verify:

- No horizontal overflow
- Navigation remains reachable
- Candidate information does not truncate essential content
- Messages wrap correctly
- Composer remains usable with the on-screen keyboard
- Report cards stack on mobile

## Accessibility QA

- Navigate the complete flow using only the keyboard.
- Confirm visible focus states.
- Confirm the answer field has an accessible label.
- Confirm sufficient colour contrast in both themes.
- Enable reduced motion and verify that animations stop.
- Confirm status is not communicated by colour alone.

## Submission contents

- Complete source repository
- `README.md`
- `data/curriculum.json`
- `data/candidates.json`
- `data/technical-spec.md`
- Architecture and API documentation
- Deployment configuration
- Repository URL
- Live deployment URL

## Judge demonstration script

1. Start on `/` and explain that the product builds the interviewer, not a fixed questionnaire.
2. Open `/setup` and select a candidate with higher-attempt missions.
3. Explain how the planner prioritizes completed missions and curriculum diversity.
4. Answer one question and show the answer-dependent follow-up.
5. Point out session progress and curriculum-day coverage.
6. Open a completed `/report` flow and explain the actionable feedback structure.
7. Mention that the exact required `POST /api/interview` contract is implemented.
