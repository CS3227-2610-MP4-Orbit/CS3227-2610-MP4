<!--
Sync Impact Report (remove before committing)
Version change: template (unversioned) -> 1.0.0; initial project constitution.
Modified principles: five template placeholders -> five project principles below.
Added sections: Product and Delivery Constraints; Development Workflow and Evidence.
Removed sections: none; placeholder sections were filled.
Follow-up TODOs: team must confirm ownership, SoC LLM limits, and deployment details in feature specs.
-->
# CS3227 MP4 Bug Resolution Platform Constitution

## Core Principles

### I. Spec-Driven Development
Every feature MUST have a reviewed specification with user stories, acceptance criteria, role
permissions, failure cases, and security requirements before implementation. Plans and tasks MUST
trace to that specification; code, tests, and user documentation MUST match the released behavior.
Changes to a shared schema or interface MUST be agreed and recorded before dependent role work.
This makes the three members' work integrable and the final product testable.

### II. Coordinated, Specialized Agent Work
Development MUST use an explicit orchestrator for multi-agent tasks and distinct agent ownership
for exploration, generation, security review, and verification when those roles are needed.
Assignments MUST have bounded scope, relevant context, a handoff artifact, and a named next owner.
The orchestrator MUST resolve conflicting findings and verify integration. Agents MUST NOT
silently delegate overlapping work. Simple tasks MAY use one agent; the route and reason MUST be
recorded. This makes coordination observable rather than merely claiming multiple agents were used.

### III. Security by Design and Verification
Authentication and role-based access MUST be enforced on every protected server operation and in
database row-level policies. AI input MUST treat submitted code, comments, errors, and reports as
untrusted data. The app MUST bound and validate inputs and outputs, prevent secrets and unrelated
records from entering prompts, render generated content safely, and never execute submitted code
or apply generated fixes automatically. Tests MUST exercise cross-role access, prompt injection,
quota exhaustion, malformed AI output, and provider failure before release. Security-sensitive
changes MUST receive an independent security review.

### IV. Context Engineering and Resource-Aware AI
Each product role MUST have at least one useful LLM-based feature using the required SoC LLM.
The shared AI gateway MUST send only task-relevant context, enforce provider and application
limits, bound output and retries, handle failures, and record usage where available. Development
agents MUST receive role-specific context and compact handoffs rather than entire transcripts by
default. Model, agent count, context size, and effort SHOULD match task difficulty; deviations
MUST be explained in the experiment record. Token, cache, latency, tool-call, and retry claims
MUST come from measurements, with unavailable counters identified as such.

### V. Complete, Maintainable, Deployable Product
The product MUST provide a complete Reporter -> Developer -> QA resolution loop with versioned
fixes and test/decision history. Shared components, storage, and AI access MUST have clear single
responsibilities and avoid duplicate logic. CI MUST run relevant automated checks. Development
and production MUST use separate configuration and data; the team MUST manage deployment
outside build-and-host AI environments. The public repository MUST include accurate user and
developer guides, a product website, workflow artifacts, verified interaction summaries, and
evidence-backed reflections.

## Product and Delivery Constraints
The team has three members and MUST deliver three corresponding product roles: Bug Reporter,
Developer, and QA Tester. The app concerns programming or software engineering and initially
supports Python snippets. It MUST NOT reuse a previous MP as the submitted product. The SoC LLM
is the required provider for product AI features; credentials MUST remain server-side. Team
members MUST review its actual limits before setting quotas. The final repository MUST use the
required public organization repository name, keep `master` current for submission, and follow
the assignment's deadline and submission instructions. Deployment and product website setup MUST
be managed by the team, with separate development and production environments.

## Development Workflow and Evidence
For each feature, the team MUST progress through specification, clarification, plan, tasks,
implementation, security review where relevant, verification, and release review. Task owners
MUST record acceptance evidence and unresolved issues in handoffs. CI and database security
tests MUST pass before release. Interaction summaries MUST be stored under the initiating
member's `logs/` folder and checked against actual changes. Reflections MUST compare concrete
multi-agent and context/resource choices using recorded results; fabricated measurements or
unverified outcome claims are prohibited. `workflow/` defines the local coordination protocol
and evidence format alongside Spec Kit artifacts.

## Governance
This constitution governs all specs, plans, tasks, reviews, and release decisions. Any amendment
MUST be proposed in a reviewable change, state the reason and impact on existing artifacts, and
be accepted by the team before merging. Versioning uses MAJOR for incompatible principle or
governance changes, MINOR for new principles or material expansions, and PATCH for clarifications
without changed obligations. Every feature review MUST check compliance and record any justified
exception with an owner and resolution date. The team MUST reconcile dependent specs, tasks,
tests, and guides after an amendment.

**Version**: 1.0.0 | **Ratified**: 2026-11-04 | **Last Amended**: 2026-11-04
