# Frontend Workspace

This folder contains everything related to the Patra frontend:

- `app/`: Vue 3 + Vite admin panel
- `mock-server/`: local mock API for frontend testing

## Install

```bash
npm --prefix app install
npm --prefix mock-server install
```

## Run

Normal mode (real API target):

```bash
npm --prefix app run dev:live
```

If your current directory is already `frontend/`, this also works:

```bash
npm --prefix frontend/app run dev:live
```

Test mode (local mock server):

```bash
npm --prefix mock-server run dev
npm --prefix app run dev:mock
```

From inside `frontend/`, these also work:

```bash
npm --prefix frontend/mock-server run dev
npm --prefix frontend/app run dev:mock
```

You can also switch between modes at runtime from the header inside the app.
