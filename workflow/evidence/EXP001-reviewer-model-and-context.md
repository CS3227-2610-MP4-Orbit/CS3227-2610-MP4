# EXP001: reviewer model and context size on a known escaped defect

Run on 2026-11-12 by Johannsen, with Claude Code subagents.

## Question

Does a stronger reviewer model, or a larger context bundle, find more of a real defect, and what does each cost?

## Setup

- **Seeded defect:** the fix-submission syntax check at commit `25431f1` (`src/lib/developer/python-validation.ts`).
  - It spawned `python -c "ast.parse(...)"`, but Vercel's Node.js runtime has no Python binary.
  - As a result, every Developer fix was rejected on the deployed apps, from 7 Nov until it was fixed in #37 on 12 Nov.
  - It escaped two code reviews, a security review and CI, all of which ran where Python existed.
- **Same task for every arm:** "Find correctness, security and deployment defects. Report at most 6 findings, most severe first, under 300 words." Each reviewer was told the app is deployed to Vercel's Node.js runtime. The reviewers were read-only and ran in parallel.
- **Focused bundle (arms A–C):** `python-validation.ts`, its only caller `actions.ts`, `vercel.json` and `deploy.yml`. That is four files.
- **Unfiltered bundle (arm D):** a full checkout at `25431f1`. The reviewer was told to read `AGENTS.md`, the README, both guides, the workflow docs, the agent files and the spec first, then find the code itself.
- **Measurements:** token, tool-call and duration counts come from the Agent tool's usage report for each subagent. The pass criterion was whether the reviewer reported the missing Python binary as its top finding.

## Results

Token counts are from the session transcripts. They were captured by `claude_usage.py` into `workflow/evidence/usage/DOC001-final-docs.usage.json`, which lists each subagent separately. They are summed over every API response.

| Arm | Model | Context | Responses | Tool calls | Input (cached / cache write) | Output (reasoning) | Time | Found the defect | Rank | Findings |
| --- | --- | --- | ---: | ---: | --- | --- | ---: | --- | --- | ---: |
| A | Haiku | focused | 3 | 3 | 253,171 (161,583 / 91,582) | 4,905 (3,744) | 30.9 s | yes | 1 (high) | 5 |
| B | Sonnet | focused | 2 | 1 | 164,000 (72,402 / 91,594) | 1,156 (0) | 14.6 s | yes | 1 (high) | 6 |
| C | Opus | focused | 2 | 1 | 163,405 (72,398 / 91,003) | 2,273 (1,170) | 30.7 s | yes | 1 (high) | 6 |
| D | Sonnet | unfiltered | 5 | 4 | 453,747 (372,586 / 81,151) | 2,623 (605) | 40.2 s | yes | 1 (high) | 6 |

The Agent tool's own summary reported only 93–101k "tokens" per arm. That is roughly one response's prompt, not the cumulative total. We first recorded those smaller numbers, and replaced them once the transcript totals were available.

### Other findings

- **Spawn before auth:** all four arms also reported that the check spawns a process before any sign-in check, which allows unauthenticated CPU and cost abuse. This is real, and the fix in #37 removed it.
- **Fails closed:** B, C and D reported that the check can't tell "Python is missing" apart from "your code is invalid".
- **Migration before deploy:** A and D reported that `supabase db push` runs before the deploy, with no rollback.
- **Note precondition:** only D reported that `submit_fix` requires an investigation note and returns a misleading generic error without one. Finding this needed the SQL migration, which was outside the focused bundle.
- **Unverifiable:** A reported one finding about the RLS on note edits that it could not check from the bundle, and said so.

## Analysis

- **Fixed overhead dominated.** Every response re-sends the subagent's system prompt and tool definitions. The first response cost about 82k input tokens before any file was read (72k cached plus 91k written to the cache across the two responses of B and C). A review that takes two responses therefore costs about 164k input tokens whatever the model. Each additional tool round trip adds another ~80–90k.
- **Model choice made no difference to detection.** Once the deploy target was stated, all three models ranked the defect first. What differed was how they worked:
  - Haiku took 3 tool calls where Sonnet and Opus took 1, which cost **1.5× the input** (253k against 164k).
  - Haiku also spent the most on reasoning (3,744 tokens).
  - Sonnet was the fastest (14.6 s) and output the fewest tokens.

  The cheapest model per token was not the cheapest per review.
- **The unfiltered context cost much more and found one extra issue.**
  - Compared with B, D used **2.77× the input** (454k against 164k), took 2.75× as long and made 4× the tool calls.
  - It added one finding that needed a file outside the bundle.
  - It did not read every document it was told to; it stopped after four tool calls. A larger instruction set is not the same as a larger read.
- **The original reviews missed it because of missing context, not model strength.** The 7 Nov reviews were never told where the code would run.
  - The symptom was visible on 9 Nov: `logs/johannsen/2026-11-09-qa-feedback-draft.md` says the tests only pass with `PYTHON_BIN=python3`.
  - It was worked around locally instead of being asked about for production.
  - The one sentence "deployed to Vercel's Node.js runtime" is what made every reviewer here find it.

## Limitations

- One defect and one trial per arm, so this shows a direction, not statistical significance.
- The reviewers knew this was a review task with a deployment angle, and the prompt named the deployment target.
- The defect's fix was already known, which could bias how the bundle was chosen.
- Transcript counts are what the client recorded, not a provider invoice.
