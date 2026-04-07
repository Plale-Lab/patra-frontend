# Automated Ingestion

Files:
- `AutomatedIngestionView.vue`: ingestion job + pool UI
- `api.js`: frontend client for `/api/ingestion/*`

Behavior:
- Starts scrape jobs
- Polls recent jobs
- Reviews isolated ingestion artifacts without promoting them to the main pool
