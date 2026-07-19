# Memorie Operating Company — Paperclip Template

The company that runs and scales Memorie (mymemorie.ai). Built to the
canonical Paperclip company-template format (see
[paperclipai/companies](https://github.com/paperclipai/companies)).

## Shape
- **14 agents / 4 teams.** The **CEO** is the single org root
  (`reportsTo: null`) and the only agent the founder talks to — everything
  else is delegated down the chain (Paperclip best practice: every company
  starts with a CEO).
- `reportsTo` and team `manager` fields are **agent slugs** (`cmo`, `ceo`),
  matching the canonical import format.
- **No cron routines.** Paperclip wakes agents on heartbeat intervals; each
  agent's `AGENTS.md` is its operating manual and carries an
  "Operating cadence" section saying what's due daily/weekly/monthly.
  Heartbeats are configured post-import (checklist below); `.paperclip.yaml`
  is deliberately minimal — only adapters and approval gates.
- 8-week burst cycle: founder approves one Burst Package (retro-first), then
  autopilot with 1–2 weekly flex slots and an evergreen fallback queue.
- Four founder gates (the only 4 tasks in the template, all `gated`):
  burst package, strategy launch, money out, outreach.
- KB-first data spine; every state change emitted to the SGNL Dashboard as a
  Class 2 event (`companyId: memorie`); Librarian reconciles daily.
- Product core (SMS pipeline) is out of scope — recommendations only.

## Import
```bash
npx paperclipai company import --from .
```

## After import (5-minute checklist)
1. **Heartbeats** — in each agent's Configuration tab enable the schedule:
   hourly (3600s) for ceo, cmo, growth-marketer, content-producer, analyst,
   support, librarian; 6h (21600s) for business-strategist, seo-blog-lead,
   lifecycle-marketer, partnerships-pr, web-engineer; leave brand-designer
   and paid-media-strategist disabled (on-demand/advisory).
2. **Budgets** — this company runs **unbudgeted** (`budgetMonthlyCents:
   null`), like the founder's other companies. Budgets are not part of the
   template format, and an importer that defaults the absent value to `0`
   creates a hard stop at zero tokens — so verify after import that company
   and agent budgets read null/unset, and clear any `0`s:
   ```bash
   curl -X PATCH $PAPERCLIP_URL/api/companies/$COMPANY_ID/budgets \
     -d '{"budgetMonthlyCents": null}'
   curl -X PATCH $PAPERCLIP_URL/api/agents/$AGENT_ID/budgets \
     -d '{"budgetMonthlyCents": null}'
   ```
   If your Paperclip version requires a limit, prefer a per-run cap of $25
   (2500 cents) over monthly ceilings.
3. **North-star goal** — create the company Goal "Grow the waitlist and
   convert it to active beta users" (the goals in `COMPANY.md` frontmatter
   are documentation; goal objects are created via the Goals API/UI).
4. **Secrets** — provision `DASHBOARD_API_URL` (full ingest endpoint,
   including path), `DASHBOARD_API_KEY`, `ZERNIO_API_KEY`, `LOOPS_API_KEY`,
   `REDDIT_API_CREDENTIALS` in this company's secrets (secrets are
   company-scoped), then map the two dashboard vars on **all 14 agents**
   (`"DASHBOARD_API_KEY": "$secret:DASHBOARD_API_KEY"`, same for URL) so
   every agent can emit events live; the Librarian reconciles failures.

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
The validator enforces the canonical format: slug-based `reportsTo`/`manager`,
a single `ceo` root, canonical AGENTS.md frontmatter only
(name/title/reportsTo/skills), no `routines:` in `.paperclip.yaml`, and no
recurring TASK.md files (cadence belongs in agent manuals). Validator test
fixtures are generated in a temp dir at test time — nothing importable sits
in this repo besides the company itself.
