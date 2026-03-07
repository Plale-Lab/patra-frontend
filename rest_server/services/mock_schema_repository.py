import json
from pathlib import Path
from typing import List, Optional

from rest_server.schemas.agent_schemas import CandidateSchema


DEFAULT_MOCK_SCHEMA_PATH = Path(__file__).resolve().parents[1] / "data" / "mock_dataset_schemas.json"


def load_mock_candidate_schemas(path: Optional[Path] = None) -> List[CandidateSchema]:
    source = path or DEFAULT_MOCK_SCHEMA_PATH
    payload = json.loads(source.read_text(encoding="utf-8"))
    return [CandidateSchema(**item) for item in payload]
