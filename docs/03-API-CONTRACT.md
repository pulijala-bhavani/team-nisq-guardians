# API Contract

## Endpoint

```text
POST /api/interview
```

Authentication is not required.

All requests and responses use JSON.

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
    "missions": [],
    "signals": {
      "commitDays": 28,
      "missionsCompleted": 30,
      "missionsFirstTry": 20
    }
  }
}
```

The production UI sends the complete candidate object from `data/candidates.json`.

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

### Request

```json
{
  "sessionId": "abc-123",
  "message": "I would begin by defining a fixed evaluation set..."
}
```

### Response

```json
{
  "reply": "You mentioned evaluation. Suppose that choice works in a prototype...",
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
  "reply": "Interview completed. Your feedback is ready.",
  "done": true,
  "feedback": {
    "summary": "...",
    "strengths": ["..."],
    "gaps": ["..."],
    "next": ["..."]
  }
}
```

## Error responses

| Status | Cause |
| --- | --- |
| `400` | Invalid JSON, missing `sessionId`, invalid candidate schema, or missing message |
| `404` | The supplied `sessionId` does not identify an active interview |

Example:

```json
{
  "reply": "sessionId is required.",
  "done": false
}
```

## State rules

- The client must reuse the same `sessionId` for every turn.
- A new candidate request initializes or replaces the session associated with that ID.
- A completed session is removed after final feedback is returned.
- The included MVP uses server memory for active session state.
