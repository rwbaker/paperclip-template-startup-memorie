---
name: claims-discipline
description: Hard rules on what may be claimed about Memorie. Use before writing or approving ANY outbound content. Violations block publish and escalate.
---

# Claims Discipline (Memorie is health-adjacent)

NEVER, in any content, reply, email, or outreach:
- Medical or health-outcome claims ("improves memory", "treats ADHD",
  "reduces caregiver burnout"). Memorie is an organizational tool, not a
  treatment. Frame benefits as convenience/relief-of-effort, never health.
- ADHD-treatment framing. "Built with ADHD brains in mind" is fine;
  "helps manage your ADHD" is not.
- User PII, user-stored content, or identifiable stories — ever.
- Testimonials without recorded consent (consent reference goes in the KB
  archive entry).
- Guarantees ("never forget again" as a literal promise). Aspirational
  taglines from the approved brand kit are fine.

If a draft trips any rule: do not publish; fix or escalate to the GM with the
draft + the rule tripped. If found post-publish: unpublish immediately, emit
`alert.needs_attention` (critical), record the incident in the audit trail.
