# Security and Limitations

## Current security characteristics

- No authentication or user identity is collected.
- No external model key is required.
- No candidate data are sent to an external AI provider.
- The API validates JSON, `sessionId`, candidate shape, and message presence.
- The UI renders interview content through React text nodes rather than raw HTML.
- Active sessions are removed after feedback is returned.

## Data handling

The supplied curriculum and candidate profiles are synthetic.

The browser stores the active transcript and report only on the current device using `localStorage`. Users can clear this information by clearing site storage or starting a new session.

## MVP limitations

### In-memory server sessions

The included engine maintains active sessions in server memory. This satisfies the session-based API contract for the self-contained hackathon deployment and local execution.

For multi-instance production deployment, replace the in-memory map with Redis, Postgres, or another shared session store so every server instance can retrieve the same session.

### Deterministic interview engine

The included engine provides adaptive, answer-dependent follow-ups without requiring an external model key. It uses candidate history, curriculum objectives, answer vocabulary, and response depth.

A production version can introduce an LLM behind the same API contract while retaining deterministic validation and fallback questions.

### Local report history

Report history is device-local and not synchronized across browsers or devices. Long-term user history is intentionally out of scope.

## Recommended production controls

- Rate limiting by session and IP
- Shared session persistence with expiry
- Request-size limits
- Structured logs without storing unnecessary personal data
- Prompt and model version tracking
- Schema validation for model output
- Automated evaluation datasets
- Abuse and prompt-injection testing
- Monitoring for latency, failures, and session completion rate
