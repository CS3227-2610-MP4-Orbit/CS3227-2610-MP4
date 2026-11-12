# User guide

The app tracks a Python bug from report to verified fix. Each account has one role: **Reporter**, **Developer** or **QA tester**. This guide covers every feature in the current release, role by role.

## Getting started

### Test accounts

Roles are set by the team, so use these accounts. They all share one password: **`BugFlow-Demo-2026`**.

| Role | Accounts |
|---|---|
| Reporter | `reporter1@example.com`, `reporter2@example.com` |
| Developer | `developer1@example.com`, `developer2@example.com` |
| QA tester | `qa1@example.com`, `qa2@example.com` |

**Create account** on the sign-in page makes a new **Reporter** account.

> **This is a shared demo.** The Developer and QA accounts above are the only ones, and their password is public, so anything you submit can be read by anyone testing the app. Do not paste private code. Each Reporter can submit up to 20 reports an hour. After that, submitting shows "Could not save the report. Please try again." until the hour has passed.

### Signing in

After signing in you land on your role's workspace: Reporters on **My bug reports** (`/reports`), Developers on **Assigned bugs** (`/developer`), and QA testers on the **QA queue** (`/qa`). The sidebar on the left shows only your role's pages, with your name and a Sign out button at the bottom; on a phone, open it with the button at the top left. The root page redirects to your workspace.

### How a bug moves between roles

When a Reporter submits a report, it is assigned automatically to the Developer and the QA tester with the fewest unclosed reports. Nobody is assigned a report they filed. The Developer fixes it, the QA tester verifies the fix, and a rejected fix goes back to the Developer with feedback. When both people in a role have the same number of unclosed reports, the older account gets it, which is `developer1` or `qa1` in the demo accounts. To follow one bug through every step, find it in the queue of each Developer and QA tester account.

## Reporter

### Your reports

**My bug reports** (`/reports`) lists everything you have reported, newest first, with its status and the date it was created. The cards at the top count **All reports**, **Being fixed** (open or in progress), **Awaiting QA** and **Closed**. Select a report to open it.

A report's status is shown the same way everywhere:

| Status | Meaning |
|---|---|
| Open | Submitted and assigned, but the Developer has not started. You can still edit it. |
| In progress | The Developer is working on it, or QA sent the fix back. |
| Awaiting QA | The Developer submitted a fix and QA is testing it. |
| Closed | QA approved the fix. |

### Submit a report

Select **New report** and fill in every field:

- **Title** (up to 120 characters)
- **Python code**, a small snippet that shows the bug (up to 20,000 characters)
- **Error message**: paste the traceback, or write "No error" if the result is just wrong
- **Expected behavior** and **Actual behavior**
- **Reproduction steps**

The other fields can each hold up to 2,000 characters. Your code is stored as text and is never run. Select **Submit report**. You return to **My bug reports** with the message "Your bug report was submitted." The report is assigned to a Developer and a QA tester straight away (see [How a bug moves between roles](#how-a-bug-moves-between-roles)).

### Check a draft before submitting

On **New report** (`/reports/new`), enter some report details and select **Check my report**. This optional AI check looks at the current title, Python code, error message, expected behavior, actual behavior, and reproduction steps. It can suggest how to make the report clearer or easier to reproduce, including fields you have not filled in yet. An entirely blank draft is not sent to the AI.

Suggestions are labeled as AI generated and grouped by report field. They do not edit the form, run your code, or submit a report. If you change the draft after a check, the previous suggestion is marked as based on an earlier version; check again if you want updated advice. Use **Submit report** separately when you are ready. The existing required-field checks still apply to submission.

The check uses the same AI request limits as other features: 3 requests per minute and 20 per day for this feature. If it is unavailable or over a limit, you can still submit a valid report, and any earlier suggestion stays visible.

### Edit a report

While a report is **Open**, its page shows "You can still edit this report. Editing locks once a Developer starts work." above the form. Change any field and select **Save changes**; the page shows "Report saved." As soon as the Developer starts work, the report becomes read-only and is shown under **Your report**.

### AI code explanation

Every report page has an **AI code explanation** panel. Select **Explain this bug** to get a short, plain-language explanation of what is likely wrong with your Python code. The answer is labelled "AI suggestion · not verified": it is a guess based on the code and the error you entered, the code is not run, and nothing is changed. Select **Explain again** for a new answer. The limits are the same as for the draft check (3 a minute, 20 a day). If the AI is unavailable, the panel says "The AI could not produce an explanation. Try again later."

### Follow the fix

Each report page shows where the bug is, with a progress bar: **Reported → In progress → QA review → Closed**. The tabs under it (**Details**, **AI explanation**, **Feedback**, **Fix comparison**) jump to each part of the page.

- **Developer and QA feedback** lists the feedback QA writes when it approves or rejects a fix, newest first, marked **QA Tester**. It says "No feedback yet." until then. The Developer's investigation notes are private to the Developer and QA.
- **Fix comparison** shows your original code next to the Developer's proposed fix, line by line. Removed lines are red and added lines are green. The Developer's submission note for that version is shown above it as **Developer note**. If the Developer submitted more than one version, choose the version from the list; the latest is selected first. Until a fix is submitted, it says "No proposed fix yet". Very large snippets are shown side by side as plain text.

When QA approves, the status changes to **Closed** and the report stays read-only.

## Developer

### Your assigned bugs

After signing in as a Developer, open **Assigned bugs** (`/developer`). You see only reports
assigned to your account. Select a report to open its investigation page. A report assigned to a
different Developer is not disclosed.

### Investigating a report

On the report page you can:

1. Read the original Python code, error message, expected and actual behavior, and reproduction
   steps.
2. Select **Start investigation** for an `open` report. The status changes to **in progress**.
3. Add investigation notes while the report is `open` or `in progress`.
4. Edit your own notes while the report is still being investigated. Notes become read-only once
   the fix is sent to QA.

Notes are limited to 5,000 characters. The original report and its original Python code cannot
be edited by the Developer.

### AI debugging advisor

Select **Get debugging guidance** in the **AI debugging advisor** box. The advisor uses the
assigned report's Python code, error details, reproduction steps and recent investigation notes
to suggest possible causes and debugging directions.

The result is labelled **ADVISORY GUIDANCE — review manually; no code was run or applied.** It
does not change the report, create a revision, or change the workflow status. Treat both the
submitted report content and the generated advice as untrusted text. The request is bounded and
subject to the shared AI limits of 3 requests per minute and 20 requests per day per feature.

### AI code improvement advisor

Select **Suggest code improvements** in the **AI code improvement advisor** box. This separate
feature reviews the assigned Python code and relevant report context for readability,
maintainability, performance, SRP and DRY opportunities. Each suggestion includes a category,
rationale, expected benefit and any material trade-off. If no clear improvement is found, the
advisor says so instead of inventing a defect.

The result is advisory guidance only. Suggested code is displayed as inert text for manual review;
it is never executed, applied, saved as a revision, or used to change the report. The request is
available only to the assigned Developer, uses the shared limits of 3 requests per minute and 20
requests per day per feature, and safely refuses oversized input or malformed provider output.

### Submitting a fix

When the report is **in progress**, enter corrected Python and an optional submission note, then
select **Submit to QA**. Corrected code is limited to 20,000 characters and the submission note
to 5,000 characters. The code is syntax-checked but never executed automatically.

Each submission creates an immutable revision. The original code and earlier revisions remain
unchanged. The report then moves to **awaiting QA**.

### Comparing revisions and QA handoff

The report page shows revision history and an original-versus-revision comparison. Added lines
are shown in green and removed lines in red. The Developer can see the QA handoff status but
cannot approve or reject a fix.

### Revising a rejected fix

If QA rejects a revision, the report returns to **in progress** and QA feedback appears on the
Developer page. Read the feedback, update the corrected code, and submit a new revision. Earlier
revisions and their feedback remain available for traceability.

## QA tester

A QA tester verifies fixes. A report can only be closed by the QA tester assigned to it.

### Your queue

Open **`/qa`** after signing in. It lists the reports assigned to you:

| Badge | Meaning |
|---|---|
| **Awaiting QA** | A fix is waiting for your tests and decision. These come first, oldest first. |
| **With Developer** | You rejected the fix, or the Developer is still working on it. |
| **Not started** | The Developer has not started work yet. |
| **Closed** | You approved the fix. |

Other roles who open `/qa` see "The QA workspace is only for QA tester accounts." A report that is not assigned to you shows "This page could not be found".

### Reviewing a fix

Select a report in the queue. The page shows:

1. **Bug details**: the error message, reproduction steps, and expected and actual behaviour.
2. **Original versus proposed fix**: the Reporter's code next to the Developer's fix. Added lines are green and removed lines are red. Use **Revision** to view earlier versions. The latest version is selected first.
3. **Verify the latest fix**: this section appears only while a fix is awaiting QA.
4. **History**: for each version, its tests (with expected and actual results), its decision and feedback, and every status change with who made it.

### AI test ideas

While a fix is awaiting QA, select **Suggest test cases** in the **AI test ideas** box. The AI reads the bug report, the latest fix, the Developer's note and the tests you have already recorded. It suggests up to six tests, each with an input, an expected result and a reason. The answer is labelled **AI suggestion · not checked**. It is not recorded or run: choose the tests you want, run them yourself, and record the results below. **Suggest again** asks for new ideas, and the previous answer stays on screen until the new one arrives.

You can ask 3 times a minute and 20 times a day. Past those limits you see "You asked for suggestions too often. Try again in a minute." or a daily-limit message. If the AI is unavailable, slow or busy, a message says so, and the rest of the page keeps working.

### Recording a test

Under **Record a test case**, fill in **What you tested**, **Expected result** and **Actual result**, choose **pass** or **fail**, and select **Save test**. The test appears in the list above the form, and the form clears for the next test. You can record several tests. Each field is required and can be up to 5,000 characters. Tests are attached to the version you are testing and cannot be edited afterwards.

### Approving or rejecting

Under **Decide version N**:

- **Approve and close** closes the report. Feedback is optional.
- **Reject and return to Developer** sends the report back to the Developer. Feedback is required. If you leave it empty, you see "Tell the Developer what to fix when rejecting".

Feedback can be up to 2,000 characters. It is shown to the Developer, and to the Reporter under **Developer and QA feedback** on their report.

### AI feedback draft

Once you have recorded at least one test on the version you are deciding, select **Draft from my test results** in the **AI feedback draft** box under **Decide version N**. The AI reads only the expected behavior, the Developer's note on that version and your recorded tests. It drafts a short note that names each failed test with its expected and actual result and says what to check, or says what was verified when everything passed. Without recorded tests you see "Record at least one test first. The draft is based on your test results.", and no AI request is made.

The draft is labelled **AI draft · not checked** and is not sent anywhere. Select **Use this draft** to put it in the feedback box. If you already wrote feedback, the draft is added below it, so nothing you wrote is replaced. Edit it as needed. It is only sent when you select **Approve and close** or **Reject and return to Developer**. Links in a draft are replaced by "[link removed]", because a note based on test results never needs one. If you record another test, the draft disappears, because it no longer matches your results. Select **Draft from my test results** again.

The draft has its own limits of 3 times a minute and 20 times a day, separate from AI test ideas.

After deciding, a green message confirms it: "Fix approved. The report is closed." or "Fix rejected. The report is back with the Developer." Each version can be decided once. After you reject, the report waits for the Developer's next version, which then appears as **Awaiting QA** again. If the report was already decided, for example in another tab, you see "This decision could not be saved. The fix may already have been decided."
