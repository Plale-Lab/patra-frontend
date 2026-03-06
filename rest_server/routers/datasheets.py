from typing import Optional

from fastapi import APIRouter, Header, HTTPException, Query

from rest_server.schemas.datasheet import (
    CreateDatasheetRequest,
    LinkModelCardRequest,
    PatchDatasheetRequest,
    UpsertDatasheetSchemaRequest,
)
from rest_server.services.datasheet_service import DatasheetService


def build_datasheet_router(service: DatasheetService) -> APIRouter:
    router = APIRouter(prefix="/v1/datasheets", tags=["Datasheets"])

    @router.post("")
    def create_datasheet(
        request: CreateDatasheetRequest,
        x_actor_id: str = Header(default="system"),
        x_icicle_environment: str = Header(default="unknown"),
    ):
        created = service.create_datasheet(
            datasheet=request.datasheet.model_dump(exclude_none=True),
            datasheet_schema=request.datasheet_schema.model_dump(exclude_none=True) if request.datasheet_schema else None,
            datacite_metadata=request.datacite_metadata,
            actor=x_actor_id,
            environment=x_icicle_environment,
            reason=request.reason,
        )
        if created is None:
            raise HTTPException(status_code=409, detail="Datasheet already exists")
        return created

    @router.get("")
    def list_datasheets(
        external_id: Optional[str] = None,
        doi: Optional[str] = None,
        source: Optional[str] = None,
        subject_area: Optional[str] = None,
        associated_tasks: Optional[str] = None,
        is_private: Optional[bool] = None,
        status: Optional[str] = "active",
        limit: int = Query(default=50, ge=1, le=500),
        offset: int = Query(default=0, ge=0),
    ):
        return service.list_datasheets(
            external_id=external_id,
            doi=doi,
            source=source,
            subject_area=subject_area,
            associated_tasks=associated_tasks,
            is_private=is_private,
            status=status,
            limit=limit,
            offset=offset,
        )

    @router.get("/{datasheet_id}")
    def get_datasheet(datasheet_id: str, revision: Optional[int] = Query(default=None, ge=1)):
        result = service.get_datasheet(datasheet_id, revision=revision)
        if not result:
            raise HTTPException(status_code=404, detail="Datasheet not found")
        return result

    @router.patch("/{datasheet_id}")
    def update_datasheet(
        datasheet_id: str,
        request: PatchDatasheetRequest,
        x_actor_id: str = Header(default="system"),
        x_icicle_environment: str = Header(default="unknown"),
    ):
        updated = service.update_datasheet(
            datasheet_id=datasheet_id,
            patch_data=request.patch_data,
            datasheet_schema=request.datasheet_schema.model_dump(exclude_none=True) if request.datasheet_schema else None,
            datacite_metadata=request.datacite_metadata,
            actor=x_actor_id,
            environment=x_icicle_environment,
            reason=request.reason,
        )
        if not updated:
            raise HTTPException(status_code=404, detail="Datasheet not found")
        return updated

    @router.delete("/{datasheet_id}")
    def archive_datasheet(
        datasheet_id: str,
        reason: str = Query(default="archived"),
        x_actor_id: str = Header(default="system"),
        x_icicle_environment: str = Header(default="unknown"),
    ):
        success = service.archive_datasheet(
            datasheet_id=datasheet_id,
            actor=x_actor_id,
            environment=x_icicle_environment,
            reason=reason,
        )
        if not success:
            raise HTTPException(status_code=404, detail="Datasheet not found")
        return {"message": "Datasheet archived"}

    @router.get("/{datasheet_id}/versions")
    def get_versions(datasheet_id: str):
        versions = service.get_versions(datasheet_id)
        if not versions:
            raise HTTPException(status_code=404, detail="Datasheet not found")
        return versions

    @router.get("/{datasheet_id}/audit")
    def get_audit(datasheet_id: str, limit: int = Query(default=100, ge=1, le=1000)):
        audit = service.get_audit(datasheet_id, limit=limit)
        if not audit:
            raise HTTPException(status_code=404, detail="No audit events found")
        return audit

    @router.put("/{datasheet_id}/schema")
    def upsert_schema(datasheet_id: str, request: UpsertDatasheetSchemaRequest):
        schema = service.upsert_schema(datasheet_id, request.schema.model_dump(exclude_none=True))
        if not schema:
            raise HTTPException(status_code=404, detail="Datasheet not found")
        return schema

    @router.post("/{datasheet_id}/links/model-cards/{model_card_id}")
    def link_model_card(datasheet_id: str, model_card_id: str, request: LinkModelCardRequest):
        linked = service.link_modelcard(datasheet_id, model_card_id, revision=request.revision)
        if not linked:
            raise HTTPException(status_code=404, detail="Datasheet or model card not found")
        return {"message": "Linked model card to datasheet", "datasheet_id": datasheet_id, "model_card_id": model_card_id}

    return router
