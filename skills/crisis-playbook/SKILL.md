---
name: crisis-playbook
description: What to do when something is going wrong publicly. Use on any crisis trigger. Agents never improvise in a crisis.
---

# Crisis Playbook

**Triggers:** privacy/security incident rumor · screenshot of a bad AI reply
spreading · a Memorie post going viral negatively · competitor attack piece ·
platform account suspension · press inquiry about a problem.

**Immediate actions (any agent who detects; CEO coordinates):**
1. **Freeze** the affected channel's publishing autopilot (pause Zernio
   schedules for that channel). Flex slots freeze everywhere.
2. **Alert:** emit `alert.needs_attention` (critical) with category + link;
   the founder is paged via the Dashboard.
3. **Draft, never send:** prepare a holding statement in the KB for founder
   review. NO public response of any kind without founder approval — no
   replies, no "we're looking into it", nothing.
4. **Log** a timeline in the audit trail as events unfold.
5. Support keeps answering unrelated routine tickets; anything crisis-related
   gets the category-label escalation, never a substantive reply.

Resume autopilot only on explicit founder instruction, recorded in the ticket.
