# Agentic workflow experiments

Run these on representative, bounded tasks and record the data in `docs/Reflections.md` and `workflow/evidence/`. Results must be measured, never inferred from the proposed design.

1. **Routing:** Execute comparable tasks with task-based routing and a fixed all-agent route. Record agents invoked, time, calls, tokens, retries, defects found and quality of handoff. Use at least a simple documentation task and a security-sensitive AI or RLS task.
2. **Context:** Give a reviewer a focused spec/code bundle, then a larger unfiltered bundle for a comparable task. Check correctness, missed instructions, tokens and time. Keep the stable prompt prefix the same.
3. **Handoff:** Have a second agent resume from a structured handoff, then compare with a full-transcript resume. Check whether decisions and unresolved work are correctly recovered.
4. **Security:** Test prompt injection embedded in a submitted Python comment or error message, cross-role access, quota exhaustion, malformed AI output and provider failure. Record exact expected and observed behavior without storing private code or credentials.

If provider token or cache counters are unavailable, state that clearly and use separately labeled local measurements. Do not calculate a reasoning-token percentage without a real counter.
