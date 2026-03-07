import json
import os

from rest_server.schemas.agent_schemas import TargetSchema
from rest_server.services.mock_schema_repository import load_mock_candidate_schemas
from rest_server.services.schema_agent_service import SchemaAgentService


def main():
    os.environ.setdefault("OPENAI_BASE_URL", "http://127.0.0.1:1234")
    os.environ.setdefault("LLM_MODEL", "qwen/qwen3.5-9b")

    service = SchemaAgentService()
    target = TargetSchema(
        name="sensor_window_target",
        format="parquet",
        fields=["timestamp", "values", "anomaly_flag"],
    )
    report = service.match_schema(
        target,
        load_mock_candidate_schemas(),
        top_k=3,
        pre_filter_k=30,
    )
    print(json.dumps(report.model_dump(), indent=2))


if __name__ == "__main__":
    main()
