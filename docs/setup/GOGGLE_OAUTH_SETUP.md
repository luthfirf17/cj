# Google OAuth Setup Guide

## 📋 Prerequisites

1. **Google Cloud Console Account**: You need a Google Cloud Console account
2. **Google OAuth Credentials**: Client ID and Client Secret from Google
3. **Domain Configuration**: Your domain (catatjasamu.com) configured in Google Console

## 🔧 Google Cloud Console Setup

### 1. Create a New Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the required APIs:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
   - Search for "Google Calendar API" and enable it (for calendar integration)

### 2. Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure OAuth consent screen if not done yet
4. Choose "Web application" as application type
5. Add authorized redirect URIs:
   - For Google Login (production): `https://catatjasamu.com/api/auth/google/callback`
   - For Google Login (development): `http://localhost:5001/api/auth/google/callback`
   - For Google Calendar (production): `https://catatjasamu.com/api/user/google-calendar/callback`
   - For Google Calendar (development): `http://localhost:5001/api/user/google-calendar/callback`
6. Copy the Client ID and Client Secret

## ⚙️ Backend Configuration

### 1. Environment Variables
Update your `backend/.env` file with Google OAuth credentials:

```env
# Google OAuth (for Login)
GOOGLE_CLIENT_ID=429024417662-ts21hm4rte8dcsjge0vhqhhse82o7beo.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=https://catatjasamu.com/api/auth/google/callback

# Google Calendar API (for Calendar Integration)
# You can use the same credentials or create separate ones
GOOGLE_CALENDAR_CLIENT_ID=your_google_calendar_client_id
GOOGLE_CALENDAR_CLIENT_SECRET=your_google_calendar_client_secret
GOOGLE_CALENDAR_REDIRECT_URI=https://catatjasamu.com/api/user/google-calendar/callback

# Session
SESSION_SECRET=catat-jasamu-session-secret-2025

# Frontend URL (for redirects after OAuth)
FRONTEND_URL=https://catatjasamu.com
```

### 2. Database Migration
The database migration has been created and should be automatically applied when you run the application. It adds the following fields to the `users` table:

- `google_id` (VARCHAR(255), UNIQUE) - Google OAuth unique identifier
- `google_email` (VARCHAR(255)) - Email from Google OAuth
- `avatar_url` (TEXT) - Profile picture URL from Google
- `auth_provider` (VARCHAR(50)) - Authentication provider ('local' or 'google')

## 🚀 Frontend Configuration

### Environment Variables
Update your `frontend/.env` file:

```env
REACT_APP_API_URL=https://catatjasamu.com/api
# or for development
# REACT_APP_API_URL=http://localhost:5001/api
```

## 🔄 How Google OAuth Works

### 1. User Authentication Flow
1. User clicks "Masuk dengan Google" or "Daftar dengan Google"
2. User is redirected to Google OAuth consent screen
3. After consent, Google redirects back with authorization code
4. Backend exchanges code for user profile information
5. User is either logged in (existing user) or registered (new user)

### 2. Google Calendar Integration Flow
1. User must first login with Google OAuth
2. User clicks "Hubungkan Google Calendar" in the calendar modal
3. User is redirected to Google Calendar consent screen (separate from login)
4. After consent, Google redirects back with calendar authorization code
5. Backend stores calendar tokens (access_token, refresh_token) in database
6. User can now view, create, update, and delete calendar events

### 3. Account Linking
- **Existing Users**: If a user already exists with the same email, their Google account is linked
- **New Users**: A new account is created with Google profile information
- **Profile Updates**: Avatar URL is updated on each login if changed

### 3. Security Features
- JWT tokens are still used for API authentication
- Session management for OAuth flow
- Secure cookie settings for production
- CORS protection

## 🧪 Testing

### Development Testing
1. Start your backend server: `npm run dev`
2. Start your frontend: `npm run dev`
3. Visit `http://localhost:3000/login`
4. Click "Masuk dengan Google"
5. Complete OAuth flow

### Production Testing
1. Deploy your application to production
2. Update Google Console redirect URIs to production URL
3. Test the OAuth flow on your live domain

## 🔧 Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch"**
   - Check that your redirect URI in Google Console matches exactly
   - Include the full path: `https://catatjasamu.com/api/auth/google/callback`

2. **"invalid_client"**
   - Verify your Client ID and Client Secret are correct
   - Check that OAuth credentials are for a web application

3. **CORS Issues**
   - Ensure your frontend URL is in the CORS configuration
   - Check that credentials are set to true in CORS options

4. **Session Issues**
   - Make sure SESSION_SECRET is set
   - Check cookie settings for production (secure, httpOnly)

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV=development
```

## 📚 Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Passport.js Google Strategy](http://www.passportjs.org/packages/passport-google-oauth20/)
- [Google Cloud Console](https://console.cloud.google.com/)

## ✅ Checklist

### Google Login
- [ ] Google Cloud Console project created
- [ ] Google+ API enabled
- [ ] OAuth 2.0 credentials created
- [ ] Authorized redirect URIs configured (login)
- [ ] Client ID and Client Secret added to .env
- [ ] Database migration applied
- [ ] Frontend environment configured
- [ ] OAuth flow tested successfully

### Google Calendar Integration
- [ ] Google Calendar API enabled in Google Cloud Console
- [ ] Calendar redirect URI added to OAuth credentials
- [ ] GOOGLE_CALENDAR_* environment variables configured
- [ ] Calendar migration (012_add_google_oauth_tokens.sql) applied
- [ ] Calendar connection flow tested successfully
- [ ] Event CRUD operations working

---

**Note**: Make sure to keep your Client Secret secure and never commit it to version control. Use environment variables for all sensitive configuration.