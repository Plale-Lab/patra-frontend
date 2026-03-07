import json
import os
import shutil
from datetime import datetime, timezone
from pathlib import Path

from rest_server.schemas.agent_schemas import TargetSchema
from rest_server.services.mock_schema_repository import load_mock_candidate_schemas
from rest_server.services.schema_agent_service import SchemaAgentService


ROOT = Path(__file__).resolve().parent
BENCHMARK_PATH = ROOT / "benchmark_cases.json"
EVAL_ROOT = ROOT.parents[1] / "rest_server" / "logs" / "schema_agent_evals"


def utc_slug() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def reciprocal_rank(expected_id: str, observed_ids: list[str]) -> float:
    for index, schema_id in enumerate(observed_ids, start=1):
        if schema_id == expected_id:
            return 1.0 / index
    return 0.0


def main():
    os.environ.setdefault("OPENAI_BASE_URL", "http://127.0.0.1:1234")
    os.environ.setdefault("LLM_MODEL", "qwen/qwen3.5-9b")

    candidates = load_mock_candidate_schemas()
    benchmark_cases = json.loads(BENCHMARK_PATH.read_text(encoding="utf-8"))
    eval_dir = EVAL_ROOT / utc_slug()
    eval_dir.mkdir(parents=True, exist_ok=True)

    service = SchemaAgentService()
    case_results = []

    for case in benchmark_cases:
        target = TargetSchema(**case["target_schema"])
        report = service.match_schema(
            target,
            candidates,
            top_k=3,
            pre_filter_k=len(candidates),
        )
        observed_ids = [choice.schema_id for choice in report.top_choices]
        result = {
            "case_id": case["case_id"],
            "expected_top1": case["expected_top1"],
            "expected_top3": case["expected_top3"],
            "observed_top_ids": observed_ids,
            "top1_hit": observed_ids[:1] == [case["expected_top1"]],
            "top3_hit": case["expected_top1"] in observed_ids[:3],
            "reciprocal_rank": reciprocal_rank(case["expected_top1"], observed_ids),
            "trace_id": report.trace_id,
            "trace_log_path": report.trace_log_path,
            "report": report.model_dump(),
        }
        case_results.append(result)

        if report.trace_log_path:
            src = Path(report.trace_log_path)
            if src.exists():
                shutil.copy2(src, eval_dir / f"{case['case_id']}_{src.name}")

    top1_accuracy = sum(item["top1_hit"] for item in case_results) / len(case_results)
    top3_recall = sum(item["top3_hit"] for item in case_results) / len(case_results)
    mrr = sum(item["reciprocal_rank"] for item in case_results) / len(case_results)

    summary = {
        "evaluated_at_utc": datetime.now(timezone.utc).isoformat(),
        "candidate_count": len(candidates),
        "benchmark_case_count": len(case_results),
        "top1_accuracy": top1_accuracy,
        "top3_recall": top3_recall,
        "mrr": mrr,
        "llm_base_url": os.environ.get("OPENAI_BASE_URL"),
        "llm_model": os.environ.get("LLM_MODEL"),
        "case_results": case_results,
    }

    (eval_dir / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    with (eval_dir / "results.jsonl").open("w", encoding="utf-8") as handle:
        for item in case_results:
            handle.write(json.dumps(item, ensure_ascii=True) + "\n")

    print(json.dumps(summary, indent=2))
    print(f"Evaluation artifacts saved to: {eval_dir}")


if __name__ == "__main__":
    main()
