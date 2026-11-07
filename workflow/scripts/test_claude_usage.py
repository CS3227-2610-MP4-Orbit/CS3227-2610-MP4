"""Synthetic, privacy-focused tests for counts-only Claude Code usage capture."""

from __future__ import annotations

import json
import shutil
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import agent_workflow
import claude_usage
import token_usage

SESSION = "11111111-1111-4111-8111-111111111111"
OTHER = "22222222-2222-4222-8222-222222222222"
PRIVATE = "private prompt, code and credential must never be written"


def usage(uncached: int, read: int, write: int, output: int, thinking: int | None = None) -> dict:
    value = {"input_tokens": uncached, "cache_read_input_tokens": read,
             "cache_creation_input_tokens": write, "output_tokens": output}
    if thinking is not None:
        value["output_tokens_details"] = {"thinking_tokens": thinking}
    return value


def response(message_id: str, at: str, used: dict, *blocks: str, model: str = "claude-test") -> list[dict]:
    """One API response, written once per content block with the usage repeated (as Claude Code does)."""
    return [{"type": "assistant", "timestamp": at, "cwd": f"/private/{PRIVATE}",
             "message": {"id": message_id, "model": model, "usage": used,
                         "content": [{"type": block, "text": PRIVATE, "input": {"cmd": PRIVATE}}]}}
            for block in blocks]


def write(path: Path, items: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as stream:
        for item in items:
            stream.write(json.dumps(item) + "\n")


class ClaudeUsageTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = Path(tempfile.mkdtemp()).resolve()
        self.addCleanup(shutil.rmtree, self.temp)
        self.projects = self.temp / "projects"
        self.usage_dir = self.temp / "usage"
        self.main = self.projects / "-some-project" / f"{SESSION}.jsonl"
        write(self.main, [{"type": "user", "timestamp": "2026-11-07T00:00:00Z", "message": PRIVATE}])
        write(self.main, response("before", "2026-11-07T00:00:30Z", usage(1000, 0, 0, 1000), "text"))

    def run_task(self, *, run_file: Path | None = None) -> dict:
        with patch.object(claude_usage, "now_utc", return_value="2026-11-07T00:01:00Z"):
            claude_usage.start_capture("QA001", SESSION, self.projects, usage_dir=self.usage_dir)
        write(self.main, response("r1", "2026-11-07T00:02:00Z", usage(2, 900, 100, 50, 20),
                                  "thinking", "tool_use", "tool_use"))
        write(self.main, response("r2", "2026-11-07T00:03:00Z", usage(3, 1000, 10, 40, 5), "text"))
        write(self.main, response("synth", "2026-11-07T00:03:30Z", usage(0, 0, 0, 0), "text",
                                  model="<synthetic>"))
        sub = self.main.with_suffix("") / "subagents"
        write(sub / "agent-abc123.jsonl", response("s1", "2026-11-07T00:04:00Z",
                                                   usage(1, 200, 300, 60, 10), "tool_use", model="claude-small"))
        (sub / "agent-abc123.meta.json").write_text(json.dumps(
            {"agentType": "feature-dev:code-reviewer", "description": PRIVATE}), encoding="utf-8")
        write(self.main, response("after", "2026-11-07T00:09:00Z", usage(9999, 0, 0, 9999), "text"))
        with patch.object(claude_usage, "now_utc", return_value="2026-11-07T00:05:00Z"):
            return claude_usage.finish_capture("QA001", self.projects, run_file=run_file,
                                               usage_dir=self.usage_dir)

    def test_counts_unique_responses_inside_the_window_across_subagents(self) -> None:
        result = self.run_task()
        total = result["total_usage"]
        self.assertEqual(result["responses"], 3)  # r1 once despite three entries; no before/after/synthetic
        self.assertEqual(result["tool_calls"], 3)
        self.assertEqual(total["input_tokens"], (2 + 900 + 100) + (3 + 1000 + 10) + (1 + 200 + 300))
        self.assertEqual(total["cached_input_tokens"], 900 + 1000 + 200)
        self.assertEqual(total["cache_write_input_tokens"], 100 + 10 + 300)
        self.assertEqual(total["output_tokens"], 50 + 40 + 60)
        self.assertEqual(total["reasoning_output_tokens"], 20 + 5 + 10)
        self.assertEqual(total["total_tokens"], total["input_tokens"] + total["output_tokens"])
        self.assertEqual(result["sessions"]["root"]["model_ids"], ["claude-test"])
        self.assertEqual(result["sessions"]["abc123"]["agent_path"], "/root/feature_dev_code_reviewer")

    def test_writes_counts_only(self) -> None:
        self.run_task()
        for path in self.usage_dir.iterdir():
            text = path.read_text(encoding="utf-8")
            self.assertNotIn(PRIVATE, text)
            self.assertNotIn("/private/", text)

    def test_missing_thinking_count_is_null_not_zero(self) -> None:
        with patch.object(claude_usage, "now_utc", return_value="2026-11-07T00:01:00Z"):
            claude_usage.start_capture("QA002", SESSION, self.projects, usage_dir=self.usage_dir)
        write(self.main, response("r1", "2026-11-07T00:02:00Z", usage(1, 2, 3, 4), "text"))
        with patch.object(claude_usage, "now_utc", return_value="2026-11-07T00:05:00Z"):
            result = claude_usage.finish_capture("QA002", self.projects, usage_dir=self.usage_dir)
        self.assertIsNone(result["total_usage"]["reasoning_output_tokens"])
        self.assertEqual(result["total_usage"]["output_tokens"], 4)

    def test_malformed_line_nulls_counts_but_a_partial_last_line_is_ignored(self) -> None:
        with patch.object(claude_usage, "now_utc", return_value="2026-11-07T00:01:00Z"):
            claude_usage.start_capture("QA003", SESSION, self.projects, usage_dir=self.usage_dir)
        write(self.main, response("r1", "2026-11-07T00:02:00Z", usage(1, 2, 3, 4, 1), "text"))
        with self.main.open("a", encoding="utf-8") as stream:
            stream.write('{"type": "assistant", "trunc')  # still being written
        window = claude_usage.read_window(self.main, "2026-11-07T00:01:00Z", "2026-11-07T00:05:00Z")
        self.assertEqual(window["usage"]["output_tokens"], 4)
        with self.main.open("a", encoding="utf-8") as stream:
            stream.write("\n")
        window = claude_usage.read_window(self.main, "2026-11-07T00:01:00Z", "2026-11-07T00:05:00Z")
        self.assertIsNone(window["usage"]["output_tokens"])

    def test_fills_a_draft_run_record(self) -> None:
        # A throwaway repository root, so the test never writes into the real workflow/ folder.
        repo = self.temp / "repo"
        draft = repo / "workflow/requests/QA001-test-run.json"
        draft.parent.mkdir(parents=True)
        template = json.loads((token_usage.ROOT / "workflow/templates/run-record.json").read_text(encoding="utf-8"))
        template.update(task_id="QA001", recorded_at="2026-11-07T00:06:00Z", result="unmeasured")
        draft.write_text(json.dumps(template), encoding="utf-8")
        self.usage_dir = repo / "workflow/evidence/usage"
        with patch.object(token_usage, "ROOT", repo), patch.object(agent_workflow, "ROOT", repo):
            self.run_task(run_file=draft)
        run = json.loads(draft.read_text(encoding="utf-8"))
        self.assertEqual(run["cached_tokens"], 2100)
        self.assertEqual(run["reasoning_tokens"], 35)
        self.assertEqual(run["tool_calls"], 3)
        self.assertEqual(run["model_ids"]["/root/feature_dev_code_reviewer"], ["claude-small"])
        self.assertIn("Claude Code", run["notes"])

    def test_refuses_bad_or_unknown_sessions_and_duplicate_starts(self) -> None:
        for bad in (None, "not-a-session", OTHER):
            with self.assertRaises(ValueError):
                claude_usage.start_capture("QA004", bad, self.projects, usage_dir=self.usage_dir)
        claude_usage.start_capture("QA005", SESSION, self.projects, usage_dir=self.usage_dir)
        with self.assertRaises(FileExistsError):
            claude_usage.start_capture("QA005", SESSION, self.projects, usage_dir=self.usage_dir)

    def test_refuses_a_codex_start_file(self) -> None:
        self.usage_dir.mkdir(parents=True)
        (self.usage_dir / "QA006.start.json").write_text(json.dumps(
            {"task_id": "QA006", "root_thread_id": SESSION, "captured_at": "2026-11-07T00:00:00Z"}),
            encoding="utf-8")
        with self.assertRaises(ValueError):
            claude_usage.finish_capture("QA006", self.projects, usage_dir=self.usage_dir)


if __name__ == "__main__":
    unittest.main()
