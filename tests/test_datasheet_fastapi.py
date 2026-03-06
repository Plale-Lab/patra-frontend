from fastapi import FastAPI
from fastapi.testclient import TestClient

from rest_server.routers.datasheets import build_datasheet_router


class MockDatasheetService:
    def __init__(self):
        self.store = {
            "ds-1": {
                "datasheet_id": "ds-1",
                "revision": 1,
                "datasheet": {"id": "ds-1", "name": "test"},
                "datacite": {},
            }
        }

    def create_datasheet(self, datasheet, datasheet_schema, datacite_metadata, actor, environment, reason):
        if datasheet.get("id") == "ds-1":
            return None
        created = {
            "datasheet_id": datasheet.get("id", "ds-new"),
            "revision": 1,
            "datasheet": datasheet,
            "datacite": datacite_metadata or {},
        }
        self.store[created["datasheet_id"]] = created
        return created

    def get_datasheet(self, datasheet_id, revision=None):
        return self.store.get(datasheet_id)

    def list_datasheets(self, **kwargs):
        return [{"datasheet_id": key} for key in self.store.keys()]

    def update_datasheet(self, datasheet_id, patch_data, datasheet_schema, datacite_metadata, actor, environment, reason):
        existing = self.store.get(datasheet_id)
        if not existing:
            return None
        existing["revision"] += 1
        existing["datasheet"].update(patch_data)
        return existing

    def archive_datasheet(self, datasheet_id, actor, environment, reason):
        return datasheet_id in self.store

    def get_versions(self, datasheet_id):
        if datasheet_id not in self.store:
            return []
        return [{"revision": 1}, {"revision": 2}]

    def get_audit(self, datasheet_id, limit=100):
        if datasheet_id not in self.store:
            return []
        return [{"event_id": "evt-1", "action": "CREATE"}]

    def upsert_schema(self, datasheet_id, schema_payload):
        if datasheet_id not in self.store:
            return None
        return {"id": schema_payload.get("id", "schema-1"), "format": schema_payload.get("format")}

    def link_modelcard(self, datasheet_id, model_card_id, revision=None):
        return datasheet_id in self.store


def build_client():
    app = FastAPI()
    app.include_router(build_datasheet_router(MockDatasheetService()))
    return TestClient(app)


def test_create_datasheet_success():
    client = build_client()
    response = client.post(
        "/v1/datasheets",
        headers={"X-Actor-Id": "william", "X-ICICLE-Environment": "dev"},
        json={
            "datasheet": {"id": "ds-2", "name": "new-ds"},
            "reason": "initial_create",
            "datacite_metadata": {},
        },
    )
    assert response.status_code == 200
    assert response.json()["datasheet_id"] == "ds-2"


def test_create_datasheet_conflict():
    client = build_client()
    response = client.post(
        "/v1/datasheets",
        json={"datasheet": {"id": "ds-1", "name": "duplicate"}, "datacite_metadata": {}},
    )
    assert response.status_code == 409


def test_get_datasheet_success():
    client = build_client()
    response = client.get("/v1/datasheets/ds-1")
    assert response.status_code == 200
    assert response.json()["datasheet_id"] == "ds-1"


def test_patch_datasheet_success():
    client = build_client()
    response = client.patch(
        "/v1/datasheets/ds-1",
        headers={"X-Actor-Id": "william", "X-ICICLE-Environment": "staging"},
        json={"patch_data": {"description": "patched"}},
    )
    assert response.status_code == 200
    assert response.json()["revision"] == 2


def test_archive_datasheet_success():
    client = build_client()
    response = client.delete("/v1/datasheets/ds-1")
    assert response.status_code == 200


def test_versions_and_audit_endpoints():
    client = build_client()
    versions_response = client.get("/v1/datasheets/ds-1/versions")
    audit_response = client.get("/v1/datasheets/ds-1/audit")
    assert versions_response.status_code == 200
    assert audit_response.status_code == 200


def test_upsert_schema_and_link_modelcard():
    client = build_client()
    schema_response = client.put(
        "/v1/datasheets/ds-1/schema",
        json={"schema": {"id": "schema-1", "format": "json"}},
    )
    link_response = client.post(
        "/v1/datasheets/ds-1/links/model-cards/mc-1",
        json={"revision": 1},
    )
    assert schema_response.status_code == 200
    assert link_response.status_code == 200
