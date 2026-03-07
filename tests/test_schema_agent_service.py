from fastapi import FastAPI
from fastapi.testclient import TestClient
from pathlib import Path

from rest_server.routers.schema_agent import build_schema_agent_router
from rest_server.schemas.agent_schemas import CandidateSchema, TargetSchema
from rest_server.services.mock_schema_repository import load_mock_candidate_schemas
from rest_server.services.schema_agent_service import SchemaAgentService


class FailingCompletions:
    def create(self, *args, **kwargs):
        raise RuntimeError("LLM unavailable during test")


class FailingChat:
    def __init__(self):
        self.completions = FailingCompletions()


class FailingClient:
    def __init__(self):
        self.chat = FailingChat()


def build_service() -> SchemaAgentService:
    return SchemaAgentService(client=FailingClient(), encoder=None)


def test_evaluate_candidates_ranks_timeseries_schema_first():
    service = build_service()
    candidates = load_mock_candidate_schemas()
    assert len(candidates) == 30
    target = TargetSchema(
        name="incoming_timeseries",
        format="parquet",
        fields=["timestamp", "values", "anomaly_flag"],
    )

    ranked, environment = service.evaluate_candidates(target, candidates, pre_filter_k=3)

    assert environment["dominant_domain"] == "cv"
    assert ranked[0].schema_id == "5"
    assert ranked[0].alignment_map == {
        "timestamp": "timestamp",
        "values": "values",
        "anomaly_flag": "anomaly_flag",
    }


def test_memory_mapping_promotes_author_creator_alignment():
    service = build_service()
    target = TargetSchema(
        name="article_schema",
        format="parquet",
        fields=["author", "label"],
    )
    candidates = load_mock_candidate_schemas() + [
        CandidateSchema(
            schema_id="6",
            name="article_archive_schema",
            version=1,
            format="parquet",
            fields=["creator", "label"],
        )
    ]

    ranked, _ = service.evaluate_candidates(target, candidates, pre_filter_k=6)

    assert ranked[0].schema_id == "6"
    assert ranked[0].alignment_map["author"] == "creator"
    assert ranked[0].semantic_hits == 1


def test_match_endpoint_uses_mock_candidates_and_fallback_report():
    app = FastAPI()
    app.include_router(build_schema_agent_router(build_service()))
    client = TestClient(app)

    response = client.post(
        "/agent/match",
        json={
            "target_schema": {
                "name": "windowed_sensor_target",
                "format": "parquet",
                "fields": ["timestamp", "values", "anomaly_flag"],
            },
            "top_k": 2,
            "pre_filter_k": 4,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["target_schema_name"] == "windowed_sensor_target"
    assert payload["top_choices"][0]["schema_id"] == "5"
    assert "common format is" in payload["environment_summary"]
    assert payload["trace_id"]
    assert Path(payload["trace_log_path"]).exists()
