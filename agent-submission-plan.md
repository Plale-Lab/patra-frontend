# Agent Submission Plan

## Version

`0.3.0`

## Problem Statement

Patra should support a high-automation submission path where users only provide an existing asset link and the platform generates a draft ICICLE model card or datasheet for reviewer completion. This mode targets lower submitter effort, faster queue intake, and better reviewer context than the pure link-only workflow.

## Goals

- Accept a single model or dataset URL and generate a structured draft.
- Accept bulk URL submissions and process them as an asynchronous batch job.
- Preserve provenance, missing fields, and confidence so reviewers can validate generated content efficiently.
- Prioritize Hugging Face sources first, then fall back to generic extraction.

## Non-Goals

- Browser-side scraping or browser-side LLM execution
- Silent overwriting of reviewer edits
- Replacing reviewer approval and editorial control

## User Experience

The frontend keeps the same three submission entry modes introduced in `0.3.0`:

- `Manual Entry`
- `From Asset Link`
- `Bulk Asset Links`

Agent mode changes the post-submit behavior:

- single-link submissions enter an asynchronous `Processing` state
- bulk submissions create a tracked ingestion job instead of firing N direct queue writes
- reviewers receive draft content rather than a link-only payload

Shared product copy:

> Create ICICLE model card or datasheet for the existing model or dataset you want to include in the ICICLE ecosystem.

## Target Architecture

### 1. Frontend App

Responsibilities:

- collect asset links
- create ingestion jobs
- poll job status
- render per-item progress
- open generated drafts in the review queue

### 2. Submission Ingestion API

Responsibilities:

- validate inbound request shape
- detect submission type (`model_card` or `datasheet`)
- create one job for bulk ingestion
- persist job and item status
- enqueue work for background processing

Recommended endpoints:

- `POST /submission-jobs`
- `GET /submission-jobs/:id`
- `GET /submission-jobs/:id/items`

### 3. Asset Adapters

Provider adapters should normalize source-specific metadata into a common extraction contract.

Priority adapters:

- Hugging Face model adapter
- Hugging Face dataset adapter
- Generic HTML adapter

Optional later adapters:

- GitHub
- Kaggle
- DOI landing pages

### 4. Agent Orchestrator

Responsibilities:

- fetch adapter output
- assemble grounded prompt context
- map source data into Patra submission schema
- produce structured draft output
- return field-level provenance and confidence

### 5. Draft Persistence Layer

Responsibilities:

- store generated draft data
- store source evidence
- store missing fields
- store confidence annotations
- keep reviewer edits separate from regenerated output

### 6. Review UI

Responsibilities:

- show source URL and generated draft side by side
- expose missing fields and low-confidence warnings
- allow edit, approve, reject, or rerun
- require explicit confirmation before overwriting reviewer changes

## Data Contracts

### Submission Job Request

```json
{
  "type": "datasheet",
  "submitted_by": "Alice",
  "links": [
    "https://huggingface.co/datasets/stanfordnlp/imdb"
  ]
}
```

### Job Status Model

```json
{
  "job_id": "job_123",
  "status": "processing",
  "total_items": 4,
  "completed_items": 2,
  "failed_items": 1
}
```

### Job Item Status

Allowed item states:

- `queued`
- `fetching`
- `drafting`
- `needs_review`
- `failed`

### Draft Output Contract

```json
{
  "type": "model_card",
  "status": "draft_generated",
  "submitted_by": "Alice",
  "asset": {
    "url": "https://huggingface.co/...",
    "provider": "huggingface",
    "host": "huggingface.co"
  },
  "draft_data": {
    "...schema fields...": "..."
  },
  "missing_fields": ["license", "bias_analysis"],
  "provenance": [
    {
      "field": "name",
      "source": "hf_api",
      "evidence": "..."
    }
  ],
  "confidence": {
    "name": 0.98,
    "license": 0.42
  }
}
```

## Automation Policy

- If the URL is a Hugging Face model page, prefer Hugging Face APIs and the model card README.
- If the URL is a Hugging Face dataset page, prefer Hugging Face APIs and the dataset card README.
- If a provider adapter fails or is unavailable, fall back to generic HTML extraction.
- The agent must return:
  - schema-compliant draft data
  - missing field list
  - provenance for extracted fields
  - field-level confidence scores

## Review Workflow

1. User submits one or more asset links.
2. Frontend creates an ingestion job.
3. Worker fetches source metadata through provider adapters.
4. Agent generates a draft model card or datasheet.
5. Draft is stored with provenance and confidence.
6. Reviewer opens the item in the review queue.
7. Reviewer edits, approves, rejects, or reruns generation.

## Failure Handling

- Invalid URLs should be rejected before job creation.
- Adapter failures should mark the item as `failed` with a retryable error message.
- Low-confidence fields should not be auto-approved; they should be surfaced in `missing_fields`.
- Agent reruns must not overwrite reviewer-edited fields unless the reviewer confirms replacement.
- Mixed-result bulk jobs should preserve successful items and report failures per URL.

## External Dependencies

- background job runner or queue worker
- provider-specific fetch clients
- external LLM or agent service
- persistent store for jobs, items, drafts, provenance, and reviewer edits

## Rollout Stages

### Stage 1

- implement ingestion job API
- support Hugging Face model and dataset adapters
- add reviewer visibility for provenance and confidence

### Stage 2

- add bulk progress UI
- add generic HTML fallback adapter
- add item-level rerun controls

### Stage 3

- add GitHub and Kaggle adapters
- add reviewer compare view improvements
- add confidence-based reviewer prioritization

## Acceptance Criteria

- A single Hugging Face model URL generates a draft model card.
- A single Hugging Face dataset URL generates a draft datasheet.
- Mixed bulk jobs support item-level success and failure.
- Adapter failure falls back to generic extraction when possible.
- Low-confidence fields are surfaced through `missing_fields`.
- Reviewers can see provenance and confidence in the review UI.
- Agent rerun does not overwrite reviewer changes without explicit confirmation.
