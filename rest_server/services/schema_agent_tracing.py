import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional
from uuid import uuid4


DEFAULT_TRACE_DIR = Path(__file__).resolve().parents[1] / "logs" / "schema_agent_runs"


def _utc_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


class SchemaAgentTrace:
    def __init__(self, trace_id: Optional[str] = None, trace_dir: Optional[Path] = None):
        self.trace_id = trace_id or uuid4().hex
        self.trace_dir = trace_dir or DEFAULT_TRACE_DIR
        self.trace_dir.mkdir(parents=True, exist_ok=True)
        self.log_path = self.trace_dir / f"{self.trace_id}.jsonl"

    def log(self, event_type: str, **payload: Dict[str, Any]) -> None:
        entry = {
            "trace_id": self.trace_id,
            "timestamp": _utc_timestamp(),
            "event_type": event_type,
            **payload,
        }
        with self.log_path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(entry, ensure_ascii=True) + "\n")
