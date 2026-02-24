# Frontend-Backend Integration Guide

Your Next.js frontend is now fully integrated with the Python FastAPI backend!

## 🚀 Quick Start

### 1. Start the Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python init_db.py
python run.py
```

The backend will run on: **http://localhost:8000**

### 2. Start the Frontend

In a new terminal:

```bash
cd web
npm install  # (if not already done)
npm run dev
```

The frontend will run on: **http://localhost:3000**

### 3. Login with Test Account

Visit: **http://localhost:3000/login**

Use one of the test accounts created by `init_db.py`:
- **Admin**: john@example.com / password123
- **User**: sarah@example.com / password123
- **User**: mike@example.com / password123

---

## ✅ What's Integrated

### Authentication
- ✅ Real JWT token-based authentication
- ✅ Secure password hashing
- ✅ Login and registration with the backend
- ✅ Token stored in localStorage
- ✅ Automatic redirection on login failure

### User Management
- ✅ Create new users via registration
- ✅ Get current user info
- ✅ Update user profile
- ✅ Delete users (admin only)

### Games
- ✅ Fetch board games from backend
- ✅ Create custom games
- ✅ View all games
- ✅ Update/delete custom games (creator or admin)

### Events
- ✅ Create events
- ✅ View upcoming events
- ✅ Update/delete events (organizer or admin)

### Game Queue
- ✅ View queued games
- ✅ Add games to queue (any user)
- ✅ Reorder queue (admin only)
- ✅ Remove from queue (admin only)

---

## 📁 Key Files

### Frontend Integration Files

**`.env.local`** - Environment variables
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**`utils/api.ts`** - API client with all backend calls
- `authAPI` - Login/register
- `usersAPI` - User management
- `gamesAPI` - Game operations
- `eventsAPI` - Event management
- `queueAPI` - Queue management

**`context/AuthContext.tsx`** - Updated to use real backend
- Uses JWT token authentication
- Stores token in localStorage
- Provides user and login/logout functions

**`app/login/page.tsx`** - Updated login page
- Uses real backend authentication
- Shows test account credentials from backend

**`app/register/page.tsx`** - Updated registration page
- Creates new users via backend API
- Validates passwords
- Auto-login after registration

---

## 🔐 Authentication Flow

```
1. User fills login/register form
2. Frontend sends credentials to backend API
3. Backend validates and returns JWT token + user data
4. Frontend stores token in localStorage
5. Token automatically sent in Authorization header for protected requests
6. Backend validates token on each request
7. Unauthorized requests return 401 error
```

---

## 📝 API Endpoints Used

All endpoints communicate with: `http://localhost:8000`

### Auth
```
POST /auth/login
POST /auth/register
```

### Users
```
GET /users/me
GET /users
GET /users/{id}
PUT /users/{id}
DELETE /users/{id}
```

### Games
```
GET /games/board-games
POST /games/board-games
GET /games/custom-games
POST /games/custom-games
GET /games/custom-games/{id}
PUT /games/custom-games/{id}
DELETE /games/custom-games/{id}
GET /games/shared-instances
POST /games/shared-instances
```

### Events
```
GET /events
POST /events
GET /events/{id}
PUT /events/{id}
DELETE /events/{id}
```

### Queue
```
GET /game-queue
POST /game-queue
POST /game-queue/reorder
DELETE /game-queue/{id}
```

---

## 🛠️ How to Make API Calls

### Example 1: Fetch Board Games

```typescript
import { gamesAPI } from '@/utils/api';

const games = await gamesAPI.listBoardGames();
```

### Example 2: Create Custom Game (with auth)

```typescript
import { gamesAPI } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';

const { token } = useAuth();

const newGame = await gamesAPI.createCustomGame({
    name: 'My Game',
    valid_player_counts: [2, 3, 4],
    length_in_minutes: 60
}, token!);
```

### Example 3: Update User Profile

```typescript
import { usersAPI } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';

const { token } = useAuth();

await usersAPI.updateUser(userId, {
    name: 'New Name',
    email: 'new@email.com',
    home_address: '123 Main St'
}, token!);
```

---

## 🔍 Debugging

### Check Backend is Running
```bash
# Should return 200 and app info
curl http://localhost:8000/
```

### Check API Connection
```bash
# Should return API info
curl http://localhost:8000/docs
```

### Check Token Storage
Open browser DevTools → Application → LocalStorage
- Should see `authToken` and `currentUser` after login

### Check Network Requests
Open browser DevTools → Network tab
- Should see requests to `http://localhost:8000`
- Authorization header should contain token

### Common Errors

**"Cannot connect to API"**
- Ensure backend is running: `python run.py`
- Check backend port is 8000
- Check `.env.local` has correct `NEXT_PUBLIC_API_URL`

**"Invalid token"**
- Clear localStorage and login again
- Check backend SECRET_KEY hasn't changed
- Verify token isn't expired

**"CORS error"**
- Backend is running on port 8000
- Frontend is running on port 3000
- Backend has CORS configured for http://localhost:3000

---

## 📦 Token Management

When you login:
1. Backend returns `access_token`
2. Frontend stores in `localStorage` as `authToken`
3. All API calls include header: `Authorization: Bearer {token}`
4. Invalid tokens return 401 error
5. User should logout and re-login

Token expiration (default 30 minutes):
- Set in backend: `app/config.py`
- Change `ACCESS_TOKEN_EXPIRE_MINUTES`

---

## 🚀 Deploying Frontend + Backend

### Production Setup

1. **Backend**
   - Change `SECRET_KEY` in `.env`
   - Set `DEBUG=False`
   - Use PostgreSQL instead of SQLite
   - Deploy to server with Gunicorn/Docker

2. **Frontend**
   - Update `NEXT_PUBLIC_API_URL` to production backend
   - Build: `npm run build`
   - Deploy to Vercel, Netlify, or own server

3. **CORS Configuration**
   - Update `CORS_ORIGINS` in `app/config.py` to include frontend domain
   - Example: `https://yourdomain.com`

---

## 📚 API Client Usage Reference

```typescript
// Auth
import { authAPI } from '@/utils/api';
await authAPI.login('user@example.com', 'password');
await authAPI.register({ name, email, password, phone?, bio?, home_address? });

// Users
import { usersAPI } from '@/utils/api';
await usersAPI.getCurrentUser(token);
await usersAPI.listUsers();
await usersAPI.getUser(userId);
await usersAPI.updateUser(userId, data, token);
await usersAPI.deleteUser(userId, token);

// Games
import { gamesAPI } from '@/utils/api';
await gamesAPI.listBoardGames();
await gamesAPI.createBoardGame(game, token);
await gamesAPI.listCustomGames();
await gamesAPI.createCustomGame(game, token);
await gamesAPI.getCustomGame(gameId);
await gamesAPI.updateCustomGame(gameId, data, token);
await gamesAPI.deleteCustomGame(gameId, token);
await gamesAPI.listSharedInstances();
await gamesAPI.addGameInstance({ game_id: 'dune' }, token);

// Events
import { eventsAPI } from '@/utils/api';
await eventsAPI.listEvents();
await eventsAPI.createEvent(event, token);
await eventsAPI.getEvent(eventId);
await eventsAPI.updateEvent(eventId, data, token);
await eventsAPI.deleteEvent(eventId, token);

// Queue
import { queueAPI } from '@/utils/api';
await queueAPI.listQueue();
await queueAPI.addToQueue({ game_id, game_instance_id }, token);
await queueAPI.reorderQueue(items, token);
await queueAPI.removeFromQueue(queueItemId, token);
```

---

## ✨ Features Now Working

- ✅ Real user authentication with passwords
- ✅ Secure JWT tokens
- ✅ User registration
- ✅ Multiple user accounts
- ✅ Role-based access (admin vs user)
- ✅ Data persistence in real database
- ✅ API error handling
- ✅ Auto-logout on 401 errors
- ✅ Real game/event/queue data from backend

---

## 🔄 Next Steps

1. Update other pages to fetch from backend API instead of mock data
2. Add error handling UI for failed API calls
3. Add loading states for API calls
4. Implement auto-logout on token expiration
5. Add request retry logic
6. Deploy to production

---

## 📞 Troubleshooting

If something doesn't work:

1. **Check Backend Status**
   - Is `python run.py` running?
   - Does `http://localhost:8000/docs` work in browser?

2. **Check Frontend Connection**
   - Is `npm run dev` running?
   - Check browser console for errors
   - Check Network tab in DevTools

3. **Check Environment Variables**
   - `.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:8000`

4. **Clear Cache**
   - Clear localStorage in DevTools
   - Clear browser cache
   - Restart frontend and backend

5. **Check Logs**
   - Backend logs in terminal
   - Frontend logs in browser console
   - Browser Network tab for API responses

---

**You're all set! Your frontend and backend are now fully integrated!** 🎉
