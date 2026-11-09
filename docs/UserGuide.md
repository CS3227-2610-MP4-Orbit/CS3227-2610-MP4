# User guide

The app tracks a Python bug from report to verified fix. Each account has one role: **Reporter**, **Developer** or **QA tester**. The role sections below describe the implemented workflow. Automated checks have passed; authenticated browser quickstart testing remains a separate manual check.

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

After signing in you land on your role's workspace: Reporters on **My bug reports** (`/reports`), Developers on **Assigned bugs** (`/developer`), and QA testers on the **QA queue** (`/qa`). The bar at the top shows only your role's pages. **Home** describes your role and links to your workspace.

### How a bug moves between roles

When a Reporter submits a report, it is assigned automatically to the Developer and the QA tester with the fewest unclosed reports. Nobody is assigned a report they filed. The Developer fixes it, the QA tester verifies the fix, and a rejected fix goes back to the Developer with feedback. When both people in a role have the same number of unclosed reports, the older account gets it, which is `developer1` or `qa1` in the demo accounts. To follow one bug through every step, find it in the queue of each Developer and QA tester account.

## Developer

A Developer works only on reports assigned to that account. Open **`/developer`** after signing in to see the assigned-report queue. A non-Developer account cannot use the Developer workspace, and a report that is not assigned to the signed-in Developer is not disclosed.

### Investigating a report

Select **Open report** to view the original Python code, error message, expected and actual behaviour, and reproduction steps. Select **Start investigation** to move an `open` report to `in_progress`.

Under **Investigation notes**, add a non-empty note describing the investigation. The note shows its author and timestamps. The author may edit the note while the report is `open` or `in_progress`; notes become read-only after the fix is handed to QA.

### Submitting a fix

Under **Submit corrected Python to QA**, enter valid Python syntax and an optional submission note, then select **Submit to QA**. The corrected code is stored as a new immutable revision. The original Reporter code is never overwritten, and earlier revisions remain available.

The **Revision history and comparison** section shows each revision and compares it with the original code. Added lines are highlighted in green and removed lines in red. The latest revision is expanded first.

Before handoff, the Developer must provide investigation information and corrected code. After submission, the report shows **Awaiting QA** with the selected revision and submission details. The Developer cannot approve or reject the fix; those decisions belong to the QA tester.

### Responding to QA feedback

If QA rejects a revision, the Developer sees the feedback and the affected revision. Submit a new revision rather than editing the rejected code. The rejected revision, feedback, authorship and timestamps remain in history. A new revision returns the report to `in_progress`, after which it can be submitted to QA again.

### AI debugging advisor

On an assigned report, select **Get debugging guidance** in **AI debugging advisor**. The result is labelled **ADVISORY GUIDANCE — review manually; no code was run or applied.** It can suggest a likely cause, checks and the shape of a fix, but it cannot modify reports, revisions or workflow status. Submitted code, report text, notes and AI output are treated as untrusted text.

The advisor uses only the current assigned report and recent investigation notes. Requests are bounded, authenticated and rate-limited. If AI is unavailable, times out, or reaches a limit, the page shows a safe message and the normal Developer workflow remains available.

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

After deciding, a green message confirms it: "Fix approved. The report is closed." or "Fix rejected. The report is back with the Developer." Each version can be decided once. After you reject, the report waits for the Developer's next version, which then appears as **Awaiting QA** again. If the report was already decided, for example in another tab, you see "This decision could not be saved. The fix may already have been decided."
