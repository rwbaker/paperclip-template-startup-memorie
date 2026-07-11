#!/usr/bin/env node
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, relative, resolve } from "node:path";
import matter from "gray-matter";
import { parse as parseYaml } from "yaml";

const errors = [];
const err = (p, m) => errors.push(`ERROR ${p}: ${m}`);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".git" || name === "test" || name === ".superpowers") continue;
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

// For file types that don't require schema, still validate it when present.
function checkSchemaIfPresent(p, data) {
  if (data.schema !== undefined && data.schema !== "agentcompanies/v1")
    err(p, `schema must be 'agentcompanies/v1'`);
}

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
      requireFields(file, data, ["name", "description", "slug", "schema"]);
      if (data.schema && data.schema !== "agentcompanies/v1")
        err(file, `schema must be 'agentcompanies/v1'`);
    } else if (base === "AGENTS.md") {
      requireFields(file, data, ["name"]);
      checkSchemaIfPresent(file, data);
      const slug = relative(root, dirname(file)).replace(/^agents\//, "");
      agents[slug] = { file, data };
    } else if (base === "TEAM.md") {
      requireFields(file, data, ["name", "description", "slug"]);
      checkSchemaIfPresent(file, data);
      if (data.manager) {
        const target = resolve(dirname(file), data.manager);
        if (!existsSync(target)) err(file, `manager path '${data.manager}' does not resolve`);
      }
    } else if (base === "SKILL.md") {
      requireFields(file, data, ["name", "description"]);
    } else if (base === "PROJECT.md") {
      requireFields(file, data, ["name", "description"]);
      checkSchemaIfPresent(file, data);
      if (data.owner && !existsSync(join(root, "agents", data.owner, "AGENTS.md")))
        err(file, `owner '${data.owner}' has no agents/${data.owner}/AGENTS.md`);
    } else if (base === "TASK.md") {
      requireFields(file, data, ["name"]);
      checkSchemaIfPresent(file, data);
      if (data.assignee && !existsSync(join(root, "agents", data.assignee, "AGENTS.md")))
        err(file, `assignee '${data.assignee}' has no agents/${data.assignee}/AGENTS.md`);
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
    else {
      const target = resolve(dirname(file), data.reportsTo);
      if (!existsSync(target)) { err(file, `reportsTo path '${data.reportsTo}' does not resolve`); continue; }
      const mgrSlug = relative(root, dirname(target)).replace(/^agents\//, "");
      parent[slug] = mgrSlug;
    }
  }
  const nAgents = Object.keys(agents).length;
  if (nAgents > 0) {
    if (roots.length !== 1)
      err(root, `org tree must have exactly one root (reportsTo:null); found ${roots.length} [${roots.join(", ")}]`);
    // Cycle / connectivity: every agent must reach a root within nAgents hops.
    for (const start of Object.keys(agents)) {
      let cur = start, hops = 0, ok = false;
      while (cur != null && hops <= nAgents) {
        if (parent[cur] === null) { ok = true; break; }
        cur = parent[cur]; hops++;
      }
      if (!ok) err(agents[start].file, `'${start}' does not reach the org root (cycle or broken chain)`);
    }
  }

  // .paperclip.yaml cross-checks: routines must name real agents; agents map must resolve.
  const pcPath = join(root, ".paperclip.yaml");
  if (existsSync(pcPath)) {
    let pc;
    try { pc = parseYaml(readFileSync(pcPath, "utf8")) || {}; }
    catch (e) { err(pcPath, `yaml parse failed: ${e.message}`); pc = {}; }
    for (const [name, r] of Object.entries(pc.routines || {})) {
      if (r && r.agent && !agents[r.agent])
        err(pcPath, `routine '${name}' references unknown agent '${r.agent}'`);
    }
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

function selftest() {
  const okBefore = errors.length;
  validateCompany("test/fixtures/valid");
  const validClean = errors.length === okBefore;
  const brokenErrsStart = errors.length;
  validateCompany("test/fixtures/broken");
  const brokenCaught = errors.length > brokenErrsStart;
  errors.length = okBefore; // discard fixture errors from the real run
  if (!validClean) { console.error("SELFTEST FAIL: valid fixture produced errors"); process.exit(1); }
  if (!brokenCaught) { console.error("SELFTEST FAIL: broken fixture was not caught"); process.exit(1); }
  console.log("selftest: OK (valid passes, broken is caught)");
}

const args = process.argv.slice(2);
if (args.includes("--selftest")) selftest();
validateCompany(".");
if (errors.length) { for (const e of errors) console.error(e); process.exit(1); }
console.log("validate: OK");
