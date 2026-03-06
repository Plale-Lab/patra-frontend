from fastapi import APIRouter, HTTPException
from rest_server.schemas.agent_schemas import MatchRequest, TradeoffReport, CandidateSchema
from rest_server.services.schema_agent_service import SchemaAgentService

# In a real system, these would be fetched from a database
MOCK_CANDIDATES = [
    CandidateSchema(
        schema_id="schema-001",
        name="Users Dataset Core",
        format="csv",
        fields=["id", "username", "email", "created_at", "last_login", "is_active", "role"]
    ),
    CandidateSchema(
        schema_id="schema-002",
        name="Customer Profiles",
        format="parquet",
        fields=["customer_id", "name", "mail_address", "join_date", "status", "user_group", "ltv"]
    ),
    CandidateSchema(
        schema_id="schema-003",
        name="Auth Logs",
        format="json",
        fields=["log_id", "user_id", "timestamp", "action", "ip_address", "success"]
    ),
    CandidateSchema(
        schema_id="schema-004",
        name="Dataset Analytics Schema",
        format="csv",
        fields=["dataset_id", "views", "downloads", "likes", "author_id", "day_counts"]
    )
]

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
            # Using mock candidates, but normally we'd query neo4j or sql
            candidates = MOCK_CANDIDATES
            
            # Execute Pipeline
            report = agent_service.match_schema(request.target_schema, candidates, request.top_k)
            return report
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    return router
