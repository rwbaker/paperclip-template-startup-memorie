---
name: content-memory
description: Librarian rules for the content archive, performance memory, repurposing queue, and greatest-hits re-runs. Use when archiving, tagging, or selecting content.
---

# Content Memory

The KB under `projects/operate/archive/` is the single source of truth for
everything published: item, channel, publish time, Zernio schedule ID
(idempotency key), imagery used, and per-post performance (from Zernio
analytics, attached by the Analyst).

- **Archive everything** the day it publishes; no orphan posts.
- **Tag winners:** items in the top performance quartile for their channel get
  `winner: true` — they power the repurposing queue.
- **Repurposing queue:** pillar blog post → social derivatives → email →
  carousel. Derivatives are planned into bursts (they are calendar items, not
  improvisation).
- **Greatest hits:** proven winners may re-run only on a decay schedule
  (≥6 weeks since last run, max 2 re-runs) — recorded in the archive entry.
- **Topic dedupe:** before a new calendar item is finalized, check the archive
  for near-duplicates; link variants rather than repeating.
- **Audit trail:** every gate decision, escalation, and incident gets an entry
  under `projects/operate/audit/`.
