# Memorie Operating Company — Paperclip Package

The company that runs and scales Memorie (mymemorie.ai). Design spec:
`../company-template/docs/superpowers/specs/2026-07-10-memorie-operating-company-design.md`.

## Shape
- 14 agents / 4 teams; `gm` is the sole root and founder contact.
- 8-week burst cycle: founder approves one Burst Package (retro-first), then
  autopilot with 1–2 weekly flex slots and an evergreen fallback queue.
- Four founder gates: burst package, strategy launch, money out, outreach.
- KB-first data spine: every artifact in the KB, every state change emitted
  to the SGNL Dashboard as a Class 2 event (companyId: memorie); Librarian
  reconciles daily.
- Product core (SMS pipeline) is out of scope — recommendations only.

## Integrations (provision before first run)
Zernio (publish/inbox/analytics; API key), Figma MCP + brand library, Loops
(ESP), Reddit API, waitlist DB read-only, site analytics, SGNL Dashboard
URL + key. LinkedIn reply capability: test at wiring time; fall back to the
KB draft queue if the platform doesn't expose replies.

## Validate
```bash
npm install
npm test   # validator self-test + full package validation
```
