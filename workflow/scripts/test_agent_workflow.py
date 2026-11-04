"""Behavioral checks for routing, bounded context and run evidence."""

from __future__ import annotations

import json
import io
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import patch

from agent_workflow import ROOT, context, export, plan, record, safe_path, update_assignment, validate_run


class AgentWorkflowTests(unittest.TestCase):
    def setUp(self) -> None:
        self.task = {
            "task_id": "T-TEST",
            "goal": "Review access rules",
            "owner": "joseph",
            "owned_paths": ["workflow/specs/001-bug-lifecycle/spec.md"],
            "spec": "workflow/specs/001-bug-lifecycle/spec.md",
            "complexity": "standard",
            "security_sensitive": False,
            "needs_exploration": False,
            "acceptance_criteria": ["Findings cite evidence"],
            "context_refs": [{"path": "workflow/specs/001-bug-lifecycle/spec.md",
                              "start_line": 1, "end_line": 3}],
        }

    def test_simple_task_uses_one_agent(self) -> None:
        self.task["complexity"] = "simple"
        self.assertEqual(plan(self.task)["agents"], ["orchestrator"])

    def test_security_task_adds_independent_review_and_verification(self) -> None:
        self.task["security_sensitive"] = True
        route = plan(self.task)
        self.assertEqual(route["agents"], ["orchestrator", "generator", "code_reviewer", "security_reviewer", "verifier"])
        self.assertEqual(route["parallel_after_generation"], ["code_reviewer", "security_reviewer"])
        self.assertEqual(route["model_tiers"]["security_reviewer"], "strong")

    def test_context_only_contains_selected_lines_as_data(self) -> None:
        packed = context(self.task)
        self.assertEqual(len(packed["excerpts"]), 1)
        self.assertEqual(packed["excerpts"][0]["end_line"], 3)
        self.assertIn("untrusted_content", packed["excerpts"][0])

    def test_context_rejects_secret_and_escape_paths(self) -> None:
        for path in (".env.local", "../outside.txt", "node_modules/package.json"):
            with self.assertRaises(ValueError, msg=path):
                safe_path(path)

    def test_passing_run_requires_evidence_and_no_raw_prompt(self) -> None:
        run = json.loads((ROOT / "workflow/templates/run-record.json").read_text())
        run["recorded_at"] = "2026-11-04T00:00:00Z"
        run["result"] = "pass"
        with self.assertRaises(ValueError):
            validate_run(run)
        run["evidence_paths"] = ["workflow/specs/001-bug-lifecycle/spec.md"]
        validate_run(run)
        run["prompt"] = "raw content"
        with self.assertRaises(ValueError):
            validate_run(run)

    def test_record_and_export_measured_metadata(self) -> None:
        run = json.loads((ROOT / "workflow/templates/run-record.json").read_text())
        run.update({"recorded_at": "2026-11-04T00:00:00Z", "result": "pass",
                    "actual_agents": ["orchestrator"], "tool_calls": 2,
                    "evidence_paths": ["workflow/specs/001-bug-lifecycle/spec.md"]})
        with tempfile.TemporaryDirectory() as directory:
            with patch("agent_workflow.RUNS", Path(directory) / "runs.jsonl"):
                record(run)
                output = io.StringIO()
                with redirect_stdout(output):
                    export()
                self.assertIn("T001", output.getvalue())
                self.assertIn("tool_calls", output.getvalue())

    def test_claim_rejects_overlapping_active_file(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            board = Path(directory) / "assignments.json"
            board.write_text('{"assignments":[]}')
            with patch("agent_workflow.BOARD", board):
                update_assignment(self.task, "active")
                other = {**self.task, "task_id": "T-OTHER", "owner": "jordan"}
                with self.assertRaises(ValueError):
                    update_assignment(other, "active")
                update_assignment(self.task, "done")
                update_assignment(other, "active")


if __name__ == "__main__":
    unittest.main()
