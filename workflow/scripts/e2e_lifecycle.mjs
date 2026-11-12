#!/usr/bin/env node
// Browser run of the full bug lifecycle on a deployed BugFlow environment, through the UI only.
//
//   NODE_PATH="$(npm root -g)" node workflow/scripts/e2e_lifecycle.mjs https://hackhub-orbit-dev.vercel.app
//
// Uses the public demo accounts from docs/UserGuide.md (override the password with DEMO_PASSWORD).
// Needs Playwright and a local Chrome. It needs no keys: every check reads what a user would see.
// It creates one report and moves it to Closed, calling each role's AI features once.
import { createRequire } from "node:module";
import path from "node:path";

// Playwright is not a project dependency. Resolve it from the project or from NODE_PATH (a global install).
const require = createRequire(process.env.NODE_PATH ? path.join(process.env.NODE_PATH, "noop.js") : import.meta.url);
const { chromium } = require("playwright");

const BASE = (process.argv[2] ?? "https://hackhub-orbit-dev.vercel.app").replace(/\/$/, "");
const PASSWORD = process.env.DEMO_PASSWORD ?? "BugFlow-Demo-2026";
const AI_TIMEOUT = 90_000;
const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
const TITLE = `round_half() rounds 2.5 down (E2E ${stamp})`;
const BUGGY = "def round_half(x):\n    return round(x)\n\nprint(round_half(2.5))\n";
const BAD_FIX = "def round_half(x):\n    return int(x)\n\nprint(round_half(2.5))\n";
const GOOD_FIX = "import math\n\ndef round_half(x):\n    return math.floor(x + 0.5)\n\nprint(round_half(2.5))\n";

const results = [];
const problems = [];
function check(name, ok, detail = "") {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
}
const timed = async (fn) => { const t = Date.now(); const v = await fn(); return [v, ((Date.now() - t) / 1000).toFixed(1)]; };

const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
context.setDefaultTimeout(20_000);
const page = await context.newPage();
page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
page.on("console", (m) => { if (m.type() === "error") problems.push(`console: ${m.text().slice(0, 200)}`); });
page.on("response", (r) => { if (r.status() >= 500) problems.push(`${r.status()} ${r.url()}`); });

async function signIn(email) {
  await context.clearCookies();
  await page.goto(`${BASE}/login`);
  await page.fill("#email", email);
  await page.fill("#password", PASSWORD);
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/login")), page.click('button[value="signin"]')]);
}
const shows = (text, timeout = 20_000) => page.getByText(text, { exact: false }).first().waitFor({ timeout }).then(() => true, () => false);
// The stage the progress bar marks as current. A closed report has every stage done and none current.
async function stage() {
  const bar = page.locator('ol[aria-label="Report progress"]').first();
  await bar.waitFor();
  const current = bar.locator('li[aria-current="step"]');
  return (await current.count()) ? (await current.innerText()).replace(/^\d+\s*/, "").trim() : "Closed";
}

// Finds which of the two accounts was assigned the report: it must be in their queue and open for them.
async function openAssigned(role, listPath, reportId) {
  for (const n of [1, 2]) {
    await signIn(`${role}${n}@example.com`);
    await page.goto(`${BASE}${listPath}`);
    if (!(await shows(TITLE, 10_000))) continue;
    await page.goto(`${BASE}${listPath}/${reportId}`);
    if (!(await page.locator("body").innerText()).includes("404")) return `${role}${n}@example.com`;
  }
  return null;
}

try {
  // Sign-in
  await page.goto(`${BASE}/login`);
  await page.fill("#email", "reporter1@example.com");
  await page.fill("#password", "wrong-password-123");
  await page.click('button[value="signin"]');
  await page.waitForTimeout(2500);
  check("Wrong password is refused", page.url().includes("/login"));

  // Reporter: draft check, submit, edit, explain
  await signIn("reporter1@example.com");
  check("Reporter lands on My bug reports", page.url().endsWith("/reports"), page.url());
  await page.goto(`${BASE}/reports/new`);
  await page.fill('input[name="title"]', TITLE);
  await page.locator(".cm-content").click(); // the CodeMirror editor that mirrors into python_code
  await page.keyboard.insertText(BUGGY);
  await page.fill('textarea[name="error_message"]', "No error");
  await page.fill('textarea[name="expected_behavior"]', "round_half(2.5) returns 3");
  await page.fill('textarea[name="actual_behavior"]', "It returns 2");
  await page.fill('textarea[name="reproduction_steps"]', "1. Run the snippet\n2. See 2 printed");
  const [checked, tCheck] = await timed(async () => {
    await page.getByRole("button", { name: /Check my report/ }).click();
    return shows("AI suggestion", AI_TIMEOUT);
  });
  check("Reporter AI: Check my report returns a suggestion", checked, `${tCheck}s`);
  await Promise.all([page.waitForURL(/\/reports(\?|$)/), page.getByRole("button", { name: "Submit report" }).click()]);
  check("Submit returns to the list with a notice", await shows("Your bug report was submitted."));
  check("New report is in the list", await shows(TITLE));
  await page.getByRole("link", { name: TITLE }).first().click();
  await page.waitForURL(/\/reports\/[0-9a-f-]{36}$/);
  const reportId = page.url().split("/").pop();
  check("Open report can be edited", await shows("You can still edit this report."), reportId);
  await page.fill('textarea[name="actual_behavior"]', "It returns 2 (banker's rounding)");
  await page.getByRole("button", { name: "Save changes" }).click();
  check("Edit saved", await shows("Report saved."));
  const [explained, tExplain] = await timed(async () => {
    await page.getByRole("button", { name: "Explain this bug" }).click();
    return shows("AI suggestion · not verified", AI_TIMEOUT);
  });
  check("Reporter AI: Explain this bug returns an explanation", explained, `${tExplain}s`);

  // Developer: start, AI, note, first (bad) fix
  const dev = await openAssigned("developer", "/developer", reportId);
  check("Report is in a Developer queue", dev, dev ?? "not found in developer1 or developer2");
  await page.getByRole("button", { name: /Start investigation/ }).click();
  check("Start investigation sets In progress", await shows("Add investigation note"));
  const [guided, tGuide] = await timed(async () => {
    await page.getByRole("button", { name: "Get debugging guidance" }).click();
    return shows("AI guidance · not verified", AI_TIMEOUT);
  });
  check("Developer AI: debugging advisor returns guidance", guided, `${tGuide}s`);
  const [improved, tImprove] = await timed(async () => {
    await page.getByRole("button", { name: "Suggest code improvements" }).click();
    return shows("AI suggestions · not verified", AI_TIMEOUT);
  });
  const improvePanel = improved ? "" : await page.locator("section:has(#code-improvement-heading)").last().innerText().catch(() => "");
  check("Developer AI: code improvement advisor returns suggestions", improved, improved ? `${tImprove}s` : improvePanel.slice(0, 300).replace(/\s+/g, " "));
  await page.fill("#new-note", "round() uses banker's rounding, so 2.5 rounds to 2.");
  await page.getByRole("button", { name: "Add note" }).click();
  check("Investigation note saved", await shows("round() uses banker's rounding"));
  await page.fill("#fixed-code", BAD_FIX);
  await page.fill("#submission-note", "Truncate instead of round.");
  await page.getByRole("button", { name: "Submit to QA" }).click();
  check("First fix submitted, report awaits QA", await shows("Awaiting QA"));

  // QA: AI ideas, failing test, AI draft, reject
  const qa = await openAssigned("qa", "/qa", reportId);
  check("Report is in a QA queue", qa, qa ?? "not found in qa1 or qa2");
  const [ideas, tIdeas] = await timed(async () => {
    await page.getByRole("button", { name: "Suggest test cases" }).click();
    return shows("AI suggestion · not checked", AI_TIMEOUT);
  });
  check("QA AI: test ideas returned", ideas, `${tIdeas}s`);
  const recordTest = async (description, expected, actual, outcome) => {
    await page.fill('textarea[name="description"]', description);
    await page.fill('textarea[name="expectedResult"]', expected);
    await page.fill('textarea[name="actualResult"]', actual);
    await page.locator(`label:has(input[name="outcome"][value="${outcome}"])`).click();
    await page.getByRole("button", { name: "Save test" }).click();
    // The form clears when the save finishes. Waiting for that, rather than for the description
    // text, matters: the description can also appear in the bug details.
    return page.waitForFunction(() => document.querySelector('textarea[name="description"]')?.value === "")
      .then(() => shows(description), () => false);
  };
  check("Failing test recorded", await recordTest("round_half(2.5)", "3", "2", "fail"));
  const [drafted, tDraft] = await timed(async () => {
    await page.getByRole("button", { name: "Draft from my test results" }).click();
    return shows("AI draft · not checked", AI_TIMEOUT);
  });
  const draftPanel = drafted ? "" : await page.locator("section:has(#draft-heading), div:has(> #draft-heading)").last().innerText().catch(() => "");
  check("QA AI: feedback draft returned", drafted, drafted ? `${tDraft}s` : draftPanel.slice(0, 300).replace(/\s+/g, " "));
  await page.fill('textarea[name="feedback"]', "round_half(2.5) still returns 2. int() truncates, so halves never round up.");
  await page.getByRole("button", { name: /Reject/ }).click();
  await page.waitForTimeout(3000);
  await page.reload();
  const afterReject = await stage();
  check("Reject sends the fix back to the Developer", afterReject === "In progress", afterReject);

  // Developer: sees feedback, second fix
  await signIn(dev);
  await page.goto(`${BASE}/developer/${reportId}`);
  check("Developer sees QA's rejection feedback", await shows("int() truncates"));
  await page.fill("#fixed-code", GOOD_FIX);
  await page.fill("#submission-note", "Round half up with floor(x + 0.5).");
  await page.getByRole("button", { name: "Submit to QA" }).click();
  check("Second fix submitted, report awaits QA", await shows("Awaiting QA"));

  // QA: passing test, approve
  await signIn(qa);
  await page.goto(`${BASE}/qa/${reportId}`);
  check("Passing test recorded on the new version", await recordTest("round_half(2.5) after fix", "3", "3", "pass"));
  await page.fill('textarea[name="feedback"]', "round_half(2.5) now returns 3. Approved.");
  await page.getByRole("button", { name: /Approve/ }).click();
  await page.waitForTimeout(3000);
  await page.reload();
  const afterApprove = await stage();
  check("Approve closes the report", afterApprove === "Closed", afterApprove);
  check("QA page has one main landmark", (await page.locator("main").count()) === 1, `${await page.locator("main").count()}`);

  // Reporter: closed, feedback, comparison, locked
  await signIn("reporter1@example.com");
  await page.goto(`${BASE}/reports/${reportId}`);
  check("Reporter sees Closed", (await stage()) === "Closed");
  check("Reporter sees QA's feedback", await shows("now returns 3. Approved."));
  check("Reporter sees the Developer's submission note", await shows("Round half up with floor(x + 0.5)."));
  check("Report is read-only after work starts", await shows("Read-only once work starts"));
  check("Fix comparison shows the latest fix", await shows("floor(x + 0.5)"));
  check("Both fix versions can be chosen", (await page.locator("#report-comparison select option").count()) === 2);

  // Role isolation and sign-out
  await page.goto(`${BASE}/developer/${reportId}`);
  check("Reporter cannot open the Developer page", (await page.locator("body").innerText()).includes("404"));
  await page.goto(`${BASE}/qa/${reportId}`);
  check("Reporter cannot open the QA page", !(await page.locator("body").innerText()).includes("Save test"));
  await page.goto(`${BASE}/reports`);
  await page.getByRole("button", { name: /Sign out/ }).click();
  await page.waitForURL(/\/login/);
  check("Sign out returns to the sign-in page", true);
  await page.goto(`${BASE}/reports`);
  check("Signed-out user is sent to sign in", page.url().includes("/login"));
} catch (error) {
  check("Run finished without an exception", false, String(error).split("\n")[0]);
} finally {
  check("No page errors, console errors or 5xx responses", problems.length === 0, problems.slice(0, 3).join(" | "));
  await browser.close();
  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${passed}/${results.length} checks passed on ${BASE} at ${new Date().toISOString()}`);
  process.exitCode = passed === results.length ? 0 : 1;
}
