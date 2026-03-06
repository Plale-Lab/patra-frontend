from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class DatasheetPayload(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    version: Optional[str] = None
    is_private: Optional[bool] = False
    associated_tasks: Optional[str] = None
    dataset_characteristics: Optional[str] = None
    attribute_types: Optional[str] = None
    categories: Optional[str] = None
    datapoints: Optional[int] = None
    description: Optional[str] = None
    doi: Optional[str] = None
    download_url: Optional[str] = None
    external_id: Optional[str] = None
    license: Optional[str] = None
    missing_values: Optional[bool] = None
    source: Optional[str] = None
    subject_area: Optional[str] = None


class DatasheetSchemaPayload(BaseModel):
    id: Optional[str] = None
    format: Optional[str] = None
    conceptual_variables: Optional[Any] = Field(default_factory=list)
    json_ld_mapping: Optional[Any] = Field(default_factory=dict)
    ro_crate_metadata: Optional[Any] = Field(default_factory=dict)


class CreateDatasheetRequest(BaseModel):
    datasheet: DatasheetPayload
    datasheet_schema: Optional[DatasheetSchemaPayload] = None
    datacite_metadata: Dict[str, Any] = Field(default_factory=dict)
    reason: str = "initial_create"


class PatchDatasheetRequest(BaseModel):
    patch_data: Dict[str, Any]
    datasheet_schema: Optional[DatasheetSchemaPayload] = None
    datacite_metadata: Optional[Dict[str, Any]] = None
    reason: str = "manual_update"


class UpsertDatasheetSchemaRequest(BaseModel):
    schema: DatasheetSchemaPayload


class LinkModelCardRequest(BaseModel):
    revision: Optional[int] = None
