"""Synthetic, privacy-focused tests for counts-only Codex usage capture."""

from __future__ import annotations

import json
import io
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from unittest.mock import patch

import token_usage


ROOT_ID = "11111111-1111-1111-1111-111111111111"
CHILD_ID = "22222222-2222-2222-2222-222222222222"
NEW_ID = "33333333-3333-3333-3333-333333333333"
GUARDIAN_ID = "44444444-4444-4444-4444-444444444444"
FOREIGN_ID = "55555555-5555-5555-5555-555555555555"
PRIVATE = "private prompt and credential must never be written"


def counter(value: int) -> dict[str, int]:
    return {key: value for key in token_usage.COUNTERS}


def append(path: Path, item: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as stream:
        stream.write(json.dumps(item) + "\n")


def make_session(root: Path, thread_id: str, *, parent: str | None = None,
                 agent_path: str | None = None, value: int | None = None,
                 created_at: str = "2026-11-05T00:00:00Z", spawned: bool = True,
                 model: str = "gpt-test") -> Path:
    path = root / f"{thread_id}.jsonl"
    append(path, {"type": "session_meta", "timestamp": created_at, "payload": {
        "id": thread_id, "parent_thread_id": parent, "agent_path": agent_path,
        "source": {"subagent": {"thread_spawn": {}}} if parent and spawned else {},
        "base_instructions": PRIVATE, "cwd": f"/private/{PRIVATE}"}})
    append(path, {"type": "turn_context", "timestamp": created_at,
                  "payload": {"model": model, "summary": PRIVATE}})
    append(path, {"type": "event_msg", "payload": {"type": "user_message", "message": PRIVATE}})
    if value is not None:
        append(path, {"type": "event_msg", "payload": {"type": "token_count", "info": {
            "total_token_usage": counter(value), "private": PRIVATE}}})
    return path


class TokenUsageTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.sessions = Path(self.temp.name) / "sessions"

    def test_scopes_to_root_and_spawned_agents_without_leaking_content(self) -> None:
        root = make_session(self.sessions, ROOT_ID, value=10)
        make_session(self.sessions, CHILD_ID, parent=ROOT_ID, agent_path="/root/generator", value=3)
        make_session(self.sessions, GUARDIAN_ID, parent=ROOT_ID, agent_path="/root/guardian",
                     spawned=False, value=999)
        make_session(self.sessions, FOREIGN_ID, value=999)
        with patch.object(token_usage, "now_utc", return_value="2026-11-05T00:01:00Z"):
            start = token_usage.snapshot("OBS001", ROOT_ID, self.sessions)
        append(root, {"type": "event_msg", "payload": {"type": "token_count", "info": {
            "total_token_usage": counter(15)}}})
        append(root, {"type": "turn_context", "timestamp": "2026-11-05T00:02:00Z",
                      "payload": {"model": "gpt-new"}})
        make_session(self.sessions, NEW_ID, parent=ROOT_ID, agent_path="/root/verifier",
                     created_at="2026-11-05T00:02:00Z", value=4)
        with patch.object(token_usage, "now_utc", return_value="2026-11-05T00:03:00Z"):
            end = token_usage.snapshot("OBS001", ROOT_ID, self.sessions,
                                       model_since=start["captured_at"])
        result = token_usage.usage_delta(start, end)
        self.assertEqual(set(result["sessions"]), {ROOT_ID, CHILD_ID, NEW_ID})
        self.assertEqual(result["total_usage"]["input_tokens"], 5 + 0 + 4)
        self.assertEqual(result["sessions"][ROOT_ID]["model_ids"], ["gpt-new"])
        self.assertEqual(result["sessions"][CHILD_ID]["model_ids"], [])
        self.assertEqual(result["sessions"][NEW_ID]["model_ids"], ["gpt-test"])
        self.assertNotIn(PRIVATE, json.dumps(start) + json.dumps(end) + json.dumps(result))
        self.assertNotIn(str(self.sessions), json.dumps(result))

    def test_missing_counters_remain_unknown(self) -> None:
        make_session(self.sessions, ROOT_ID)
        start = token_usage.snapshot("OBS001", ROOT_ID, self.sessions)
        end = token_usage.snapshot("OBS001", ROOT_ID, self.sessions)
        self.assertIsNone(token_usage.usage_delta(start, end)["total_usage"]["input_tokens"])

    def test_negative_delta_is_rejected(self) -> None:
        make_session(self.sessions, ROOT_ID, value=10)
        start = token_usage.snapshot("OBS001", ROOT_ID, self.sessions)
        end = token_usage.snapshot("OBS001", ROOT_ID, self.sessions)
        end["sessions"][ROOT_ID]["usage"]["input_tokens"] = 9
        with self.assertRaisesRegex(ValueError, "decreased"):
            token_usage.usage_delta(start, end)

    def test_missing_session_is_rejected(self) -> None:
        make_session(self.sessions, ROOT_ID, value=10)
        make_session(self.sessions, CHILD_ID, parent=ROOT_ID, agent_path="/root/generator", value=3)
        start = token_usage.snapshot("OBS001", ROOT_ID, self.sessions)
        end = token_usage.snapshot("OBS001", ROOT_ID, self.sessions)
        end["sessions"].pop(CHILD_ID)
        with self.assertRaisesRegex(ValueError, "missing"):
            token_usage.usage_delta(start, end)

    def test_subagent_cannot_be_used_as_root(self) -> None:
        make_session(self.sessions, CHILD_ID, parent=ROOT_ID, agent_path="/root/generator", value=3)
        with self.assertRaisesRegex(ValueError, "root orchestrator"):
            token_usage.snapshot("OBS001", CHILD_ID, self.sessions)

    def test_preexisting_child_missing_from_start_is_unknown(self) -> None:
        make_session(self.sessions, ROOT_ID, value=10)
        with patch.object(token_usage, "now_utc", return_value="2026-11-05T00:01:00Z"):
            start = token_usage.snapshot("OBS001", ROOT_ID, self.sessions)
        make_session(self.sessions, NEW_ID, parent=ROOT_ID, agent_path="/root/verifier",
                     created_at="2026-11-05T00:00:30Z", value=4)
        end = token_usage.snapshot("OBS001", ROOT_ID, self.sessions,
                                   model_since=start["captured_at"])
        result = token_usage.usage_delta(start, end)
        self.assertIsNone(result["sessions"][NEW_ID]["usage"]["input_tokens"])
        self.assertIsNone(result["total_usage"]["input_tokens"])

    def test_duplicate_snapshot_is_rejected(self) -> None:
        path = Path(self.temp.name) / "start.json"
        token_usage.write_new(path, {"task_id": "OBS001"})
        with self.assertRaises(FileExistsError):
            token_usage.write_new(path, {"task_id": "OBS001"})

    def test_draft_run_gets_counts_and_provenance_only(self) -> None:
        root = Path(self.temp.name) / "workspace"
        draft = root / "workflow/requests/OBS001-run.json"
        evidence = root / "workflow/evidence/usage/OBS001.usage.json"
        draft.parent.mkdir(parents=True)
        evidence.parent.mkdir(parents=True)
        evidence.write_text("{}")
        run = json.loads((token_usage.ROOT / "workflow/templates/run-record.json").read_text())
        run.update({"task_id": "OBS001", "recorded_at": "2026-11-05T00:00:00Z",
                    "result": "pass", "evidence_paths": [], "notes": "Measured run."})
        draft.write_text(json.dumps(run))
        summary = {"task_id": "OBS001", "total_usage": counter(7),
                   "sessions": {ROOT_ID: {"agent_path": "root", "model_ids": ["gpt-test"]}}}
        with patch.object(token_usage, "ROOT", root), patch.object(token_usage, "validate_run"):
            token_usage.update_draft_run(draft, summary, evidence)
        updated = json.loads(draft.read_text())
        self.assertEqual(updated["input_tokens"], 7)
        self.assertEqual(updated["cached_tokens"], 7)
        self.assertEqual(updated["model_ids"], {"root": ["gpt-test"]})
        self.assertIn("workflow/evidence/usage/OBS001.usage.json", updated["evidence_paths"])
        self.assertNotIn(PRIVATE, draft.read_text())

    def test_invalid_draft_can_retry_finish(self) -> None:
        make_session(self.sessions, ROOT_ID, value=10)
        usage_dir = Path(self.temp.name) / "usage"
        token_usage.write_new(usage_dir / "OBS001.start.json",
                              token_usage.snapshot("OBS001", ROOT_ID, self.sessions))
        with patch.object(token_usage, "update_draft_run", side_effect=ValueError("invalid draft")):
            with self.assertRaisesRegex(ValueError, "invalid draft"):
                token_usage.finish_capture("OBS001", self.sessions,
                                           run_file=Path(self.temp.name) / "invalid.json",
                                           usage_dir=usage_dir)
        self.assertFalse((usage_dir / "OBS001.usage.json").exists())
        token_usage.finish_capture("OBS001", self.sessions, usage_dir=usage_dir)
        self.assertTrue((usage_dir / "OBS001.usage.json").exists())

    def test_non_object_payload_and_info_do_not_leak_or_crash(self) -> None:
        root = make_session(self.sessions, ROOT_ID, value=3)
        append(root, {"type": "turn_context", "payload": [PRIVATE]})
        append(root, {"type": "event_msg", "payload": {"type": "token_count", "info": [PRIVATE]}})
        append(root, {"type": "event_msg", "payload": [PRIVATE]})
        append(self.sessions / f"{FOREIGN_ID}.jsonl",
               {"type": "session_meta", "payload": [PRIVATE]})
        usage_dir = Path(self.temp.name) / "usage"
        output, errors = io.StringIO(), io.StringIO()
        arguments = ["token_usage.py", "start", "OBS001", "--thread-id", ROOT_ID,
                     "--sessions-dir", str(self.sessions)]
        with patch.object(token_usage, "USAGE_DIR", usage_dir), patch.object(sys, "argv", arguments), \
             redirect_stdout(output), redirect_stderr(errors):
            self.assertEqual(token_usage.main(), 0)
        content = (usage_dir / "OBS001.start.json").read_text()
        self.assertIsNone(json.loads(content)["sessions"][ROOT_ID]["usage"]["input_tokens"])
        self.assertNotIn(PRIVATE, output.getvalue() + errors.getvalue() + content)


if __name__ == "__main__":
    unittest.main()
