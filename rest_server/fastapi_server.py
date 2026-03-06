import os

from fastapi import FastAPI

from ingester.neo4j_ingester import MCIngester
from rest_server.routers.datasheets import build_datasheet_router
from rest_server.services.datasheet_service import DatasheetService
from rest_server.services.schema_agent_service import SchemaAgentService
from rest_server.routers.schema_agent import build_schema_agent_router


NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USERNAME = os.getenv("NEO4J_USER")
NEO4J_PWD = os.getenv("NEO4J_PWD")
ENABLE_MC_SIMILARITY = os.getenv("ENABLE_MC_SIMILARITY", "False").lower() == "true"

mc_ingester = MCIngester(NEO4J_URI, NEO4J_USERNAME, NEO4J_PWD, ENABLE_MC_SIMILARITY)
datasheet_service = DatasheetService(mc_ingester)
schema_agent_service = SchemaAgentService()

app = FastAPI(
    title="Patra Datasheet API",
    version="1.0.0",
    description="Versioned Datasheet CRUD and auditing API for Patra KG",
)


@app.get("/")
def home():
    return {"message": "Welcome to the Patra Datasheet FastAPI service"}


app.include_router(build_datasheet_router(datasheet_service))
app.include_router(build_schema_agent_router(schema_agent_service))
