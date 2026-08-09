# Security and Limitations

## Implemented controls

- No authentication or real user identity is collected.
- Gemini credentials are read only from server-side environment variables.
- Request bodies are limited to 120 KB.
- Candidate fields, missions, curriculum days, session IDs, messages, answers, and recovery history are validated.
- Candidate plans accept only explicit passed missions mapped to supplied curriculum days.
- Messages are limited to 8,000 characters.
- Per-IP and per-session rate limits reduce accidental or basic automated abuse.
- Duplicate simultaneous turns for the same session are rejected.
- Model output must match a strict JSON schema and then passes application validation.
- Candidate answers are treated as untrusted quoted data in the model prompt.
- Gemini cannot override question-count, coverage, eligibility, or completion policy.
- Model timeouts, quota errors, invalid JSON, and invalid semantic decisions fall back to the deterministic engine.
- React renders interview content as text rather than raw HTML.
- Completed server sessions are deleted immediately.
- Active sessions expire after two hours.

## Data handling

The supplied curriculum and candidate profiles are synthetic.

When `GEMINI_API_KEY` is configured, selected synthetic candidate context and interview answers are sent to the Gemini API for semantic evaluation and question generation. The application does not send secrets or browser storage contents unrelated to the active interview.

The browser stores:

- the active transcript;
- the final report;
- up to ten device-local report records; and
- the theme preference.

This information is isolated per browser origin. Starting a new interview clears the visible previous final report. Users can remove all browser records by clearing site data.

## Session continuity

Netlify deployments store active sessions in Netlify Blobs using strongly consistent reads. A memory cache reduces latency. The bundled browser additionally sends validated recovery history so a missing session can be reconstructed without losing the current answer.

Netlify Blobs uses last-write-wins rather than distributed transactions. The UI prevents double submission, the route rejects overlapping turns within one function instance, and the session-specific rate limit reduces abuse. A high-scale production version should use a transactional store or distributed lock.

## Prompt-injection boundary

Candidate content is included as JSON-quoted evidence under explicit instructions that it cannot change the system policy. Model responses cannot directly perform actions. They are limited to a validated assessment and next-question or feedback schema. The deterministic controller independently verifies allowed days and completion state.

## Remaining proportional limitations

- There are no persistent user accounts or cross-device report synchronization because both are explicitly out of scope.
- In-memory rate limiting is instance-local; a production system should use a distributed limiter.
- External callers using only the minimum contract depend on the durable Netlify session. On platforms without Netlify Blobs, the bundled recovery fields provide the strongest continuity.
- Automated semantic evaluation can still be imperfect. The score should be treated as interview-preparation guidance, not a hiring decision.
- Netlify Blobs is suitable for this hackathon workload but is not a replacement for a transactional production database.

## Dependency audit note

Next.js and its compiler dependencies are pinned to the current patched `16.3.0` release. The remaining npm audit finding is in `image-size`, a transitive dependency of the current `@netlify/blobs` package. No patched upstream release is available. This application does not expose image upload, image parsing, or any path that passes candidate-controlled image data to that package; the dependency is reached only through Netlify's storage library. Keep `@netlify/blobs` updated when Netlify publishes a patched transitive dependency.

## Recommended production evolution

- Add authenticated users only if future product scope requires accounts.
- Replace instance-local rate limits and locks with distributed controls.
- Add model-quality evaluations scored against expert-labelled interviews.
- Add tracing for latency, fallback rate, completion rate, and schema failures without logging unnecessary answer content.
- Add consent, retention controls, and provider-region review before processing real candidate data.
- Add human review and score calibration before using feedback in consequential decisions.
