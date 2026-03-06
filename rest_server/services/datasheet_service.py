from typing import Any, Dict, Optional

from ingester.neo4j_ingester import MCIngester


class DatasheetService:
    def __init__(self, ingester: MCIngester):
        self.ingester = ingester

    def create_datasheet(
        self,
        datasheet: Dict[str, Any],
        datasheet_schema: Optional[Dict[str, Any]],
        datacite_metadata: Optional[Dict[str, Any]],
        actor: str,
        environment: str,
        reason: str,
    ) -> Optional[Dict[str, Any]]:
        return self.ingester.create_datasheet_with_revision(
            datasheet=datasheet,
            datasheet_schema=datasheet_schema,
            datacite_metadata=datacite_metadata,
            actor=actor,
            environment=environment,
            reason=reason,
        )

    def get_datasheet(self, datasheet_id: str, revision: Optional[int] = None) -> Optional[Dict[str, Any]]:
        return self.ingester.get_datasheet(datasheet_id, revision=revision)

    def list_datasheets(
        self,
        external_id: Optional[str] = None,
        doi: Optional[str] = None,
        source: Optional[str] = None,
        subject_area: Optional[str] = None,
        associated_tasks: Optional[str] = None,
        is_private: Optional[bool] = None,
        status: Optional[str] = "active",
        limit: int = 50,
        offset: int = 0,
    ):
        return self.ingester.list_datasheets(
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

    def update_datasheet(
        self,
        datasheet_id: str,
        patch_data: Dict[str, Any],
        datasheet_schema: Optional[Dict[str, Any]],
        datacite_metadata: Optional[Dict[str, Any]],
        actor: str,
        environment: str,
        reason: str,
    ) -> Optional[Dict[str, Any]]:
        return self.ingester.update_datasheet_with_revision(
            datasheet_id=datasheet_id,
            patch_data=patch_data,
            datasheet_schema=datasheet_schema,
            datacite_metadata=datacite_metadata,
            actor=actor,
            environment=environment,
            reason=reason,
        )

    def archive_datasheet(self, datasheet_id: str, actor: str, environment: str, reason: str) -> bool:
        return self.ingester.archive_datasheet(
            datasheet_id=datasheet_id,
            actor=actor,
            environment=environment,
            reason=reason,
        )

    def get_versions(self, datasheet_id: str):
        return self.ingester.get_datasheet_versions(datasheet_id)

    def get_audit(self, datasheet_id: str, limit: int = 100):
        return self.ingester.get_datasheet_audit(datasheet_id, limit=limit)

    def upsert_schema(self, datasheet_id: str, schema_payload: Dict[str, Any]):
        return self.ingester.upsert_datasheet_schema(datasheet_id, schema_payload)

    def link_modelcard(self, datasheet_id: str, model_card_id: str, revision: Optional[int] = None) -> bool:
        return self.ingester.link_modelcard_to_datasheet(
            model_card_id=model_card_id,
            datasheet_id=datasheet_id,
            revision=revision,
        )
