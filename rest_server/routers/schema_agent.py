from fastapi import APIRouter, HTTPException

from rest_server.schemas.agent_schemas import CandidateSchema, MatchRequest, TradeoffReport
from rest_server.services.schema_agent_service import SchemaAgentService
from rest_server.services.mock_schema_repository import load_mock_candidate_schemas


def _resolve_candidates(request: MatchRequest) -> list[CandidateSchema]:
    if request.candidate_schemas:
        return request.candidate_schemas
    return load_mock_candidate_schemas()

def build_schema_agent_router(agent_service: SchemaAgentService) -> APIRouter:
    router = APIRouter(prefix="/agent", tags=["Schema Agent"])

    @router.post("/match", response_model=TradeoffReport)
    def match_schema(request: MatchRequest):
        """
        Executes the Hybrid Schema Matching Pipeline:
        1. Exact Match via Field Intersections
        2. Semantic Match via SentenceTransformers
        3. Constrained JSON Output via LLM Trade-off Analysis
        """
        try:
            candidates = _resolve_candidates(request)
            report = agent_service.match_schema(
                request.target_schema,
                candidates,
                top_k=request.top_k,
                pre_filter_k=request.pre_filter_k,
            )
            return report
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @router.get("/mock-candidates", response_model=list[CandidateSchema])
    def list_mock_candidates():
        return load_mock_candidate_schemas()

    return router
