import json
import os
from collections import Counter
from difflib import SequenceMatcher
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from openai import OpenAI
from pydantic import ValidationError

from rest_server.schemas.agent_schemas import (
    AlignmentResult,
    CandidateSchema,
    SynonymRecord,
    TargetSchema,
    TradeoffReport,
    TradeoffReportChoice,
)
from rest_server.services.schema_agent_tracing import SchemaAgentTrace

try:
    from sentence_transformers import SentenceTransformer, util
except Exception:  # pragma: no cover - dependency issues are handled at runtime
    SentenceTransformer = None
    util = None


BASE_WEIGHTS = {"exact": 0.5, "semantic": 0.4, "format": 0.1}
DEFAULT_MEMORY_PATH = Path(__file__).resolve().parents[1] / "data" / "semantic_synonym_memory.json"
DOMAIN_HINTS = {
    "cv": {
        "bbox",
        "x",
        "y",
        "width",
        "height",
        "mask",
        "area",
        "image",
        "image_path",
        "label",
        "confidence",
        "jpeg",
        "png",
    },
    "timeseries": {
        "timestamp",
        "time",
        "window_start",
        "window_end",
        "values",
        "sensor_id",
        "anomaly_flag",
        "features",
    },
    "nlp": {"text", "tokens", "prompt", "completion", "author", "creator"},
}


def _normalize_field_name(name: str) -> str:
    return name.strip().lower()


def _normalize_base_url(url: str) -> str:
    cleaned = url.rstrip("/")
    return cleaned if cleaned.endswith("/v1") else f"{cleaned}/v1"


class SynonymMemory:
    """File-backed synonym memory used before semantic matching."""

    def __init__(self, memory_path: Optional[Path] = None):
        self.memory_path = memory_path or DEFAULT_MEMORY_PATH
        self.records: List[SynonymRecord] = self._load_records()
        self.memory: Dict[str, Dict[str, float]] = {}
        for record in self.records:
            self.add_synonym(record.field_A, record.field_B, record.confidence, persist=False)

    def _load_records(self) -> List[SynonymRecord]:
        if not self.memory_path.exists():
            return []
        data = json.loads(self.memory_path.read_text(encoding="utf-8"))
        return [SynonymRecord(**item) for item in data]

    def get_synonym_score(self, field_a: str, field_b: str) -> float:
        a, b = _normalize_field_name(field_a), _normalize_field_name(field_b)
        if a in self.memory and b in self.memory[a]:
            return self.memory[a][b]
        if b in self.memory and a in self.memory[b]:
            return self.memory[b][a]
        return 0.0

    def add_synonym(
        self,
        field_a: str,
        field_b: str,
        confidence: float = 1.0,
        user_confirmed_flag: bool = False,
        persist: bool = True,
    ) -> None:
        a, b = _normalize_field_name(field_a), _normalize_field_name(field_b)
        self.memory.setdefault(a, {})[b] = confidence
        if persist:
            record = SynonymRecord(
                field_A=a,
                field_B=b,
                confidence=confidence,
                user_confirmed_flag=user_confirmed_flag,
            )
            self.records.append(record)
            self.memory_path.write_text(
                json.dumps([item.model_dump() for item in self.records], indent=2),
                encoding="utf-8",
            )


class SchemaAgentService:
    def __init__(
        self,
        encoder=None,
        client: Optional[OpenAI] = None,
        llm_model: Optional[str] = None,
        synonym_memory: Optional[SynonymMemory] = None,
        semantic_threshold: float = 0.6,
    ):
        self.encoder = encoder
        self._encoder_load_failed = False
        self.semantic_threshold = semantic_threshold
        self.memory = synonym_memory or SynonymMemory()
        self.client = client or OpenAI(
            api_key=os.getenv("OPENAI_API_KEY", "lm-studio"),
            base_url=_normalize_base_url(os.getenv("OPENAI_BASE_URL", "http://127.0.0.1:1234")),
        )
        self.llm_model = llm_model or os.getenv("LLM_MODEL", "qwen/qwen3.5-9b")
        self._embedding_cache: Dict[str, object] = {}

    def _ensure_encoder(self):
        if self.encoder is not None:
            return self.encoder
        if self._encoder_load_failed or SentenceTransformer is None:
            return None
        try:
            self.encoder = SentenceTransformer("all-MiniLM-L6-v2")
        except Exception:
            self._encoder_load_failed = True
            self.encoder = None
        return self.encoder

    def _encode_text(self, text: str):
        normalized = _normalize_field_name(text)
        if normalized in self._embedding_cache:
            return self._embedding_cache[normalized]
        encoder = self._ensure_encoder()
        if encoder is None:
            return None
        embedding = encoder.encode(normalized, convert_to_tensor=True)
        self._embedding_cache[normalized] = embedding
        return embedding

    def _infer_domain(self, fields: List[str], schema_format: Optional[str]) -> str:
        tokens = {_normalize_field_name(field) for field in fields}
        if schema_format:
            tokens.add(_normalize_field_name(schema_format))
        domain_scores = {
            domain: len(tokens.intersection(hints))
            for domain, hints in DOMAIN_HINTS.items()
        }
        best_domain, best_score = max(domain_scores.items(), key=lambda item: item[1])
        return best_domain if best_score > 0 else "generic"

    def _build_environment_profile(self, candidates: List[CandidateSchema]) -> Dict[str, str]:
        if not candidates:
            return {"dominant_domain": "generic", "common_format": "unknown"}
        domains = [
            self._infer_domain(candidate.fields, candidate.format)
            for candidate in candidates
        ]
        formats = [
            _normalize_field_name(candidate.format)
            for candidate in candidates
            if candidate.format
        ]
        return {
            "dominant_domain": Counter(domains).most_common(1)[0][0],
            "common_format": Counter(formats).most_common(1)[0][0] if formats else "unknown",
        }

    def _resolve_weights(self, target: TargetSchema, environment: Dict[str, str]) -> Dict[str, float]:
        weights = BASE_WEIGHTS.copy()
        target_domain = self._infer_domain(target.fields, target.format)
        if target_domain == environment.get("dominant_domain") and target_domain != "generic":
            weights["semantic"] += 0.05
            weights["exact"] -= 0.05
        if target.format and _normalize_field_name(target.format) == environment.get("common_format"):
            weights["format"] += 0.05
            weights["exact"] -= 0.05
        total = sum(weights.values())
        return {key: value / total for key, value in weights.items()}

    def _calculate_exact_match(
        self,
        target_fields: List[str],
        candidate_fields: List[str],
    ) -> Tuple[float, Dict[str, str], List[str]]:
        target_lookup = {_normalize_field_name(field): field for field in target_fields}
        candidate_lookup = {_normalize_field_name(field): field for field in candidate_fields}
        if not target_lookup:
            return 0.0, {}, []

        exact_keys = sorted(set(target_lookup).intersection(candidate_lookup))
        alignment_map = {target_lookup[key]: candidate_lookup[key] for key in exact_keys}
        unmatched_targets = [target_lookup[key] for key in target_lookup if key not in exact_keys]
        score = len(exact_keys) / len(target_lookup)
        return score, alignment_map, unmatched_targets

    def _lexical_similarity(self, left: str, right: str) -> float:
        left_norm = _normalize_field_name(left)
        right_norm = _normalize_field_name(right)
        sequence_score = SequenceMatcher(None, left_norm, right_norm).ratio()
        left_tokens = set(left_norm.replace("-", "_").split("_"))
        right_tokens = set(right_norm.replace("-", "_").split("_"))
        token_score = (
            len(left_tokens.intersection(right_tokens)) / len(left_tokens.union(right_tokens))
            if left_tokens and right_tokens
            else 0.0
        )
        return max(sequence_score, token_score)

    def _semantic_similarity(self, left: str, right: str) -> float:
        memory_score = self.memory.get_synonym_score(left, right)
        if memory_score > 0:
            return memory_score

        left_embedding = self._encode_text(left)
        right_embedding = self._encode_text(right)
        if left_embedding is not None and right_embedding is not None and util is not None:
            return float(util.cos_sim(left_embedding, right_embedding).item())
        return self._lexical_similarity(left, right)

    def _calculate_semantic_match(
        self,
        unmatched_targets: List[str],
        candidate_fields: List[str],
        target_field_count: int,
        reserved_candidate_fields: Optional[List[str]] = None,
    ) -> Tuple[float, Dict[str, str]]:
        if not unmatched_targets or not candidate_fields:
            return 0.0, {}

        reserved = {
            _normalize_field_name(field)
            for field in (reserved_candidate_fields or [])
        }
        candidate_lookup = {_normalize_field_name(field): field for field in candidate_fields}
        available_candidates = [key for key in candidate_lookup if key not in reserved]

        alignment_map: Dict[str, str] = {}
        total_score = 0.0
        used_candidates = set()

        for target_field in unmatched_targets:
            best_candidate = None
            best_score = 0.0
            for candidate_key in available_candidates:
                if candidate_key in used_candidates:
                    continue
                score = self._semantic_similarity(target_field, candidate_lookup[candidate_key])
                if score > best_score:
                    best_score = score
                    best_candidate = candidate_key
            if best_candidate and best_score >= self.semantic_threshold:
                used_candidates.add(best_candidate)
                alignment_map[target_field] = candidate_lookup[best_candidate]
                total_score += best_score

        average_score = total_score / max(target_field_count, 1)
        return average_score, alignment_map

    def _preliminary_candidate_score(
        self,
        target: TargetSchema,
        candidate: CandidateSchema,
        environment: Dict[str, str],
    ) -> float:
        exact_score, _, _ = self._calculate_exact_match(target.fields, candidate.fields)
        format_score = (
            1.0
            if target.format
            and candidate.format
            and _normalize_field_name(target.format) == _normalize_field_name(candidate.format)
            else 0.0
        )
        target_domain = self._infer_domain(target.fields, target.format)
        candidate_domain = self._infer_domain(candidate.fields, candidate.format)
        domain_score = 1.0 if target_domain == candidate_domain else 0.0
        environment_bonus = (
            0.05
            if candidate.format
            and _normalize_field_name(candidate.format) == environment.get("common_format")
            else 0.0
        )
        return (0.65 * exact_score) + (0.2 * format_score) + (0.1 * domain_score) + environment_bonus

    def _pre_filter_candidates(
        self,
        target: TargetSchema,
        candidates: List[CandidateSchema],
        pre_filter_k: int,
        environment: Dict[str, str],
    ) -> List[Tuple[CandidateSchema, float]]:
        scored = [
            (candidate, self._preliminary_candidate_score(target, candidate, environment))
            for candidate in candidates
        ]
        scored.sort(key=lambda item: item[1], reverse=True)
        return scored[: max(pre_filter_k, 1)]

    def evaluate_candidates(
        self,
        target: TargetSchema,
        candidates: List[CandidateSchema],
        pre_filter_k: int = 10,
        trace: Optional[SchemaAgentTrace] = None,
    ) -> Tuple[List[AlignmentResult], Dict[str, str]]:
        """Runs the hybrid pipeline and returns ranked candidates plus environment data."""
        environment = self._build_environment_profile(candidates)
        weights = self._resolve_weights(target, environment)
        all_preliminary_scores = [
            {
                "schema_id": candidate.schema_id,
                "name": candidate.name,
                "format": candidate.format,
                "preliminary_score": self._preliminary_candidate_score(target, candidate, environment),
            }
            for candidate in candidates
        ]
        all_preliminary_scores.sort(key=lambda item: item["preliminary_score"], reverse=True)
        prefiltered_candidates = self._pre_filter_candidates(target, candidates, pre_filter_k, environment)
        if trace:
            trace.log(
                "environment_profile",
                environment=environment,
                weights=weights,
                candidate_count=len(candidates),
                pre_filter_k=pre_filter_k,
            )
            trace.log(
                "preliminary_scores",
                target_schema=target.model_dump(),
                candidates=all_preliminary_scores,
            )
            trace.log(
                "prefilter_results",
                selected_candidates=[
                    {
                        "schema_id": candidate.schema_id,
                        "name": candidate.name,
                        "format": candidate.format,
                        "preliminary_score": preliminary_score,
                    }
                    for candidate, preliminary_score in prefiltered_candidates
                ],
            )

        results: List[AlignmentResult] = []
        for candidate, preliminary_score in prefiltered_candidates:
            exact_score, exact_alignment, unmatched_targets = self._calculate_exact_match(target.fields, candidate.fields)
            semantic_score, semantic_alignment = self._calculate_semantic_match(
                unmatched_targets,
                candidate.fields,
                target_field_count=len(target.fields),
                reserved_candidate_fields=list(exact_alignment.values()),
            )
            format_score = (
                1.0
                if target.format
                and candidate.format
                and _normalize_field_name(target.format) == _normalize_field_name(candidate.format)
                else 0.0
            )
            final_score = (
                (weights["exact"] * exact_score)
                + (weights["semantic"] * semantic_score)
                + (weights["format"] * format_score)
            )
            alignment_map = {}
            alignment_map.update(exact_alignment)
            alignment_map.update(semantic_alignment)
            missing_fields = [field for field in target.fields if field not in alignment_map]

            results.append(
                AlignmentResult(
                    schema_id=candidate.schema_id,
                    candidate_name=candidate.name,
                    exact_match_score=exact_score,
                    semantic_match_score=semantic_score,
                    format_match_score=format_score,
                    final_score=final_score,
                    preliminary_score=preliminary_score,
                    semantic_hits=len(semantic_alignment),
                    alignment_map=alignment_map,
                    missing_fields=missing_fields,
                )
            )
            if trace:
                trace.log(
                    "candidate_evaluated",
                    schema_id=candidate.schema_id,
                    candidate_name=candidate.name,
                    candidate_format=candidate.format,
                    preliminary_score=preliminary_score,
                    exact_match_score=exact_score,
                    exact_alignment=exact_alignment,
                    unmatched_targets=unmatched_targets,
                    semantic_match_score=semantic_score,
                    semantic_alignment=semantic_alignment,
                    format_match_score=format_score,
                    final_score=final_score,
                    missing_fields=missing_fields,
                )

        results.sort(key=lambda item: item.final_score, reverse=True)
        if trace:
            trace.log(
                "ranking_completed",
                ranked_results=[item.model_dump() for item in results],
            )
        return results, environment

    def _build_environment_summary(self, target: TargetSchema, environment: Dict[str, str]) -> str:
        target_domain = self._infer_domain(target.fields, target.format)
        return (
            f"Dominant historical domain is {environment['dominant_domain']}, "
            f"common format is {environment['common_format']}, "
            f"target domain is {target_domain}."
        )

    def _fallback_report(
        self,
        target: TargetSchema,
        top_results: List[AlignmentResult],
        all_candidates: List[CandidateSchema],
        environment_summary: str,
        trace: Optional[SchemaAgentTrace] = None,
    ) -> TradeoffReport:
        candidates_by_id = {candidate.schema_id: candidate for candidate in all_candidates}
        choices: List[TradeoffReportChoice] = []

        for result in top_results:
            candidate = candidates_by_id[result.schema_id]
            format_delta = (
                "same format"
                if target.format and candidate.format and _normalize_field_name(target.format) == _normalize_field_name(candidate.format)
                else f"format shifts to {candidate.format or 'unknown'}"
            )
            alias_pairs = [
                f"{source}->{target_field}"
                for source, target_field in result.alignment_map.items()
                if _normalize_field_name(source) != _normalize_field_name(target_field)
            ]
            alias_text = f"Semantic aliases: {', '.join(alias_pairs)}." if alias_pairs else "No semantic remapping required."
            missing_text = (
                f"Missing target fields: {', '.join(result.missing_fields)}."
                if result.missing_fields
                else "Covers all target fields."
            )
            choices.append(
                TradeoffReportChoice(
                    schema_id=result.schema_id,
                    name=candidate.name,
                    format=candidate.format,
                    score=result.final_score,
                    alignment_map=result.alignment_map,
                    missing_fields=result.missing_fields,
                    trade_off_analysis=f"{missing_text} {format_delta}. {alias_text}",
                )
            )

        return TradeoffReport(
            target_schema_name=target.name,
            environment_summary=environment_summary,
            trace_id=trace.trace_id if trace else None,
            trace_log_path=str(trace.log_path) if trace else None,
            top_choices=choices,
        )

    def _enrich_report(
        self,
        report: TradeoffReport,
        top_results: List[AlignmentResult],
        all_candidates: List[CandidateSchema],
        trace: Optional[SchemaAgentTrace] = None,
    ) -> TradeoffReport:
        candidates_by_id = {candidate.schema_id: candidate for candidate in all_candidates}
        results_by_id = {result.schema_id: result for result in top_results}
        seen = set()

        for choice in report.top_choices:
            seen.add(choice.schema_id)
            candidate = candidates_by_id.get(choice.schema_id)
            result = results_by_id.get(choice.schema_id)
            if candidate is not None:
                choice.name = choice.name or candidate.name
                choice.format = choice.format or candidate.format
            if result is not None:
                if not choice.missing_fields:
                    choice.missing_fields = result.missing_fields
                if not choice.alignment_map:
                    choice.alignment_map = result.alignment_map

        for result in top_results:
            if result.schema_id in seen:
                continue
            candidate = candidates_by_id[result.schema_id]
            report.top_choices.append(
                TradeoffReportChoice(
                    schema_id=result.schema_id,
                    name=candidate.name,
                    format=candidate.format,
                    score=result.final_score,
                    alignment_map=result.alignment_map,
                    missing_fields=result.missing_fields,
                    trade_off_analysis=(
                        f"Recovered deterministic analysis for schema {result.schema_id} because "
                        "the model omitted it from the structured response."
                    ),
                )
            )
        report.trace_id = trace.trace_id if trace else report.trace_id
        report.trace_log_path = str(trace.log_path) if trace else report.trace_log_path
        return report

    def _try_generate_structured_report(
        self,
        prompt_data: Dict[str, object],
        trace: Optional[SchemaAgentTrace] = None,
    ) -> Optional[Dict[str, object]]:
        schema = TradeoffReport.model_json_schema()
        attempts = [
            {
                "response_format": {
                    "type": "json_schema",
                    "json_schema": {
                        "name": "tradeoff_report",
                        "schema": schema,
                    },
                }
            },
            {"response_format": {"type": "text"}},
            {},
        ]
        system_message = (
            "You are a schema matching analyst. Return valid JSON only. "
            "The response must satisfy the provided TradeoffReport schema exactly."
        )
        for index, attempt in enumerate(attempts, start=1):
            try:
                if trace:
                    trace.log(
                        "llm_attempt_started",
                        attempt_index=index,
                        llm_model=self.llm_model,
                        request_kwargs=attempt,
                        prompt_data=prompt_data,
                    )
                response = self.client.chat.completions.create(
                    model=self.llm_model,
                    messages=[
                        {"role": "system", "content": system_message},
                        {"role": "user", "content": json.dumps(prompt_data, ensure_ascii=True, indent=2)},
                    ],
                    temperature=0.1,
                    **attempt,
                )
                message = response.choices[0].message
                content = message.content or getattr(message, "reasoning_content", None)
                if trace:
                    trace.log(
                        "llm_attempt_completed",
                        attempt_index=index,
                        raw_response=response.model_dump() if hasattr(response, "model_dump") else str(response),
                        extracted_content=content,
                    )
                if not content:
                    continue
                return json.loads(content)
            except Exception as exc:
                if trace:
                    trace.log(
                        "llm_attempt_failed",
                        attempt_index=index,
                        error_type=type(exc).__name__,
                        error_message=str(exc),
                    )
                continue
        return None

    def generate_tradeoff_report(
        self,
        target: TargetSchema,
        top_results: List[AlignmentResult],
        all_candidates: List[CandidateSchema],
        environment: Dict[str, str],
        trace: Optional[SchemaAgentTrace] = None,
    ) -> TradeoffReport:
        """Use the local LLM with schema-guided output, then validate via Pydantic."""
        environment_summary = self._build_environment_summary(target, environment)
        candidates_by_id = {candidate.schema_id: candidate for candidate in all_candidates}
        prompt_data = {
            "target_schema_name": target.name,
            "environment_summary": environment_summary,
            "target": target.model_dump(),
            "top_choices": [],
        }
        for result in top_results:
            candidate = candidates_by_id[result.schema_id]
            prompt_data["top_choices"].append(
                {
                    "schema_id": candidate.schema_id,
                    "name": candidate.name,
                    "format": candidate.format,
                    "score": result.final_score,
                    "alignment_map": result.alignment_map,
                    "missing_fields": result.missing_fields,
                    "exact_match_score": result.exact_match_score,
                    "semantic_match_score": result.semantic_match_score,
                    "format_match_score": result.format_match_score,
                    "preliminary_score": result.preliminary_score,
                }
            )

        if trace:
            trace.log(
                "tradeoff_prompt_compiled",
                environment_summary=environment_summary,
                top_result_ids=[result.schema_id for result in top_results],
                prompt_data=prompt_data,
            )
        data = self._try_generate_structured_report(prompt_data, trace=trace)
        if data is not None:
            data.setdefault("target_schema_name", target.name)
            data.setdefault("environment_summary", environment_summary)
            try:
                report = TradeoffReport.model_validate(data)
                report = self._enrich_report(report, top_results, all_candidates, trace=trace)
                if trace:
                    trace.log(
                        "tradeoff_report_validated",
                        report=report.model_dump(),
                    )
                return report
            except ValidationError:
                if trace:
                    trace.log(
                        "tradeoff_report_validation_failed",
                        raw_data=data,
                    )
                pass
        report = self._fallback_report(
            target,
            top_results,
            all_candidates,
            environment_summary,
            trace=trace,
        )
        if trace:
            trace.log(
                "tradeoff_report_fallback_used",
                report=report.model_dump(),
            )
        return report

    def match_schema(
        self,
        target: TargetSchema,
        candidates: List[CandidateSchema],
        top_k: int = 3,
        pre_filter_k: int = 10,
    ) -> TradeoffReport:
        trace = SchemaAgentTrace()
        trace.log(
            "match_started",
            target_schema=target.model_dump(),
            candidate_count=len(candidates),
            top_k=top_k,
            pre_filter_k=pre_filter_k,
            llm_model=self.llm_model,
        )
        ranked_results, environment = self.evaluate_candidates(
            target,
            candidates,
            pre_filter_k=pre_filter_k,
            trace=trace,
        )
        top_results = ranked_results[: max(top_k, 1)]
        trace.log(
            "top_k_selected",
            top_results=[item.model_dump() for item in top_results],
        )
        report = self.generate_tradeoff_report(
            target,
            top_results,
            candidates,
            environment,
            trace=trace,
        )
        trace.log(
            "match_completed",
            report=report.model_dump(),
        )
        return report
