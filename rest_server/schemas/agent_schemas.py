from typing import Dict, List, Optional

from pydantic import BaseModel, Field

class TargetSchema(BaseModel):
    """Represents a target schema defined by the user for matching."""
    name: str = Field(..., description="Name of the target schema")
    description: Optional[str] = Field(None, description="General description of the schema context")
    format: Optional[str] = Field(None, description="The format of the schema (e.g. CSV, Parquet, JSON)")
    fields: List[str] = Field(..., description="List of field names in the target schema")
    version: Optional[int] = Field(None, description="Optional version of the target schema")

class CandidateSchema(BaseModel):
    """Represents a candidate schema from the database."""
    schema_id: str = Field(..., description="ID of the candidate schema")
    name: str = Field(..., description="Name of the candidate schema")
    format: Optional[str] = Field(None, description="Format of the candidate schema")
    fields: List[str] = Field(..., description="List of field names in the candidate schema")
    version: Optional[int] = Field(None, description="Optional version of the candidate schema")
    blob: Optional[Dict[str, object]] = Field(
        default=None,
        description="Original schema blob when sourced from the dataset_schemas table.",
    )

class AlignmentResult(BaseModel):
    """Intermediate calculation result comparing the target and a candidate."""
    schema_id: str
    candidate_name: str
    exact_match_score: float
    semantic_match_score: float
    format_match_score: float
    final_score: float
    preliminary_score: float = 0.0
    semantic_hits: int = 0
    alignment_map: Dict[str, str] = Field(
        default_factory=dict, 
        description="Mapping from target field to candidate field"
    )
    missing_fields: List[str] = Field(default_factory=list)

class TradeoffReportChoice(BaseModel):
    """A struct for the LLM to output its recommendation."""
    schema_id: str
    name: Optional[str] = None
    format: Optional[str] = None
    score: float
    alignment_map: Dict[str, str]
    missing_fields: List[str] = Field(default_factory=list)
    trade_off_analysis: str = Field(..., description="Analysis of the candidate vs target, listing trade-offs.")

class TradeoffReport(BaseModel):
    """The final structured generation payload returned by the LLM."""
    target_schema_name: str
    environment_summary: str
    trace_id: Optional[str] = None
    trace_log_path: Optional[str] = None
    top_choices: List[TradeoffReportChoice]

class SynonymRecord(BaseModel):
    """A memory record for synonym mappings."""
    field_A: str
    field_B: str
    confidence: float
    user_confirmed_flag: bool = False

class MatchRequest(BaseModel):
    target_schema: TargetSchema
    top_k: int = 3
    pre_filter_k: int = 10
    candidate_schemas: Optional[List[CandidateSchema]] = None
