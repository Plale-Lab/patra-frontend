
## 📄 PRD: Schema Matching Agent for the Patra System

### 1. Core Objective

Build an intelligent Agent based on Qwen3.5 9B that, given a target `dataset_schema`, can accurately match, evaluate, and retrieve the Top-3 most similar historical schemas from the database, while providing users with structured variance analysis and trade-off recommendations.

### 2. Core Capabilities

* **Harnessing Generation (Constrained Generation):** Completely abandon reliance on pure Markdown templates. The Agent's core reasoning and comparison results must be forced into strongly-typed JSON data structures via underlying tools (like Pydantic Schema + Outlines) to ensure 100% parsing success by downstream systems.
* **Tool Calling:** Equip the Agent with API capabilities to call local database queries, vector retrieval (for fast filtering), and historical comparison record lookups.
* **Memory Mechanism:** Maintain a `Schema Alignment Ledger`. If a user previously confirmed that "`author` maps to `creator`," the Agent stores this in memory and applies it directly next time, achieving "self-correction."
* **Environmental Awareness:** The Agent can perceive the overall characteristics of the current database (e.g., the most commonly used format, or whether the overall business domain is CV or NLP), allowing it to dynamically adjust weights during scoring.

### 3. Core Workflow (Hybrid Matching Pipeline)

We can optimize your 4-step concept into the following pipeline:

1. **Stage 1: Pre-Filtering & Exact Match (Hard Filtering)**
* Parse the incoming JSON Blob.
* Use traditional code (Nested for-loops or Set intersections) to quickly extract identical fields and formats.
* Apply a basic similarity formula for preliminary scoring and filtering to select the Top-K (e.g., 10) candidate schemas. This prevents the LLM from performing $O(N)$ complexity reasoning across the entire database.


2. **Stage 2: Agentic Semantic Alignment**
* The Agent steps in to perform deep alignment on the `Mismatched Headers` of the Top-K candidates.
* Combining context (e.g., `bbox`-related schemas are usually CV data), it determines whether `width` is equivalent to `w`, or `author` to `creator`.


3. **Stage 3: Comprehensive Scoring**
* Calculate the final Similarity Score. The formula design could look like:

$$Score = (W_{exact} \times S_{exact}) + (W_{semantic} \times S_{semantic}) + (W_{format} \times S_{format})$$




4. **Stage 4: Structured Ranking & Trade-off Generation**
* Select the Top-3 based on the final scores.
* **Harnessing Trigger:** Force the Agent to output a strictly formatted comparison report explaining the differences between these three options (e.g., "Schema A contains all target fields but its format is CSV; Schema B's format is Parquet but it lacks the 'anomaly_flag' field").



---

## 🛠️ Implementation Plan

The implementation is divided into 4 main phases, adopting an agile development approach for gradual deployment.

### Phase 1: Infrastructure & Harnessing Framework Setup

* **Goal:** Deploy the Qwen3.5 9B model and establish the Constrained Generation pipeline.
* **Tech Stack:** vLLM (for model inference acceleration) + Outlines / SGLang (for harnessing).
* **Action Items:**
1. Define strict Pydantic models (e.g., `AlignmentResult`, `TradeoffReport`) as the foundation for harnessing.
2. Wrap the Agent's underlying generation functions to ensure it only outputs tokens within the constraints defined by the Pydantic schema.
3. Set up a local test database for the `dataset_schema` table.



### Phase 2: Dual-Track Matching Logic Implementation

* **Goal:** Combine Exact Match with Semantic Match.
* **Action Items:**
1. **Exact Match Module:** Write a Python script to extract fields from the Target and Candidate schemas, using `set(target).intersection(set(candidate))` to calculate the exact overlap ratio.
2. **Lightweight Semantic Module (Optional Optimization):** Introduce a very small embedding model (like `all-MiniLM-L6-v2`) to vectorize all fields. When exact matches fail, first use `cosine_similarity` to find suspected matches, then pass them to the LLM for judgment. This is much more efficient and stable than having the 9B model guess blindly.



### Phase 3: Agent Memory & Feedback Loop Injection

* **Goal:** Make the Agent "smarter with use."
* **Action Items:**
1. Create an auxiliary table `semantic_synonym_memory` (e.g., columns: `field_A`, `field_B`, `confidence`, `user_confirmed_flag`).
2. Before the Agent performs semantic comparisons, use **Tool Calling** to query this table. If `[days, day_counts]` is already recorded by the system environment as a synonym, skip the LLM reasoning and assign a perfect Semantic Match score.
3. Build a Feedback Interface: When a user selects Top-2 instead of Top-1 in the UI, trigger a background reflection record for the Agent to adjust future weights for certain naming conventions.



### Phase 4: Trade-off Generation & Final Assembly

* **Goal:** Generate user-facing Top-3 recommendations and differential explanations.
* **Action Items:**
1. Package the comparison results of the Top-3 (including missing fields, format differences, and semantic mappings) as Context and feed it to the Agent.
2. Use Harnessing to force the generation of a JSON structure similar to the following:
```json
{
  "top_choices": [
    {
      "schema_id": 3,
      "score": 0.92,
      "alignment_map": {"author": "creator"},
      "trade_off_analysis": "This schema matches all features but uses 'creator' instead of 'author'. Format is parquet which is optimal."
    }
  ]
}

```


3. The frontend renders comparison cards based on this JSON for the user to select.



---

### Architectural Advice

While Qwen3.5 9B has a sufficient context window, handling JSON schemas with many symbols can easily cause attention dilution. Therefore, your idea of **"filtering first (For-loop for Exact Match), and letting the LLM do the Diff later (Semantic & Trade-off)"** is entirely correct. It frees the LLM from heavy search tasks, letting it focus solely on what it does best: "reasoning" and "summarizing."
