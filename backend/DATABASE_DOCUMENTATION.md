# Synergy Backend Database Documentation

## Overview

The backend uses **MongoDB** as the primary datastore.

- Driver: `mongodb` (Node.js official driver)
- Default URI: `mongodb://127.0.0.1:27017`
- Default DB name: `synergy`
- Config source: `backend/.env`

## Environment Variables

```env
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB_NAME=synergy
```

## Collections

### users
Stores authentication and profile information.

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "user",
  "password_hash": "bcrypt hash",
  "created_at": "ISO timestamp",
  "updated_at": "ISO timestamp"
}
```

Indexes:
- `email` unique
- `username` unique

### workspaces
Top-level workspace metadata.

```json
{
  "id": "uuid",
  "name": "My Workspace",
  "owner_id": "user uuid",
  "template_id": "react|node|python|null",
  "created_at": "ISO timestamp",
  "updated_at": "ISO timestamp"
}
```

Indexes:
- `owner_id`
- `updated_at` (descending sort use)

### workspace_members
Workspace RBAC membership.

```json
{
  "workspace_id": "workspace uuid",
  "user_id": "user uuid",
  "role": "owner|editor|viewer",
  "created_at": "ISO timestamp"
}
```

Indexes:
- `(workspace_id, user_id)` unique
- `user_id`

### workspace_invites
Pending invites for emails not yet mapped to known users.

```json
{
  "id": "uuid",
  "workspace_id": "workspace uuid",
  "email": "invitee@example.com",
  "role": "editor|viewer",
  "token": "uuid",
  "status": "pending|accepted",
  "invited_by": "user uuid",
  "created_at": "ISO timestamp"
}
```

Indexes:
- `token` unique
- `(workspace_id, email)`

### files
Workspace file tree.

```json
{
  "id": "uuid",
  "workspace_id": "workspace uuid",
  "parent_id": "file uuid|null",
  "name": "App.tsx",
  "type": "file|folder",
  "path": "/src/App.tsx",
  "content": "file content|null",
  "language": "typescript|null",
  "created_by": "user uuid",
  "updated_by": "user uuid",
  "created_at": "ISO timestamp",
  "updated_at": "ISO timestamp"
}
```

Indexes:
- `(workspace_id, path)` unique
- `(workspace_id, parent_id)`

### snapshots
Version history checkpoint metadata.

```json
{
  "id": "uuid",
  "workspace_id": "workspace uuid",
  "message": "Manual save",
  "created_by": "user uuid",
  "created_at": "ISO timestamp"
}
```

Indexes:
- `(workspace_id, created_at)`

### snapshot_files
Full file-state backup for a snapshot.

```json
{
  "snapshot_id": "snapshot uuid",
  "file_id": "file uuid|null",
  "path": "/src/App.tsx",
  "type": "file|folder",
  "name": "App.tsx",
  "content": "...",
  "language": "typescript|null"
}
```

Indexes:
- `(snapshot_id, path)` unique

### workspace_activity
Event stream for workspace actions.

```json
{
  "id": "uuid",
  "workspace_id": "workspace uuid",
  "user_id": "user uuid",
  "action": "file.updated",
  "target": "/src/App.tsx",
  "metadata": { "renamed": false },
  "created_at": "ISO timestamp"
}
```

Indexes:
- `(workspace_id, created_at)`

### chat_messages
Persistent chat history.

```json
{
  "id": "uuid",
  "workspace_id": "workspace uuid",
  "user_id": "user uuid",
  "content": "hello",
  "created_at": "ISO timestamp"
}
```

Indexes:
- `(workspace_id, created_at)`

### share_links
Generated workspace share links.

```json
{
  "token": "uuid",
  "workspace_id": "workspace uuid",
  "created_by": "user uuid",
  "created_at": "ISO timestamp"
}
```

Indexes:
- `token` unique
- `(workspace_id, created_by)` unique

## Startup Behavior

On server startup, backend does the following:

1. Connects to MongoDB.
2. Creates required indexes for all collections.
3. Creates default admin user if absent.
4. Starts HTTP + websocket services.

Default admin credentials:
- Email: `admin@synergy.com`
- Password: `admin123`
