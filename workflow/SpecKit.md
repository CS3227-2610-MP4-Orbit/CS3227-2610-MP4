# Install and initialize GitHub Spec Kit

These are steps for the team to run on a reviewable branch. Spec Kit is **not installed in this repository yet**. The existing `workflow/specs/` remains the source to migrate or reference; initialization will not automatically import it.

1. Commit or back up the current repository changes, then create a branch for adopting Spec Kit. The repository is non-empty and has an `AGENTS.md`, so review generated files before merging.
2. Install [uv](https://docs.astral.sh/uv/getting-started/installation/) if `uv --version` fails. On macOS with Homebrew: `brew install uv`.
3. Install a **pinned release** of the official CLI. Replace `vX.Y.Z` with a tag from [Spec Kit releases](https://github.com/github/spec-kit/releases):

   ```sh
   uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@vX.Y.Z
   specify version
   ```

4. From this repository root, initialize in place for Codex:

   ```sh
   specify init --here --force --integration codex --script sh
   git status --short
   git diff --check
   ```

   `--force` permits a merge into a non-empty project and may overwrite conflicting managed files. Inspect the diff, especially `AGENTS.md`, `.agents/`, `.codex/` and `.specify/`, before accepting it. Do not delete the Next.js agent rules.

5. In Codex, use the installed `$speckit-constitution`, `$speckit-specify`, `$speckit-plan`, `$speckit-tasks` and `$speckit-analyze` skills as applicable. Start with the reviewed `workflow/specs/001-bug-lifecycle/spec.md` and record how it maps to Spec Kit's generated `specs/` artifacts. Keep the local specialized-agent coordination protocol in `workflow/agents/` alongside the toolkit.

If you only want a one-time CLI run, the official alternative is `uvx --from git+https://github.com/github/spec-kit.git@vX.Y.Z specify init --here --force --integration codex --script sh`. It still changes this repository. See the [official installation guide](https://github.github.io/spec-kit/installation.html), [existing-project guide](https://github.github.io/spec-kit/guides/existing-projects.html), and [Codex integration guide](https://github.github.io/spec-kit/integrations/codex.html).
