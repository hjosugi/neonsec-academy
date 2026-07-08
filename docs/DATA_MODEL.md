# Data Model Draft

## Entities

```text
Question
Choice
Attempt
ReviewItem
MistakeNote
ConceptCard
ExamSession
Lab
Challenge
Evidence
Finding
Report
ExportJob
```

## Question

```json
{
  "id": "Q-CEH-002-001",
  "type": "mcq",
  "module": "Footprinting and Reconnaissance",
  "ceh_plus_track": null,
  "difficulty": "easy",
  "tags": ["recon", "passive"],
  "body": "...",
  "choices": [],
  "answer": "C",
  "explanation": {
    "answer": "...",
    "why": "...",
    "trap": "...",
    "memory_phrase": "Passive observes. Active interacts."
  },
  "status": "active"
}
```

## ReviewItem

```json
{
  "id": "R-001",
  "question_id": "Q-CEH-002-001",
  "due_at": "2026-07-09",
  "interval_days": 1,
  "ease": 2.5,
  "lapses": 0,
  "last_result": "incorrect",
  "confidence": 2
}
```

## Finding

```json
{
  "id": "F-001",
  "title": "Missing server-side authorization check",
  "severity": "high",
  "evidence_ids": ["E-001"],
  "impact": "Unauthorized access to another user's data in the toy dataset.",
  "remediation": "Enforce object-level authorization on every request.",
  "status": "open"
}
```
