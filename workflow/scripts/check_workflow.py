"""Check handoff documents and required spec sections without external dependencies."""

from __future__ import annotations

import json
from pathlib import Path

from agent_workflow import BOARD, RUNS, validate_board, validate_run


ROOT = Path(__file__).resolve().parents[2]
REQUIRED_HANDOFF = {
    "task_id": str,
    "goal": str,
    "owner": str,
    "status": str,
    "spec": str,
    "context_paths": list,
    "decisions": list,
    "findings": list,
    "acceptance_criteria": list,
    "artifacts": list,
    "verification": list,
    "remaining_work": list,
    "next_owner": str,
}
REQUIRED_SPEC_HEADINGS = (
    "## Goal and scope",
    "## Stories and acceptance criteria",
    "## Lifecycle",
    "## Shared design decisions to resolve",
)


def check_handoff(path: Path) -> list[str]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        return [f"{path}: invalid JSON: {error}"]
    if not isinstance(data, dict):
        return [f"{path}: expected a JSON object"]
    errors = []
    for key, kind in REQUIRED_HANDOFF.items():
        if key not in data or not isinstance(data[key], kind):
            errors.append(f"{path}: {key} must be {kind.__name__}")
    spec = data.get("spec")
    if isinstance(spec, str) and not (ROOT / spec).is_file():
        errors.append(f"{path}: spec does not exist: {spec}")
    return errors


def main() -> int:
    errors = []
    for path in sorted((ROOT / "workflow/specs").glob("*/spec.md")):
        body = path.read_text(encoding="utf-8")
        for heading in REQUIRED_SPEC_HEADINGS:
            if heading not in body:
                errors.append(f"{path}: missing {heading}")
        if not path.with_name("tasks.md").is_file():
            errors.append(f"{path}: missing tasks.md")
    if not list((ROOT / "workflow/specs").glob("*/spec.md")):
        errors.append("workflow/specs: no specs found")
    for path in sorted((ROOT / "workflow/evidence").glob("*.json")):
        errors.extend(check_handoff(path))
    try:
        validate_board(json.loads(BOARD.read_text(encoding="utf-8")))
    except (OSError, ValueError, json.JSONDecodeError) as error:
        errors.append(f"{BOARD}: {error}")
    if RUNS.exists():
        for number, line in enumerate(RUNS.read_text(encoding="utf-8").splitlines(), start=1):
            if not line.strip():
                continue
            try:
                validate_run(json.loads(line))
            except (ValueError, json.JSONDecodeError) as error:
                errors.append(f"{RUNS}:{number}: {error}")
    for error in errors:
        print(error)
    if errors:
        return 1
    print("Workflow structure valid")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
