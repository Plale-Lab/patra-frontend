import os
import json
from typing import List, Dict, Tuple
from sentence_transformers import SentenceTransformer, util
from openai import OpenAI
from rest_server.schemas.agent_schemas import (
    TargetSchema,
    CandidateSchema,
    AlignmentResult,
    TradeoffReport,
    TradeoffReportChoice,
    SynonymRecord
)

# Optional weights (Configurable)
W_EXACT = 0.5
W_SEMANTIC = 0.4
W_FORMAT = 0.1

class SynonymMemory:
    """Mock memory for synonym mappings."""
    def __init__(self):
        # field_a -> { field_b: confidence }
        self.memory: Dict[str, Dict[str, float]] = {
            "author": {"creator": 1.0},
            "day_counts": {"days": 1.0},
            "w": {"width": 1.0},
            "h": {"height": 1.0}
        }

    def get_synonym_score(self, field_a: str, field_b: str) -> float:
        a, b = field_a.lower(), field_b.lower()
        if a in self.memory and b in self.memory[a]:
            return self.memory[a][b]
        if b in self.memory and a in self.memory[b]:
            return self.memory[b][a]
        return 0.0

    def add_synonym(self, field_a: str, field_b: str, confidence: float = 1.0):
        a, b = field_a.lower(), field_b.lower()
        if a not in self.memory:
            self.memory[a] = {}
        self.memory[a][b] = confidence


class SchemaAgentService:
    def __init__(self):
        # 1. Semantic Model (Phase 2)
        print("Loading sentence-transformers model...")
        self.encoder = SentenceTransformer('all-MiniLM-L6-v2')
        print("Model loaded.")

        # 2. Synonym Memory (Phase 3)
        self.memory = SynonymMemory()

        # 3. LLM Client setup (Phase 4)
        # Point to local vLLM or OpenAI
        self.client = OpenAI(
            api_key=os.getenv("OPENAI_API_KEY", "dummy"),
            base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
        )
        self.llm_model = os.getenv("LLM_MODEL", "gpt-4o-mini")

    def _calculate_exact_match(self, target_fields: List[str], candidate_fields: List[str]) -> Tuple[float, List[str], List[str]]:
        """Phase 1: Returns exact score, matched fields, and unmatched target fields."""
        target_set = set(f.lower() for f in target_fields)
        candidate_set = set(f.lower() for f in candidate_fields)
        
        if not target_set:
            return 0.0, [], []

        intersection = target_set.intersection(candidate_set)
        score = len(intersection) / len(target_set)
        
        unmatched_targets = list(target_set - intersection)
        return score, list(intersection), unmatched_targets

    def _calculate_semantic_match(self, unmatched_targets: List[str], candidate_fields: List[str]) -> Tuple[float, Dict[str, str]]:
        """Phase 2 & 3: Returns semantic score and alignment dict mapped via embeddings or memory."""
        if not unmatched_targets or not candidate_fields:
            return 0.0, {}

        cand_lower = [f.lower() for f in candidate_fields]
        alignment_map = {}
        total_semantic_score = 0.0

        # Encode candidates once
        cand_embeddings = self.encoder.encode(cand_lower, convert_to_tensor=True)

        for t_field in unmatched_targets:
            # 1. Check memory first
            best_mem_score = 0
            best_mem_cand = None
            for c_field in cand_lower:
                mem_score = self.memory.get_synonym_score(t_field, c_field)
                if mem_score > best_mem_score:
                    best_mem_score = mem_score
                    best_mem_cand = c_field

            if best_mem_score >= 0.85:
                # Memory hit
                alignment_map[t_field] = best_mem_cand
                total_semantic_score += best_mem_score
                continue

            # 2. Semantic lookup
            t_emb = self.encoder.encode(t_field, convert_to_tensor=True)
            cos_scores = util.cos_sim(t_emb, cand_embeddings)[0]
            
            best_idx = int(cos_scores.argmax())
            best_score = float(cos_scores[best_idx])
            
            if best_score > 0.6:  # threshold
                alignment_map[t_field] = cand_lower[best_idx]
                total_semantic_score += best_score

        avg_score = total_semantic_score / len(unmatched_targets) if unmatched_targets else 0.0
        return avg_score, alignment_map

    def evaluate_candidates(self, target: TargetSchema, candidates: List[CandidateSchema]) -> List[AlignmentResult]:
        """Runs the hybrid matching pipeline and returns ranked candidates."""
        results = []

        for cand in candidates:
            # Exact Match
            exact_score, exact_matches, unmatched_targets = self._calculate_exact_match(target.fields, cand.fields)
            
            # Semantic Match
            semantic_score, semantic_map = self._calculate_semantic_match(unmatched_targets, cand.fields)
            
            # Format Match
            format_score = 1.0 if target.format and cand.format and target.format.lower() == cand.format.lower() else 0.0
            
            # Final Score Calculation
            final_score = (W_EXACT * exact_score) + (W_SEMANTIC * semantic_score) + (W_FORMAT * format_score)
            
            # Combine mappings
            alignment_map = {f: f for f in exact_matches}
            alignment_map.update(semantic_map)
            
            still_missing = [tf for tf in target.fields if tf.lower() not in alignment_map]
            
            results.append(AlignmentResult(
                schema_id=cand.schema_id,
                exact_match_score=exact_score,
                semantic_match_score=semantic_score,
                format_match_score=format_score,
                final_score=final_score,
                alignment_map=alignment_map,
                missing_fields=still_missing
            ))

        # Sort by final score descending
        results.sort(key=lambda x: x.final_score, reverse=True)
        return results

    def generate_tradeoff_report(self, target: TargetSchema, top_results: List[AlignmentResult], all_candidates: List[CandidateSchema]) -> TradeoffReport:
        """Phase 4: Calls LLM with structured output to generate trade-off analysis."""
        
        # Build context
        cand_dict = {c.schema_id: c for c in all_candidates}
        prompt_data = {
            "target": target.model_dump(),
            "top_candidates": []
        }
        
        for res in top_results:
            c = cand_dict[res.schema_id]
            prompt_data["top_candidates"].append({
                "schema_id": c.schema_id,
                "name": c.name,
                "format": c.format,
                "score": res.final_score,
                "alignment_map": res.alignment_map,
                "missing_fields": res.missing_fields
            })

        system_msg = "You are a data engineering assistant. Given a target schema and top candidate schemas with alignment scores, generate a TradeoffReport analyzing the differences, missing fields, format changes, and overall suitability. Output strictly as JSON matching the TradeoffReport schema."
        
        try:
            # Using structured outputs via OpenAI SDK parser if available or JSON mode
            response = self.client.chat.completions.create(
                model=self.llm_model,
                messages=[
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": json.dumps(prompt_data, indent=2)}
                ],
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            data = json.loads(content)
            
            # If the LLM returned a dict matching TradeoffReport, parse it
            # Sometimes it might wrap it or return top_choices directly
            if "top_choices" in data:
                return TradeoffReport(**data)
            else:
                # Fallback mapping
                choices = []
                for res in top_results:
                    choices.append(TradeoffReportChoice(
                        schema_id=res.schema_id,
                        score=res.final_score,
                        alignment_map=res.alignment_map,
                        trade_off_analysis=f"Fallback analysis: Missing {len(res.missing_fields)} core fields."
                    ))
                return TradeoffReport(top_choices=choices)
                
        except Exception as e:
            print(f"LLM Generation failed: {e}")
            # Fallback
            choices = []
            for res in top_results:
                choices.append(TradeoffReportChoice(
                    schema_id=res.schema_id,
                    score=res.final_score,
                    alignment_map=res.alignment_map,
                    trade_off_analysis=f"Schema {res.schema_id} matches partially. Check alignment map."
                ))
            return TradeoffReport(top_choices=choices)

    def match_schema(self, target: TargetSchema, candidates: List[CandidateSchema], top_k: int = 3) -> TradeoffReport:
        # 1. Pipeline execution
        ranked_results = self.evaluate_candidates(target, candidates)
        top_results = ranked_results[:top_k]
        
        # 2. LLM Harness generation
        report = self.generate_tradeoff_report(target, top_results, candidates)
        
        return report
