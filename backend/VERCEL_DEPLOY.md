# Backend Vercel Deploy Guide

This backend folder now includes Vercel-ready serverless APIs.

## Deployed Endpoints

- `/api` -> default status response
- `/api/health` -> health check response

Both endpoints return `status: "running ok"`.

## Deploy Steps

1. Open Vercel Dashboard.
2. Import this repository.
3. Set **Root Directory** as `backend`.
4. Keep framework as **Other**.
5. Deploy.

## Quick Test

- `https://<your-project>.vercel.app/api`
- `https://<your-project>.vercel.app/api/health`

Expected response contains:

```json
{
  "success": true,
  "status": "running ok"
}
```

## Note

Realtime WebSocket/PTY services from `src/index.ts` are for long-running Node server mode.
Vercel serverless is request/response only.
