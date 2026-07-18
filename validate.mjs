#!/usr/bin/env node
// Validates this package against the canonical Paperclip company template
// format (see github.com/paperclipai/companies): slug-based reportsTo/manager,
// a single CEO root, and no cron routines (cadence lives in agent manuals +
// heartbeat schedules). Fixtures are embedded and written to a temp dir for
// --selftest so no fixture .md files exist on disk for an importer to ingest.
import { readFileSync, readdirSync, statSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { tmpdir } from "node:os";
import matter from "gray-matter";
import { parse as parseYaml } from "yaml";

const errors = [];
const err = (p, m) => errors.push(`ERROR ${p}: ${m}`);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".git" || name === ".superpowers") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith(".md")) out.push(p);
  }
  return out;
}

function parse(p) {
  try { return matter(readFileSync(p, "utf8")).data || {}; }
  catch (e) { err(p, `frontmatter parse failed: ${e.message}`); return null; }
}

function requireFields(p, data, fields) {
  for (const f of fields) if (data[f] === undefined) err(p, `missing required field '${f}'`);
}

// Canonical AGENTS.md frontmatter is name/title/reportsTo/skills only.
const AGENT_FIELDS = new Set(["name", "title", "reportsTo", "skills"]);

// Validate one company root (dir containing COMPANY.md).
function validateCompany(root) {
  const agents = {}; // slug -> { file, data }
  const taskSlugs = new Set(); // TASK.md immediate parent directory names
  const files = walk(root);

  for (const file of files) {
    const base = file.split("/").pop();
    const data = parse(file);
    if (!data) continue;

    if (base === "COMPANY.md") {
      requireFields(file, data, ["name", "description", "slug"]);
    } else if (base === "AGENTS.md") {
      requireFields(file, data, ["name"]);
      for (const k of Object.keys(data))
        if (!AGENT_FIELDS.has(k)) err(file, `non-canonical frontmatter field '${k}' (importer only reads name/title/reportsTo/skills)`);
      if (data.reportsTo !== null && data.reportsTo !== undefined && !/^[a-z0-9-]+$/.test(String(data.reportsTo)))
        err(file, `reportsTo must be an agent slug (e.g. 'cmo') or null, got '${data.reportsTo}'`);
      const slug = relative(root, dirname(file)).replace(/^agents\//, "");
      agents[slug] = { file, data };
    } else if (base === "TEAM.md") {
      requireFields(file, data, ["name", "description", "slug"]);
      if (data.manager && !existsSync(join(root, "agents", String(data.manager), "AGENTS.md")))
        err(file, `manager '${data.manager}' must be an agent slug with agents/${data.manager}/AGENTS.md`);
    } else if (base === "SKILL.md") {
      requireFields(file, data, ["name", "description"]);
    } else if (base === "PROJECT.md") {
      requireFields(file, data, ["name", "description"]);
      if (data.owner && !existsSync(join(root, "agents", data.owner, "AGENTS.md")))
        err(file, `owner '${data.owner}' has no agents/${data.owner}/AGENTS.md`);
    } else if (base === "TASK.md") {
      requireFields(file, data, ["name"]);
      if (data.assignee && !existsSync(join(root, "agents", data.assignee, "AGENTS.md")))
        err(file, `assignee '${data.assignee}' has no agents/${data.assignee}/AGENTS.md`);
      if (data.recurring === true)
        err(file, `recurring tasks are not part of the import format — put the cadence in the assignee's AGENTS.md operating manual instead`);
      taskSlugs.add(relative(root, dirname(file)).split("/").pop());
    }
  }

  // Reference + org-tree checks over collected agents.
  const roots = [];
  const parent = {};
  for (const [slug, { file, data }] of Object.entries(agents)) {
    for (const s of data.skills || []) {
      if (!existsSync(join(root, "skills", s, "SKILL.md")))
        err(file, `skill '${s}' has no skills/${s}/SKILL.md`);
    }
    if (data.reportsTo === null || data.reportsTo === undefined) { roots.push(slug); parent[slug] = null; }
    else if (!agents[data.reportsTo] && !existsSync(join(root, "agents", data.reportsTo, "AGENTS.md")))
      err(file, `reportsTo '${data.reportsTo}' has no agents/${data.reportsTo}/AGENTS.md`);
    else parent[slug] = data.reportsTo;
  }
  const nAgents = Object.keys(agents).length;
  if (nAgents > 0) {
    if (roots.length !== 1)
      err(root, `org tree must have exactly one root (reportsTo: null); found ${roots.length} [${roots.join(", ")}]`);
    else if (roots[0] !== "ceo")
      err(root, `the root agent must be 'ceo' (Paperclip: every company starts with a CEO); found '${roots[0]}'`);
    // Cycle / connectivity: every agent must reach a root within nAgents hops.
    for (const start of Object.keys(agents)) {
      let cur = start, hops = 0, ok = false;
      while (cur !== undefined && hops <= nAgents) {
        if (parent[cur] === null) { ok = true; break; }
        cur = parent[cur]; hops++;
      }
      if (!ok) err(agents[start].file, `'${start}' does not reach the org root (cycle or broken chain)`);
    }
  }

  // .paperclip.yaml cross-checks.
  const pcPath = join(root, ".paperclip.yaml");
  if (existsSync(pcPath)) {
    let pc;
    try { pc = parseYaml(readFileSync(pcPath, "utf8")) || {}; }
    catch (e) { err(pcPath, `yaml parse failed: ${e.message}`); pc = {}; }
    if (pc.routines)
      err(pcPath, `'routines' is not part of the import format (silently dropped) — use per-agent runtimeConfig.schedule and the AGENTS.md operating cadence`);
    for (const slug of Object.keys(pc.agents || {})) {
      if (!agents[slug]) err(pcPath, `.paperclip.yaml agents.'${slug}' has no agents/${slug}/AGENTS.md`);
    }
    for (const [name, policy] of Object.entries(pc.approval_policies || {})) {
      const appliesTo = (policy && policy.applies_to) || {};
      for (const t of appliesTo.tasks || []) {
        if (!taskSlugs.has(t))
          err(pcPath, `approval_policies.'${name}'.applies_to.tasks references unknown task '${t}'`);
      }
      for (const a of appliesTo.agents || []) {
        if (!agents[a])
          err(pcPath, `approval_policies.'${name}'.applies_to.agents references unknown agent '${a}'`);
      }
      // applies_to.events[] is free-form and intentionally left unchecked.
    }
  }

  return errors.length === 0;
}

// Fixtures are generated at selftest time so no importable .md files sit in
// the repo (an importer once ingested on-disk fixtures as real agents).
const FIXTURES = {
  valid: {
    "COMPANY.md": `---\nname: Fixture Co\ndescription: Minimal valid company for validator self-test.\nslug: fixture-co\n---\nValid fixture.\n`,
    "agents/ceo/AGENTS.md": `---\nname: CEO\nreportsTo: null\n---\nRoot of the fixture org tree.\n`,
  },
  broken: {
    "COMPANY.md": `---\nname: Broken Co\ndescription: Missing required fields on purpose.\n---\nBroken fixture.\n`,
    "agents/a/AGENTS.md": `---\nname: A\nreportsTo: b\n---\n`,
    "agents/b/AGENTS.md": `---\nname: B\nreportsTo: a\n---\n`,
  },
};

function writeFixture(base, tree) {
  for (const [rel, content] of Object.entries(tree)) {
    const p = join(base, rel);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, content);
  }
}

function selftest() {
  const tmp = mkdtempSync(join(tmpdir(), "paperclip-fixtures-"));
  try {
    writeFixture(join(tmp, "valid"), FIXTURES.valid);
    writeFixture(join(tmp, "broken"), FIXTURES.broken);
    const okBefore = errors.length;
    validateCompany(join(tmp, "valid"));
    const validClean = errors.length === okBefore;
    const brokenErrsStart = errors.length;
    validateCompany(join(tmp, "broken"));
    const brokenCaught = errors.length > brokenErrsStart;
    errors.length = okBefore; // discard fixture errors from the real run
    if (!validClean) { console.error("SELFTEST FAIL: valid fixture produced errors"); process.exit(1); }
    if (!brokenCaught) { console.error("SELFTEST FAIL: broken fixture was not caught"); process.exit(1); }
    console.log("selftest: OK (valid passes, broken is caught)");
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

const args = process.argv.slice(2);
if (args.includes("--selftest")) selftest();
validateCompany(".");
if (errors.length) { for (const e of errors) console.error(e); process.exit(1); }
console.log("validate: OK");
