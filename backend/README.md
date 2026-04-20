# Synergy Backend API

Backend API server for the Synergy collaborative coding workspace.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start MongoDB** (local or Atlas). For local MongoDB Community Server, default URI is:
   ```bash
   mongodb+srv://synergy:synergy@synergy.r8btvlg.mongodb.net/?appName=synergy
   ```

3. **Configure environment** in `.env`:
   ```env
   MONGODB_URI=mongodb+srv://synergy:synergy@synergy.r8btvlg.mongodb.net/?appName=synergy
   MONGODB_DB_NAME=synergy
   JWT_SECRET=your_super_secret_jwt_key_here
   FRONTEND_ORIGIN=https://synergy-collab-umber.vercel.app
   PORT=3001
   ```

4. **Start the server:**
   ```bash
   npm run dev
   ```

5. **Server will be available at:** `http://localhost:3001`

## Features

- **Authentication**: JWT-based auth with login/register
- **CORS**: Enabled for frontend at `https://synergy-collab-umber.vercel.app`
- **Database**: MongoDB-backed collections with indexes
- **Realtime**: Yjs collaboration, workspace chat, and terminal websocket endpoints
- **API Endpoints**: Auth, users, workspaces, files, snapshots, chat, share links

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify JWT token

### Users
- `GET /api/users/profile` - Get user profile

### Workspaces
- `GET /api/workspaces` - Get user workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces/:id` - Get workspace details
- `GET /api/workspaces/:id/members` - Get workspace members
- `POST /api/workspaces/:id/invite` - Invite member
- `GET /api/workspaces/:id/share` - Generate share link

### Files
- `GET /api/workspaces/:id/files` - Get workspace files
- `POST /api/workspaces/:id/files` - Create file/folder
- `PATCH /api/files/:fileId` - Update file/folder
- `DELETE /api/files/:fileId` - Delete file/folder

### Snapshots
- `POST /api/workspaces/:id/snapshots` - Create snapshot
- `GET /api/workspaces/:id/snapshots` - List snapshots
- `POST /api/workspaces/:id/snapshots/:snapshotId/restore` - Restore snapshot

### Realtime
- `WS /collab/:room` - Yjs document sync
- `WS /ws/chat` - Workspace chat
- `WS /ws/terminal` - Terminal stream

## Default Admin User

For testing:
- Email: `admin@synergy.com`
- Password: `admin123`

## Frontend Integration

Your frontend should connect to: `http://localhost:3001/api`

Make sure to include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Development Notes

- Uses MongoDB as primary datastore
- Collections and indexes are auto-created on startup
- JWT secret is set to fallback value for development
- CORS is configured for localhost:5173

## Next Steps

1. Use MongoDB Atlas for managed production deployment
2. Add more comprehensive error handling
3. Add file upload functionality
4. Add background workers for async collaboration events
