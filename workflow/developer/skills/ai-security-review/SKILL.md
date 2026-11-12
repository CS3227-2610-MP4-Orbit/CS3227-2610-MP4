---
name: ai-security-review
description: Review HackHub AI features for prompt injection, data leakage, unsafe code handling, secret exposure, and resource abuse.
---

# AI security review

Use this skill for the AI Debugging Assistant or any feature that sends bug data, code, or test
content to an LLM.

## Review focus

- Classify system rules as trusted and bug content as untrusted.
- Check that instructions embedded in code, errors, READMEs, and notes are not followed.
- Confirm only the current authorised bug and revision enter the model context.
- Enforce input size, output size, timeout, rate, and token limits.
- Keep provider keys and privileged database access server-side.
- Treat generated code as advisory; never execute or apply it automatically.
- Validate structured model output and handle malformed or refused responses safely.
- Check logs and cache entries for secrets or data belonging to other roles.

## Required adversarial tests

Include at least one prompt-injection payload, an oversized input, malformed model output, an
unauthorised bug identifier, and a request that attempts to expose another user's data.

## Output

Report the attack input, expected safe behavior, observed behavior, severity, and remediation.
