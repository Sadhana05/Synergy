# Synergy Backend API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication Endpoints

### 1. Register User
Create a new user account and automatically log in.

**POST** `/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-1234567890",
      "email": "user@example.com",
      "username": "username",
      "created_at": "2026-03-11T09:26:07.120Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User registered"
}
```

**Error Responses:**
- `400` - Missing required fields
- `409` - User already exists
- `500` - Registration failed

---

### 2. Login User
Authenticate user and get JWT token.

**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-1234567890",
      "email": "user@example.com",
      "username": "username"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- `400` - Missing email or password
- `401` - Invalid credentials
- `500` - Login failed

---

### 3. Reset Password
Reset user password without OTP verification.

**POST** `/auth/reset-password`

**Request Body:**
```json
{
  "email": "user@example.com",
  "newPassword": "newpassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password updated"
}
```

**Error Responses:**
- `400` - Missing email or new password
- `400` - Password too short (minimum 6 characters)
- `404` - User not found
- `500` - Password reset failed

---

### 4. Get User Profile
Get current user profile information.

**GET** `/users/profile`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "user-1234567890",
    "email": "user@example.com",
    "username": "username"
  }
}
```

**Error Responses:**
- `401` - Token required
- `401` - Invalid token
- `404` - User not found

---

## Workspace Endpoints

### 5. Create Workspace
Create a new workspace for authenticated user.

**POST** `/workspaces`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "My Workspace"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "ws-1234567890",
    "name": "My Workspace",
    "owner_id": "user-1234567890",
    "created_at": "2026-03-11T09:26:07.120Z"
  }
}
```

**Error Responses:**
- `400` - Workspace name required
- `401` - Token required
- `500` - Failed to create workspace

---

### 6. Get User Workspaces
Get all workspaces owned by the authenticated user.

**GET** `/workspaces`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "ws-1234567890",
      "name": "My Workspace",
      "owner_id": "user-1234567890",
      "created_at": "2026-03-11T09:26:07.120Z"
    },
    {
      "id": "ws-1234567891",
      "name": "Another Workspace",
      "owner_id": "user-1234567890",
      "created_at": "2026-03-11T09:30:07.120Z"
    }
  ]
}
```

**Error Responses:**
- `401` - Token required
- `500` - Failed to fetch workspaces

---

### 7. Delete Workspace
Delete a workspace owned by the authenticated user.

**DELETE** `/workspaces/:id`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Path Parameters:**
- `id` - Workspace ID to delete

**Response (200):**
```json
{
  "success": true,
  "message": "Workspace deleted"
}
```

**Error Responses:**
- `401` - Token required
- `404` - Workspace not found
- `500` - Failed to delete workspace

---

## Deployment Endpoints

### 9. Deploy Project
Deploy a workspace project to a hosting service.

**POST** `/functions/v1/deploy` (Supabase Edge Function)

**Headers:**
```
Authorization: Bearer <supabase_anon_key>
Content-Type: application/json
```

**Request Body:**
```json
{
  "workspaceName": "My Project",
  "files": [
    {
      "name": "index.html",
      "content": "<html>...</html>",
      "type": "file"
    },
    {
      "name": "styles.css",
      "content": "body { margin: 0; }",
      "type": "file"
    }
  ]
}
```

**Response (200):**
```json
{
  "url": "https://my-project.vercel.app",
  "status": "deployed"
}
```

**Error Responses:**
- `400` - Invalid project data
- `401` - Authentication required
- `500` - Deployment failed

**Environment Configuration:**
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## AI Chat Endpoints

### 10. AI Assistant Chat
Chat with AI assistant for code generation, debugging, compilation help, and explanations.

**POST** `/api/ai/chat`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Help me debug this JavaScript code"
    },
    {
      "role": "assistant", 
      "content": "I'd be happy to help you debug..."
    }
  ],
  "mode": "debug"
}
```

**Response (200):**
```
Content-Type: text/event-stream

data: {"choices":[{"delta":{"content":"I"}}]}
data: {"choices":[{"delta":{"content":"'d"}}]}
data: {"choices":[{"delta":{"content":" "}}]}
data: {"choices":[{"delta":{"content":"be"}}]}
data: {"choices":[{"delta":{"content":" "}}]}
data: [DONE]
```

**Available Modes:**
- `general` - General coding assistance
- `generate` - Code generation
- `debug` - Debugging help
- `compile` - Compilation assistance
- `explain` - Code explanation

**Error Responses:**
- `400` - Invalid messages array
- `500` - Failed to process chat request

---

## System Endpoints

### 8. Health Check
Check if the backend server is running.

**GET** `/health`

**Response (200):**
```json
{
  "status": "OK",
  "time": "2026-03-11T09:26:07.120Z"
}
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

---

## Authentication

### JWT Token
- **Algorithm**: HS256
- **Expiration**: 7 days
- **Header Format**: `Authorization: Bearer <token>`

### Default Admin User
- **Email**: `admin@synergy.com`
- **Password**: `admin123`

---

## CORS Configuration

The backend accepts requests from:
- `https://synergy-collab-umber.vercel.app` (Vite dev server)
- `http://localhost:3000` (React dev server)

---

## Data Models

### User
```typescript
interface User {
  id: string;
  email: string;
  username: string;
  password: string; // Hashed with bcrypt
  created_at: Date;
}
```

### Workspace
```typescript
interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  created_at: Date;
}
```

---

## Development Notes

### Environment Variables
```env
PORT=3001
JWT_SECRET=your_secret_key
```

### Database
- **Type**: In-memory array (for development)
- **Users**: Stored in `users` array
- **Workspaces**: Stored in `workspaces` array

### Security
- **Password Hashing**: bcryptjs (salt rounds: 8)
- **JWT Verification**: jsonwebtoken
- **CORS**: Configured for development origins
- **Security Headers**: Helmet middleware

---

## Testing Examples

### Register and Login
```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"password123"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Workspace Operations
```bash
# Create Workspace
curl -X POST http://localhost:3001/api/workspaces \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{"name":"My Workspace"}'

# Get Workspaces
curl -X GET http://localhost:3001/api/workspaces \
  -H "Authorization: Bearer <your_token>"
```

---

## Rate Limiting & Security

- **Rate Limiting**: Configurable per endpoint
- **Input Validation**: Joi schema validation
- **Error Handling**: Centralized error middleware
- **Logging**: Winston logger for debugging

---

*Last Updated: March 11, 2026*
