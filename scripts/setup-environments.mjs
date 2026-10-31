// One-off setup of the development and production environments from .env.setup (never committed).
//
//   1. Vercel: creates the project (no Git connection; GitHub Actions deploys) and sets the
//      Supabase and SoC LLM variables for Preview (develop) and Production (master).
//   2. Supabase: points each project's auth redirects at its Vercel URL.
//   3. GitHub: creates the "development" and "production" environments with the secrets that
//      .github/workflows/deploy.yml reads; production needs a reviewer and accepts only master.
//
// Safe to re-run: every step updates what is already there. Values are never printed.
//
//   npm run setup:envs

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const env = parseEnvFile(".env.setup");

const required = [
  "GITHUB_REPO",
  "PROD_REVIEWERS",
  "SUPABASE_ACCESS_TOKEN",
  "VERCEL_TOKEN",
  "VERCEL_PROJECT_NAME",
  "VERCEL_DEV_ALIAS",
  ...["DEV", "PROD"].flatMap((p) =>
    [
      "SUPABASE_PROJECT_REF",
      "SUPABASE_DB_PASSWORD",
      "SUPABASE_PUBLISHABLE_KEY",
      "SUPABASE_SECRET_KEY",
      "SOCLAAS_BASE_URL",
      "SOCLAAS_API_KEY",
      "SOCLAAS_MODEL",
    ].map((k) => `${p}_${k}`),
  ),
];
const missing = required.filter((k) => !env[k]);
if (missing.length) fail(`Fill these in .env.setup first:\n  ${missing.join("\n  ")}`);

const vercelQuery = env.VERCEL_TEAM ? `?slug=${encodeURIComponent(env.VERCEL_TEAM)}` : "";

// ---------------------------------------------------------------------------
// 1. Vercel
// ---------------------------------------------------------------------------

step("Vercel project");
let project = await vercel("GET", `/v9/projects/${env.VERCEL_PROJECT_NAME}`, undefined, [404]);
if (!project) {
  project = await vercel("POST", "/v11/projects", { name: env.VERCEL_PROJECT_NAME, framework: "nextjs" });
  ok(`created ${project.name}`);
} else ok(`found ${project.name}`);

// Graders and teammates must open the development site without a Vercel login.
await vercel("PATCH", `/v9/projects/${project.id}`, { ssoProtection: null });
ok("deployment protection off, so the dev alias is publicly reachable");

const prodUrl = env.PROD_SITE_URL || `https://${env.VERCEL_PROJECT_NAME}.vercel.app`;
const devUrl = `https://${env.VERCEL_DEV_ALIAS}`;

for (const [prefix, target] of [
  ["DEV", "preview"],
  ["PROD", "production"],
]) {
  const vars = {
    NEXT_PUBLIC_SUPABASE_URL: `https://${env[`${prefix}_SUPABASE_PROJECT_REF`]}.supabase.co`,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: env[`${prefix}_SUPABASE_PUBLISHABLE_KEY`],
    SUPABASE_SECRET_KEY: env[`${prefix}_SUPABASE_SECRET_KEY`],
    SOCLAAS_BASE_URL: env[`${prefix}_SOCLAAS_BASE_URL`],
    SOCLAAS_API_KEY: env[`${prefix}_SOCLAAS_API_KEY`],
    SOCLAAS_MODEL: env[`${prefix}_SOCLAAS_MODEL`],
  };
  const body = Object.entries(vars).map(([key, value]) => ({
    key,
    value,
    target: [target],
    type: key.startsWith("NEXT_PUBLIC_") ? "plain" : "encrypted",
  }));
  await vercel("POST", `/v10/projects/${project.id}/env?upsert=true`, body);
  ok(`${Object.keys(vars).length} variables set for ${target}`);
}

const orgId = project.accountId;

// ---------------------------------------------------------------------------
// 2. Supabase auth redirects
// ---------------------------------------------------------------------------

step("Supabase auth settings");
for (const [prefix, siteUrl] of [
  ["DEV", devUrl],
  ["PROD", prodUrl],
]) {
  const ref = env[`${prefix}_SUPABASE_PROJECT_REF`];
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      site_url: siteUrl,
      uri_allow_list: `${siteUrl}/**`,
      // Without custom SMTP Supabase sends only a few emails an hour, so demo accounts skip confirmation.
      mailer_autoconfirm: env.SUPABASE_AUTOCONFIRM !== "false",
    }),
  });
  if (!res.ok) fail(`Supabase ${prefix} auth update failed: ${res.status} ${await res.text()}`);
  ok(`${prefix.toLowerCase()} → ${siteUrl}`);
}

// ---------------------------------------------------------------------------
// 3. GitHub environments and secrets
// ---------------------------------------------------------------------------

step("GitHub environments");
const repo = env.GITHUB_REPO;
const reviewers = env.PROD_REVIEWERS.split(",")
  .map((login) => login.trim())
  .filter(Boolean)
  .map((login) => ({ type: "User", id: Number(gh(["api", `users/${login}`, "--jq", ".id"])) }));

gh(["api", "-X", "PUT", `repos/${repo}/environments/development`]);
gh(["api", "-X", "PUT", `repos/${repo}/environments/production`, "--input", "-"], {
  reviewers,
  deployment_branch_policy: { protected_branches: false, custom_branch_policies: true },
});
const policies = JSON.parse(gh(["api", `repos/${repo}/environments/production/deployment-branch-policies`]));
if (!policies.branch_policies.some((p) => p.name === "master")) {
  gh(["api", "-X", "POST", `repos/${repo}/environments/production/deployment-branch-policies`, "-f", "name=master"]);
}
ok(`production: ${reviewers.length} reviewer(s), master only`);

for (const [prefix, name] of [
  ["DEV", "development"],
  ["PROD", "production"],
]) {
  const secrets = {
    SUPABASE_ACCESS_TOKEN: env.SUPABASE_ACCESS_TOKEN,
    SUPABASE_DB_PASSWORD: env[`${prefix}_SUPABASE_DB_PASSWORD`],
    SUPABASE_PROJECT_REF: env[`${prefix}_SUPABASE_PROJECT_REF`],
    VERCEL_TOKEN: env.VERCEL_TOKEN,
    VERCEL_ORG_ID: orgId,
    VERCEL_PROJECT_ID: project.id,
  };
  for (const [key, value] of Object.entries(secrets)) {
    // The value goes through stdin so it never appears in the process list.
    execFileSync("gh", ["secret", "set", key, "--env", name, "--repo", repo], { input: value });
  }
  ok(`${name}: ${Object.keys(secrets).length} secrets`);
}
gh(["variable", "set", "VERCEL_DEV_ALIAS", "--repo", repo, "--body", env.VERCEL_DEV_ALIAS]);
ok(`variable VERCEL_DEV_ALIAS = ${env.VERCEL_DEV_ALIAS}`);

console.log(`\nDone. Development: ${devUrl}\n      Production:  ${prodUrl}`);

// ---------------------------------------------------------------------------

function parseEnvFile(path) {
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    fail(`${path} not found. Run this from the repository root.`);
  }
  const out = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
  }
  return out;
}

async function vercel(method, path, body, allow = []) {
  const sep = path.includes("?") ? "&" : "?";
  const url = `https://api.vercel.com${path}${vercelQuery ? sep + vercelQuery.slice(1) : ""}`;
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${env.VERCEL_TOKEN}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (allow.includes(res.status)) return null;
  if (!res.ok) fail(`Vercel ${method} ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

function gh(args, input) {
  return execFileSync("gh", args, {
    input: input === undefined ? undefined : JSON.stringify(input),
    encoding: "utf8",
  }).trim();
}

function step(title) {
  console.log(`\n▸ ${title}`);
}
function ok(msg) {
  console.log(`  ✓ ${msg}`);
}
function fail(msg) {
  console.error(`\n✗ ${msg}`);
  process.exit(1);
}
