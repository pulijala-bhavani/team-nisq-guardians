# API Contract

## Endpoint

```text
POST /api/interview
```

Authentication is not required. Requests and responses use JSON.

## Start an interview

### Request

```json
{
  "sessionId": "abc-123",
  "candidate": {
    "member": {
      "id": "CAND-001",
      "name": "Sarah Johnson",
      "jobRole": "Senior Data Engineer",
      "yearsExperience": 9,
      "education": "MS Computer Science",
      "status": "COMPLETED"
    },
    "missions": [
      { "day": 7, "title": "Embeddings Explained", "passed": true, "attempts": 1 },
      { "day": 12, "title": "Prompt Engineering Fundamentals", "passed": true, "attempts": 4 },
      { "day": 22, "title": "Multi-Agent Orchestration", "passed": true, "attempts": 2 },
      { "day": 28, "title": "Docker & Kubernetes Deployment", "passed": true, "attempts": 3 }
    ],
    "signals": {
      "commitDays": 28,
      "missionsCompleted": 30,
      "missionsFirstTry": 20
    }
  }
}
```

The complete candidate must match the supplied schema and contain at least four explicit passed missions mapped to real curriculum days.

### Response

```json
{
  "reply": "Welcome, Sarah Johnson. ...",
  "done": false,
  "meta": {
    "questionNumber": 1,
    "day": 12,
    "topic": "LLM Core, Prompting & Fine-Tuning",
    "isFollowUp": false,
    "daysCovered": [12]
  }
}
```

`meta` is an additive UI field. The required `reply` and `done` fields remain unchanged.

## Continue an interview

### Minimum organiser request

```json
{
  "sessionId": "abc-123",
  "message": "I would begin by defining a fixed evaluation set..."
}
```

### Bundled browser request

```json
{
  "sessionId": "abc-123",
  "message": "I would begin by defining a fixed evaluation set...",
  "candidate": { "...": "complete supplied candidate" },
  "answers": ["Earlier answer"],
  "history": [
    {
      "role": "agent",
      "content": "Earlier question",
      "meta": {
        "questionNumber": 1,
        "day": 12,
        "topic": "LLM Core, Prompting & Fine-Tuning",
        "isFollowUp": false,
        "daysCovered": [12]
      }
    },
    { "role": "user", "content": "Earlier answer" }
  ]
}
```

`candidate`, `answers`, and `history` are optional additive recovery fields. The API validates them before use. They allow reconstruction when no durable or in-memory session is available.

### Response

```json
{
  "reply": "You proposed a fixed evaluation set. How would you detect whether it has stopped representing production traffic?",
  "done": false,
  "meta": {
    "questionNumber": 2,
    "day": 12,
    "topic": "LLM Core, Prompting & Fine-Tuning",
    "isFollowUp": true,
    "daysCovered": [12]
  }
}
```

## Complete an interview

After the eighth answer:

```json
{
  "reply": "Interview completed. Your evidence-based feedback is ready.",
  "done": true,
  "feedback": {
    "summary": "...",
    "strengths": ["..."],
    "gaps": ["..."],
    "next": ["..."]
  },
  "evaluation": {
    "overallScore": 82,
    "dimensions": {
      "technicalAccuracy": 84,
      "technicalSpecificity": 80,
      "reasoning": 85,
      "communication": 81,
      "productionAwareness": 79
    },
    "engine": "gemini"
  }
}
```

`feedback` preserves the exact required structure. `evaluation` is optional additive metadata used to render a grounded readiness score instead of a fabricated UI value.

## Validation and errors

All errors preserve JSON shape:

```json
{
  "reply": "A valid sessionId between 6 and 128 characters is required.",
  "done": false
}
```

| Status | Cause |
| --- | --- |
| `400` | Invalid JSON, malformed recovery data, candidate-schema failure, or invalid message |
| `404` | No active session and insufficient recovery context |
| `409` | Duplicate concurrent turn or invalid active state |
| `413` | Request body exceeds 120 KB |
| `415` | Content type is not `application/json` |
| `422` | Candidate has fewer than four eligible completed curriculum days |
| `429` | Per-IP or per-session request limit exceeded |

## State rules

- Reuse the same `sessionId` for every turn.
- A new candidate request initializes or replaces that session ID.
- Netlify deployments persist active sessions in a strongly consistent site-scoped store.
- The server also maintains an in-memory cache and accepts optional browser recovery context.
- Completed sessions are removed after feedback is returned.
- Active sessions expire after two hours.
- Starting a new interview creates a new UUID and clears stale visible feedback in the current browser.
