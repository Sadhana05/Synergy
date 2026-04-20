# Google और GitHub Login Integration Guide

यह guide आपको Synergy application में Google और GitHub OAuth login integrate करने के लिए complete setup दिखाता है।

## Backend Setup

### Required Packages

निम्नलिखित packages पहले से install हैं:
- `axios` - HTTP requests के लिए
- `google-auth-library` - Google token verification के लिए

```bash
cd backend
npm install google-auth-library axios
```

### Environment Variables (.env)

Backend में निम्नलिखित OAuth environment variables जोड़ें:

```env
# OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### Backend OAuth Routes

निम्नलिखित routes `/src/index.ts` में add किए गए हैं:

**POST /api/auth/google**
- Google ID token को verify करता है
- नया user create करता है या existing user को authenticate करता है
- JWT token return करता है

Request:
```json
{
  "token": "google_id_token"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "username": "username",
      "created_at": "2024-01-01T00:00:00Z"
    },
    "token": "jwt_token"
  }
}
```

**POST /api/auth/github**
- GitHub authorization code को exchange करता है access token के लिए
- GitHub user information fetch करता है
- नया user create करता है या existing user को authenticate करता है
- JWT token return करता है

Request:
```json
{
  "code": "github_authorization_code"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "username": "username",
      "created_at": "2024-01-01T00:00:00Z"
    },
    "token": "jwt_token"
  }
}
```

---

## Frontend Setup

### Required Packages

निम्नलिखित package frontend में install है:
- `@react-oauth/google` - Google OAuth integration के लिए

```bash
cd Frontend
npm install @react-oauth/google
```

### Environment Variables (.env)

Frontend में निम्नलिखित OAuth environment variables जोड़ें:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GITHUB_CLIENT_ID=your_github_client_id
```

### Frontend Components

#### AuthContext.tsx में नए methods:

- `loginWithGoogle(token: string)` - Google login handle करता है
- `loginWithGitHub(code: string)` - GitHub login handle करता है

#### authService.ts में नए methods:

- `loginWithGoogle(googleToken: string)` - Backend को Google token भेजता है
- `loginWithGitHub(githubCode: string)` - Backend को GitHub code भेजता है

#### SignIn.tsx

SignIn page में OAuth buttons add किए गए हैं:

- **Google Button**: Google sign-in को trigger करता है
- **GitHub Button**: GitHub OAuth flow को trigger करता है

#### GitHubCallback.tsx

यह page GitHub OAuth callback को handle करता है:
- Authorization code को extract करता है
- Backend को code भेजता है
- Authentication complete होने पर dashboard पर redirect करता है

### Frontend Routes

App.tsx में निम्नलिखित route add किया गया है:

```
/auth/github/callback - GitHub OAuth callback handler
```

---

## Google OAuth Setup

### Step 1: Google Cloud Console में Project Create करें

1. [Google Cloud Console](https://console.cloud.google.com/) पर जाएं
2. नया project create करें
3. "OAuth consent screen" setup करें
4. "Create Credentials" → "OAuth 2.0 Client ID" select करें
5. Application type: Web application select करें

### Step 2: Authorized URIs Configure करें

**Authorized Redirect URIs:**
```
http://localhost:5173
http://localhost:3001
https://yourdomain.com (production के लिए)
```

**Authorized JavaScript origins:**
```
http://localhost:5173
http://localhost:3001
https://yourdomain.com (production के लिए)
```

### Step 3: Credentials Copy करें

1. Google Cloud Console से `Client ID` copy करें
2. `.env` file में `GOOGLE_CLIENT_ID` में paste करें
3. Frontend `.env` में `VITE_GOOGLE_CLIENT_ID` में भी paste करें

---

## GitHub OAuth Setup

### Step 1: OAuth App Create करें

1. [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/developers) पर जाएं
2. "New OAuth App" click करें
3. निम्नलिखित details fill करें:

**Application name:** Synergy

**Homepage URL:**
```
http://localhost:3001 (development)
https://yourdomain.com (production)
```

**Authorization callback URL:**
```
http://localhost:5173/auth/github/callback (development)
https://yourdomain.com/auth/github/callback (production)
```

### Step 2: Credentials Copy करें

1. GitHub OAuth App page से:
   - `Client ID` copy करें और `.env` में `GITHUB_CLIENT_ID` में paste करें
   - `Client Secret` copy करें और `.env` में `GITHUB_CLIENT_SECRET` में paste करें
2. Frontend `.env` में `VITE_GITHUB_CLIENT_ID` में भी Client ID paste करें

---

## Testing

### Local Testing

1. **Backend start करें:**
```bash
cd backend
npm run dev
```

2. **Frontend start करें:**
```bash
cd Frontend
npm run dev
```

3. **Sign In page पर जाएं:**
   - `http://localhost:5173/signin`

4. **Google Login Test करें:**
   - Google button click करें
   - Authenticate करें
   - Dashboard पर redirect होना चाहिए

5. **GitHub Login Test करें:**
   - GitHub button click करें
   - GitHub पर authenticate करें
   - `http://localhost:5173/auth/github/callback` पर redirect होगा
   - Dashboard पर redirect होना चाहिए

---

## Database Schema Changes

### Users Collection में नए fields:

```typescript
{
  id: string;
  email: string;
  username: string;
  password_hash?: string;  // OAuth users के लिए optional
  oauth_provider?: "google" | "github";  // OAuth provider name
  oauth_id?: string;       // OAuth unique ID
  avatar_url?: string;     // User profile picture URL
  created_at: string;
  updated_at: string;
}
```

---

## Security Notes

⚠️ **Important Security Practices:**

1. **Never commit secrets**: `.env` file को `.gitignore` में रखें
2. **Use HTTPS**: Production में सभी OAuth URIs HTTPS होने चाहिए
3. **Validate tokens**: पहले से ही backend verify करना चाहिए
4. **CSRF Protection**: CSRF tokens implement करें production में
5. **Rate Limiting**: OAuth endpoints को rate limit करें

---

## Troubleshooting

### Google Login काम नहीं कर रहा है

**समस्या:** "The OAuth client was not found"
- **समाधान:** `VITE_GOOGLE_CLIENT_ID` environment variable check करें

**समस्या:** CORS error
- **समाधान:** Frontend origin को Google Cloud Console में add करें

### GitHub Login काम नहीं कर रहा है

**समस्या:** "Invalid client_id or client_secret"
- **समाधान:** GitHub credentials को verify करें

**समस्या:** Unauthorized redirect_uri
- **समाधान:** GitHub OAuth App settings में callback URL verify करें

### Login के बाद redirect नहीं हो रहा है

**समस्या:** Dashboard पर redirect नहीं है
- **समाधान:** Browser console में errors check करें
- Auth token properly save हो रहा है यह check करें

---

## Production Deployment

### Environment Variables Update करें

Production `.env` में:

```env
GOOGLE_CLIENT_ID=production_google_client_id
GITHUB_CLIENT_ID=production_github_client_id
GITHUB_CLIENT_SECRET=production_github_client_secret
FRONTEND_ORIGIN=https://yourdomain.com
PUBLIC_BASE_URL=https://api.yourdomain.com
```

### OAuth Providers को Update करें

#### Google Cloud Console:

Authorized Redirect URIs में:
```
https://yourdomain.com
https://api.yourdomain.com
```

#### GitHub OAuth App:

Homepage URL:
```
https://yourdomain.com
```

Authorization callback URL:
```
https://yourdomain.com/auth/github/callback
```

---

## Additional Resources

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Documentation](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps)
- [JWT Documentation](https://jwt.io/)

---

**Last Updated:** March 2026
