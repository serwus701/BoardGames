# 🚀 Board Games API - Quick Setup

Your Python FastAPI backend is ready! Here's how to get it running in 5 minutes.

## Step 1: Set Up Virtual Environment

```bash
cd d:\Code\Private\BoardGames\backend

# Create virtual environment
python -m venv venv

# Activate it
venv\Scripts\activate
```

## Step 2: Install Dependencies

```bash
pip install -r requirements.txt
```

## Step 3: Initialize Database

```bash
python init_db.py
```

This creates the database with sample data and test users.

## Step 4: Run the Server

```bash
python run.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

## Step 5: Test the API

Open in browser: **http://localhost:8000/docs**

This is the Swagger UI where you can test all endpoints interactively!

## Quick Test: Login

1. Click **POST /auth/login**
2. Click "Try it out"
3. Enter:
   ```json
   {
     "email": "john@example.com",
     "password": "password123"
   }
   ```
4. Click "Execute"
5. You'll get a token - copy it!

## Using the Token

1. Click the **Authorize** button (top right)
2. Paste your token: `Bearer YOUR_TOKEN_HERE`
3. Click "Authorize"
4. Now you can access protected endpoints!

## Available Test Users

After running `init_db.py`, these users exist:

| Email | Password | Role |
|-------|----------|------|
| john@example.com | password123 | Admin |
| sarah@example.com | password123 | User |
| mike@example.com | password123 | User |

## Sample Data Included

✅ 5 Standard Board Games (Dune, Catan, Carcassonne, etc.)
✅ 1 Custom Game
✅ 2 Sample Events
✅ Game Queue with 3 items
✅ Shared game instances

## Key Features Working

- ✅ User Registration & Login (JWT Auth)
- ✅ User Management (CRUD)
- ✅ Board Games List
- ✅ Custom Games (create, update, delete)
- ✅ Events Management
- ✅ Game Queue Management
- ✅ Shared Game Instances
- ✅ Role-based Access Control (Admin vs User)
- ✅ Swagger API Documentation

## Important Files

- **app/main.py** - FastAPI application entry point
- **app/config.py** - Configuration and settings
- **app/models/** - Database models (User, Game, Event, etc.)
- **app/routes/** - API endpoint handlers
- **requirements.txt** - Python dependencies
- **init_db.py** - Database initialization script
- **.env** - Environment variables (SECRET_KEY, DATABASE_URL, etc.)

## Environment Variables

Edit `.env` to change:
- `SECRET_KEY` - JWT signing key (change in production!)
- `DATABASE_URL` - Database connection string
- `DEBUG` - Debug mode (set to False in production)
- `ACCESS_TOKEN_EXPIRE_MINUTES` - JWT token expiration time

## Connect Frontend to Backend

In your Next.js frontend, update API calls to point to:
```
http://localhost:8000
```

For example:
```typescript
const response = await fetch('http://localhost:8000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
})
```

## Production Checklist

Before deploying:
- [ ] Change `SECRET_KEY` in `.env`
- [ ] Set `DEBUG=False`
- [ ] Switch to PostgreSQL
- [ ] Enable HTTPS
- [ ] Set up proper CORS origins
- [ ] Configure reverse proxy (nginx/Apache)

See **DEPLOYMENT.md** for full production guide.

## Database

Currently using **SQLite** (automatic, no setup needed).

For production, use PostgreSQL:
1. Update `.env`: `DATABASE_URL=postgresql://user:pass@localhost/boardgames`
2. Install: `pip install psycopg2-binary`
3. Run server

## Troubleshooting

### "ModuleNotFoundError"
- Ensure virtual environment is activated
- Run `pip install -r requirements.txt`

### "Port 8000 already in use"
- Kill process: `lsof -ti:8000 | xargs kill -9`
- Or run on different port: `uvicorn app.main:app --port 8001`

### "Database is locked"
- Close other instances of the app
- Delete `boardgames.db` and run `init_db.py` again

### CORS errors
- Check `CORS_ORIGINS` in `app/config.py`
- Add your frontend URL if missing

## API Endpoints Quick Reference

```
Auth:
  POST   /auth/register          - Sign up new user
  POST   /auth/login             - Sign in with email/password

Users:
  GET    /users                  - List all users
  GET    /users/me               - Get current user
  GET    /users/{id}             - Get user by ID
  PUT    /users/{id}             - Update user
  DELETE /users/{id}             - Delete user

Games:
  GET    /games/board-games      - List standard games
  POST   /games/board-games      - Create board game (admin)
  GET    /games/custom-games     - List custom games
  POST   /games/custom-games     - Create custom game
  PUT    /games/custom-games/{id} - Update custom game
  DELETE /games/custom-games/{id} - Delete custom game

Events:
  GET    /events                 - List all events
  POST   /events                 - Create event
  GET    /events/{id}            - Get event
  PUT    /events/{id}            - Update event
  DELETE /events/{id}            - Delete event

Queue:
  GET    /game-queue             - List queue items
  POST   /game-queue             - Add to queue
  POST   /game-queue/reorder     - Reorder queue (admin)
  DELETE /game-queue/{id}        - Remove from queue (admin)
```

## More Help

📖 See **README.md** for full documentation
📖 See **DEPLOYMENT.md** for production setup
🔗 Visit http://localhost:8000/docs when server is running for interactive API docs

## Next Steps

1. ✅ Start the backend: `python run.py`
2. ✅ Test in Swagger: http://localhost:8000/docs
3. ✅ Connect your frontend to the API
4. ✅ Happy coding! 🎉

---

**Questions?** Check the logs in the terminal for error messages and detailed information.
