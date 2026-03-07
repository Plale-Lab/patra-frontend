# Schema Matching Agent for Patra

This branch implements a schema matching agent for the Patra system. Given a target dataset schema, the agent ranks historical schemas, returns the top candidates, and produces a structured trade-off report suitable for downstream services and UI rendering.

The current branch is designed for local development and evaluation against a mock schema corpus and an OpenAI-compatible local model endpoint such as LM Studio.

## What The Agent Does

The agent takes a target schema:

- `name`
- `format`
- `fields`
- optional `description`
- optional `version`

It then:

1. Scores all historical schemas with a lightweight pre-filter.
2. Runs exact and semantic field alignment on the selected candidates.
3. Applies environment-aware weighting.
4. Produces a structured `TradeoffReport` with ranked choices, field mappings, missing fields, and trade-off text.
5. Writes a full JSONL execution trace so the run is inspectable end to end.

## Matching Logic

The implementation follows a 4-stage hybrid pipeline.

### 1. Hard Pre-Filter

The agent computes a cheap preliminary score for every candidate using:

- exact field overlap
- format match
- simple domain hints
- a small environment bonus when a candidate matches the dominant format in the current corpus

This prevents the deeper alignment step from reasoning blindly over the full database.

### 2. Exact And Semantic Alignment

For each pre-filtered candidate:

- exact matches are found by normalized field-name intersection
- unmatched target fields are aligned semantically
- synonym memory is checked first
- if needed, embeddings or lexical similarity are used as fallback

The synonym memory supports mappings such as:

- `author -> creator`
- `w -> width`
- `h -> height`
- `day_counts -> days`

### 3. Environment-Aware Scoring

The agent infers coarse domain context from the candidate pool, for example:

- `cv`
- `timeseries`
- `nlp`
- `generic`

It also detects the most common historical format. These signals adjust the weights used in final ranking.

### 4. Structured Trade-Off Report

The top candidates are sent to the local LLM, which is asked to return JSON matching the `TradeoffReport` schema. If the model omits fields or returns incomplete JSON, the service enriches or falls back to deterministic output.

## Scoring Formula

The final score is:

```text
Score = (W_exact * S_exact) + (W_semantic * S_semantic) + (W_format * S_format)
```

Base weights:

- `W_exact = 0.50`
- `W_semantic = 0.40`
- `W_format = 0.10`

These are adjusted slightly by environment context and then normalized.

Component meanings:

- `S_exact`: fraction of target fields matched exactly by name
- `S_semantic`: semantic alignment score for only the unmatched target fields, normalized by total target field count
- `S_format`: `1.0` if target and candidate formats match, otherwise `0.0`

This normalization is intentional. Exact matches should remain stronger than synonym-only matches when two candidates are otherwise similar.

## Traceability

Every `match_schema(...)` call creates a trace file in JSONL format.

Trace events include:

- `match_started`
- `environment_profile`
- `preliminary_scores`
- `prefilter_results`
- `candidate_evaluated`
- `ranking_completed`
- `tradeoff_prompt_compiled`
- `llm_attempt_started`
- `llm_attempt_completed`
- `llm_attempt_failed`
- `tradeoff_report_validated`
- `tradeoff_report_fallback_used`
- `match_completed`

The final API/report payload includes:

- `trace_id`
- `trace_log_path`

This makes each run auditable without attaching a debugger.

## Key Files

- `rest_server/services/schema_agent_service.py`: matching pipeline, scoring, LLM integration, fallback behavior
- `rest_server/services/schema_agent_tracing.py`: JSONL trace writer
- `rest_server/routers/schema_agent.py`: FastAPI endpoints
- `rest_server/schemas/agent_schemas.py`: request and response models
- `rest_server/services/mock_schema_repository.py`: local mock schema loader
- `examples/schema_agent/eval_schema_agent.py`: offline evaluation runner
- `examples/schema_agent/run_lm_studio_schema_match.py`: single-run local smoke test

## Local Model Setup

This branch expects an OpenAI-compatible chat endpoint. The current tested setup is:

- base URL: `http://127.0.0.1:1234`
- model: `qwen/qwen3.5-9b`

Environment variables:

```powershell
$env:OPENAI_BASE_URL='http://127.0.0.1:1234'
$env:LLM_MODEL='qwen/qwen3.5-9b'
```

## Usage Commands

Run schema-agent unit tests:

```powershell
python -m pytest tests/test_schema_agent_service.py
```

Run a single local smoke test against LM Studio:

```powershell
$env:OPENAI_BASE_URL='http://127.0.0.1:1234'
$env:LLM_MODEL='qwen/qwen3.5-9b'
python examples/schema_agent/run_lm_studio_schema_match.py
```

Run the offline evaluation suite:

```powershell
$env:OPENAI_BASE_URL='http://127.0.0.1:1234'
$env:LLM_MODEL='qwen/qwen3.5-9b'
python examples/schema_agent/eval_schema_agent.py
```

If you want to serve the router through FastAPI:

```powershell
python -m uvicorn rest_server.fastapi_server:app --host 127.0.0.1 --port 8000
```

Then you can inspect mock candidates:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/agent/mock-candidates
```

And run a match request:

```powershell
Invoke-RestMethod -Uri http://127.0.0.1:8000/agent/match -Method Post -ContentType 'application/json' -Body '{
  "target_schema": {
    "name": "windowed_sensor_target",
    "format": "parquet",
    "fields": ["timestamp", "values", "anomaly_flag"]
  },
  "top_k": 3,
  "pre_filter_k": 30
}'
```

## How To Read `summary.json`

The evaluation script writes a summary file under `rest_server/logs/schema_agent_evals/<timestamp>/summary.json`.

Top-level fields:

- `evaluated_at_utc`: when the evaluation finished
- `candidate_count`: how many candidate schemas were available
- `benchmark_case_count`: how many benchmark cases were executed
- `top1_accuracy`: fraction of cases where the expected answer ranked first
- `top3_recall`: fraction of cases where the expected answer appeared in the top 3
- `mrr`: mean reciprocal rank, which rewards ranking the correct answer earlier
- `llm_base_url`: model server used for the run
- `llm_model`: model used for the run
- `case_results`: per-case details

Each item inside `case_results` contains:

- `case_id`: benchmark case name
- `expected_top1`: gold top result
- `expected_top3`: expected high-quality top-3 set
- `observed_top_ids`: actual top-3 returned by the agent
- `top1_hit`: whether the gold answer ranked first
- `top3_hit`: whether the gold answer appeared in the top 3
- `reciprocal_rank`: `1.0` for rank 1, `0.5` for rank 2, `0.333...` for rank 3
- `trace_id`: unique run id for this case
- `trace_log_path`: path to the full execution trace
- `report`: the final structured output returned by the agent

Inside `report.top_choices`, each candidate shows:

- `schema_id`
- `name`
- `format`
- `score`
- `alignment_map`
- `missing_fields`
- `trade_off_analysis`

When you need to debug a ranking decision, start from `trace_log_path`, not just the summary.

## Current Scope

This branch currently uses:

- local mock candidate schemas
- file-backed synonym memory
- offline benchmark cases
- LM Studio for local structured generation

It does not yet include:

- a production database-backed `dataset_schemas` source
- a persistent synonym table in SQL
- user feedback ingestion for online learning
- a dedicated vector retrieval service
