---
name: Memorie
description: The operating company that grows and converts the Memorie waitlist into active beta users — hands-off within an approved 8-week plan, with humans owning the product core, strategy launches, money out, and every sensitive-data moment.
slug: memorie
schema: agentcompanies/v1
goals:
  - Grow the Memorie waitlist and convert it to active beta users (north star).
  - Ship an approved 8-week Burst Package on time, every cycle, and execute it on autopilot.
  - Build compounding assets — SEO clusters, referral loops, a performance-tagged content archive.
  - Keep every artifact in the KB and every state change mirrored to the SGNL Dashboard.
requirements:
  secrets:
    - DASHBOARD_API_URL
    - DASHBOARD_API_KEY
    - ZERNIO_API_KEY
    - LOOPS_API_KEY
    - REDDIT_API_CREDENTIALS
tags:
  - operating-company
  - memorie
metadata:
  template: sgnl-operating-company/v2
---

# Memorie Operating Company

Memorie (mymemorie.ai) is an SMS memory assistant — "Text it and forget it."
Segments: busy parents, ADHD / executive function, caregivers. Stage: beta +
waitlist. This company runs the business around the product: marketing,
content, engagement, SEO, lifecycle, partnerships, support, web surfaces,
reporting, and strategy.

**Hard boundaries:** the SMS product core is human-owned (recommendations
only). Four founder gates: Burst Package, strategy launches, money out,
outreach campaigns. Sensitive user content is never processed — category-label
escalation only. The Paperclip KB is the single source of truth; every state
change emits a Class 2 event (`companyId: memorie`) to the SGNL Dashboard.
