// Creates, or brings back in line, the demo accounts peer testers use (issue #17). Roles can only be
// set by the team, so testers cannot make a Developer or QA account themselves.
//
//   DEMO_PASSWORD=... npm run seed:demo -- local   # uses .env.local
//   DEMO_PASSWORD=... npm run seed:demo -- dev     # uses DEV_* in .env.setup
//   DEMO_PASSWORD=... npm run seed:demo -- prod    # uses PROD_* in .env.setup
//
// Safe to re-run: existing accounts get the password, name and role again. Prints emails and roles
// only, never keys. The password is passed in rather than stored here, so no credential is in code.

import { readFileSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

const ACCOUNTS = [
  { email: "reporter1@example.com", name: "Riley Reporter", role: "reporter" },
  { email: "reporter2@example.com", name: "Robin Reporter", role: "reporter" },
  { email: "developer1@example.com", name: "Dana Developer", role: "developer" },
  { email: "developer2@example.com", name: "Devon Developer", role: "developer" },
  { email: "qa1@example.com", name: "Quinn QA", role: "qa" },
  { email: "qa2@example.com", name: "Quincy QA", role: "qa" },
];

const target = process.argv[2];
if (!["local", "dev", "prod"].includes(target)) fail("Usage: npm run seed:demo -- <local|dev|prod>");
const password = process.env.DEMO_PASSWORD ?? "";
if (password.length < 8) fail("Set DEMO_PASSWORD (at least 8 characters).");

const { url, secret } = connection(target);
const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

const existing = new Map();
for (let page = 1; ; page++) {
  const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
  if (error) fail("Could not list accounts.");
  for (const user of data.users) if (user.email) existing.set(user.email.toLowerCase(), user.id);
  if (data.users.length < 200) break;
}

for (const account of ACCOUNTS) {
  let id = existing.get(account.email);
  const attributes = { password, email_confirm: true, user_metadata: { full_name: account.name } };
  if (id) {
    const { error } = await db.auth.admin.updateUserById(id, attributes);
    if (error) fail(`Could not update ${account.email}.`);
  } else {
    const { data, error } = await db.auth.admin.createUser({ email: account.email, ...attributes });
    if (error || !data.user) fail(`Could not create ${account.email}.`);
    id = data.user.id;
  }
  // The profile row is made by the sign-up trigger; the role is set here, as only the team can.
  const { error } = await db.from("profiles").update({ role: account.role, full_name: account.name }).eq("id", id);
  if (error) fail(`Could not set the role for ${account.email}.`);
  console.log(`  ✓ ${account.email.padEnd(24)} ${account.role}${existing.has(account.email) ? "" : " (new)"}`);
}
console.log(`\nDemo accounts ready on ${target}.`);

function connection(name) {
  if (name === "local") {
    const env = readEnv(".env.local");
    return { url: env.NEXT_PUBLIC_SUPABASE_URL, secret: env.SUPABASE_SECRET_KEY };
  }
  const env = readEnv(".env.setup");
  const prefix = name === "dev" ? "DEV" : "PROD";
  const ref = env[`${prefix}_SUPABASE_PROJECT_REF`];
  return { url: ref && `https://${ref}.supabase.co`, secret: env[`${prefix}_SUPABASE_SECRET_KEY`] };
}

function readEnv(path) {
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    fail(`${path} not found. Run this from the repository root.`);
  }
  const out = {};
  for (const line of text.split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match) out[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
  }
  return out;
}

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}
