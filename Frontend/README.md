# Frontend Environment

The React workspace now reads backend endpoints from Vite environment variables so it can talk to production deployments instead of the hard-coded `localhost:3001` URLs.

## Required Variables

- `VITE_BACKEND_HTTP_BASE` – Base HTTP origin for the backend (default `http://localhost:3001`). The REST API URL is derived as `${VITE_BACKEND_HTTP_BASE}/api` when `VITE_API_BASE_URL` is not set.
- `VITE_API_BASE_URL` (optional) – Explicit override for the REST API base, useful when the API is served from a different sub-path.
- `VITE_REALTIME_WS_BASE` (optional) – WebSocket origin used for chat and terminal streams. Defaults to `ws(s)://<current-host>:3001` with localhost fallbacks.
- `VITE_COLLAB_SERVER_URL` (optional) – Direct WebSocket endpoint for the Yjs collab server. Defaults to `${VITE_REALTIME_WS_BASE}/collab`.

Define these values in `.env` or your hosting provider's dashboard before building the app.

