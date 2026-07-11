---
name: emit-dashboard-event
description: How to emit a Class 2 (business health) event to the SGNL Dashboard. Use after any KB state change — KB first, then emit.
---

# Emit Dashboard Event (Class 2 — Memorie)

**KB-first rule:** write the artifact/state change to the KB, THEN emit. The KB
is the source of truth; the Dashboard mirrors it.

**Mechanism:** POST the envelope to `$DASHBOARD_API_URL` with header
`Authorization: Bearer $DASHBOARD_API_KEY`. On failure, append the same JSON
line to `events/outbox.ndjson` — emits are idempotent (stable `id`), so the
Librarian's daily reconciliation can safely re-send.

**Envelope:**
```json
{ "id": "<stable-uuid>", "companyId": "memorie", "class": 2, "type": "<event.type>", "ts": "<iso8601>", "payload": { } }
```

**Event types:**
`business.status` (payload.status: green|yellow|red), `business.uptime`,
`ops.report_published`, `ops.checkin`,
`alert.needs_attention` (payload.severity: info|warn|critical + payload.reason),
`marketing.posts_live`, `marketing.calendar_empty`, `marketing.campaign_result`,
`strategy.proposed`, `strategy.launched`, `strategy.killed`,
`paid.readiness_assessed`, `voc.synthesis_published`, `content.retro_published`.

The Dashboard accepts new types (forward-compatible); prefer the vocabulary
above so views stay coherent.
