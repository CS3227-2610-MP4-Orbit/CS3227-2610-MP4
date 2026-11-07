# User guide

The app tracks a Python bug from report to verified fix. Each account has one role: **Reporter**, **Developer** or **QA tester**. This guide is being written role by role as features are verified. Sections for roles not listed below are not ready for testing yet. Test accounts and URLs will be added before release.

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
