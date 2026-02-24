# Board Games Backend - Setup & Deployment Guide

## Project Overview

This is a Python FastAPI backend for the Board Games event management system. It provides RESTful APIs for:
- User authentication and management
- Board game catalog (standard and custom games)
- Event creation and management
- Game queue management (admin controlled)
- Shared game instances tracking

## Tech Stack

- **Framework**: FastAPI (modern, fast, with automatic OpenAPI/Swagger docs)
- **Database**: SQLAlchemy ORM with SQLite (development) / PostgreSQL (production)
- **Authentication**: JWT (JSON Web Tokens)
- **ORM**: SQLAlchemy
- **Validation**: Pydantic
- **Server**: Uvicorn
- **Security**: Python-jose, Passlib (bcrypt password hashing)

## Directory Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI app setup
│   ├── config.py                # Settings and configuration
│   ├── database.py              # Database connection and session management
│   ├── models/                  # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── user.py             # User model with roles
│   │   ├── game.py             # BoardGame and CustomGame models
│   │   ├── game_instance.py    # SharedGameInstance model
│   │   ├── game_queue.py       # GameQueueItem model
│   │   └── event.py            # Event model
│   ├── schemas/                 # Pydantic validation models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── game.py
│   │   ├── event.py
│   │   └── game_queue.py
│   ├── routes/                  # API route handlers
│   │   ├── __init__.py
│   │   ├── auth.py             # Register/login endpoints
│   │   ├── users.py            # User CRUD endpoints
│   │   ├── games.py            # Game CRUD endpoints
│   │   ├── events.py           # Event CRUD endpoints
│   │   └── game_queue.py       # Queue management endpoints
│   └── utils/
│       ├── __init__.py
│       └── auth.py             # JWT and password utilities
├── .env                         # Environment variables (local)
├── .env.example                 # Example environment file
├── .gitignore                   # Git ignore rules
├── requirements.txt             # Python dependencies
├── run.py                       # Application startup script
├── init_db.py                   # Database initialization with sample data
├── test_api.py                  # Basic API test script
└── README.md                    # Documentation
```

## Quick Start

### Prerequisites
- Python 3.9 or higher
- pip package manager
- Virtual environment (recommended: venv or conda)

### Installation Steps

1. **Create and activate virtual environment:**
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Set up environment variables:**
```bash
# Copy example file
cp .env.example .env

# (Optional) Edit .env if you want to change settings
```

4. **Initialize database with sample data:**
```bash
python init_db.py
```

5. **Run the development server:**
```bash
python run.py
```

The server will start at `http://localhost:8000`

### Access API Documentation

Once the server is running, visit:
- **Swagger UI** (interactive): http://localhost:8000/docs
- **ReDoc** (readable): http://localhost:8000/redoc

## API Endpoints

### Authentication

```
POST /auth/register
  - Register new user
  - Body: {name, email, password, phone?, bio?, home_address?}
  - Returns: {access_token, user}

POST /auth/login
  - Login with email and password
  - Body: {email, password}
  - Returns: {access_token, user}
```

### Users

```
GET /users
  - List all users
  - Returns: [{user}, ...]

GET /users/me
  - Get current logged-in user
  - Auth: Required
  - Returns: {user}

GET /users/{user_id}
  - Get specific user by ID
  - Returns: {user}

PUT /users/{user_id}
  - Update user (self or admin only)
  - Auth: Required
  - Body: {name?, email?, phone?, bio?, home_address?}
  - Returns: {user}

DELETE /users/{user_id}
  - Delete user (admin only)
  - Auth: Required
  - Returns: 204 No Content
```

### Games

```
GET /games/board-games
  - List all standard board games
  - Returns: [{game}, ...]

POST /games/board-games
  - Create board game (admin only)
  - Auth: Required (admin)
  - Body: {id, name, description?, length_in_minutes?, valid_player_counts}
  - Returns: {game}

GET /games/custom-games
  - List all custom games
  - Returns: [{game}, ...]

POST /games/custom-games
  - Create custom game
  - Auth: Required
  - Body: {name, valid_player_counts, length_in_minutes?}
  - Returns: {game}

GET /games/custom-games/{game_id}
  - Get custom game by ID
  - Returns: {game}

PUT /games/custom-games/{game_id}
  - Update custom game (creator or admin only)
  - Auth: Required
  - Body: {name?, valid_player_counts?, length_in_minutes?}
  - Returns: {game}

DELETE /games/custom-games/{game_id}
  - Delete custom game (creator or admin only)
  - Auth: Required
  - Returns: 204 No Content

GET /games/shared-instances
  - List all shared game instances
  - Returns: [{instance}, ...]

POST /games/shared-instances
  - Add game instance to shared collection
  - Auth: Required
  - Query: ?game_id=X or ?custom_game_id=X
  - Returns: {instance}
```

### Events

```
GET /events
  - List all events (ordered by date)
  - Returns: [{event}, ...]

POST /events
  - Create new event
  - Auth: Required
  - Body: {date_time, location, estimated_length_in_minutes?}
  - Returns: {event}

GET /events/{event_id}
  - Get event by ID
  - Returns: {event}

PUT /events/{event_id}
  - Update event (organizer or admin only)
  - Auth: Required
  - Body: {date_time?, location?, estimated_length_in_minutes?, selected_games?, registered_players?}
  - Returns: {event}

DELETE /events/{event_id}
  - Delete event (organizer or admin only)
  - Auth: Required
  - Returns: 204 No Content
```

### Game Queue

```
GET /game-queue
  - List queue items (ordered by position)
  - Returns: [{item}, ...]

POST /game-queue
  - Add game to queue (any user)
  - Auth: Required
  - Body: {game_id, game_instance_id}
  - Returns: {item}

POST /game-queue/reorder
  - Reorder queue items (admin only)
  - Auth: Required (admin)
  - Body: {items: [{id, queue_position}, ...]}
  - Returns: {message}

DELETE /game-queue/{queue_item_id}
  - Remove item from queue (admin only)
  - Auth: Required (admin)
  - Returns: 204 No Content
```

## Database

### SQLite (Development)
Default configuration. Database file: `boardgames.db`

### PostgreSQL (Production)
To use PostgreSQL:
1. Install PostgreSQL and create a database
2. Update `.env`:
```
DATABASE_URL=postgresql://user:password@localhost/boardgames
```
3. Install psycopg2: `pip install psycopg2-binary`
4. Run migrations and start server

## Authentication

### How JWT Authentication Works

1. **Register/Login** → Get `access_token`
2. **API Requests** → Include token in `Authorization` header:
```
Authorization: Bearer {token}
```
3. Server verifies token → Responds with data or 401 Unauthorized

### Token Expiration
Default: 30 minutes (configurable in `.env` via `ACCESS_TOKEN_EXPIRE_MINUTES`)

### User Roles
- **user**: Regular user (default)
- **head-admin**: Administrator with elevated permissions

## Testing

### Run API Tests
```bash
python test_api.py
```

This runs basic tests against running API endpoints.

### Manual Testing with Swagger
Visit http://localhost:8000/docs and test endpoints directly in the interface.

### Sample Credentials (after running init_db.py)
- **Email**: john@example.com
- **Password**: password123
- **Role**: head-admin

## Production Deployment

### Before Deploying:
1. **Change SECRET_KEY** in `.env` - use strong random value
```bash
# Generate secure key
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

2. **Set DEBUG=False** in `.env`

3. **Use PostgreSQL** instead of SQLite

4. **Enable HTTPS** (use reverse proxy like nginx)

### Docker Deployment
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
CMD ["python", "run.py"]
```

Build and run:
```bash
docker build -t boardgames-api .
docker run -p 8000:8000 boardgames-api
```

### Using Gunicorn (Production WSGI)
```bash
pip install gunicorn
gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## Troubleshooting

### "Database is locked" error
- SQLite limitation in concurrent access
- Use PostgreSQL for production

### "Module not found" errors
- Ensure virtual environment is activated
- Run `pip install -r requirements.txt` again

### CORS errors in frontend
- Check `CORS_ORIGINS` in `app/config.py`
- Add your frontend URL if not present

### Token authentication fails
- Ensure token is in `Authorization: Bearer {token}` format
- Check token hasn't expired
- Verify SECRET_KEY matches between auth and verification

## Database Schema

### Users Table
- id (string)
- name (string)
- email (string, unique)
- password_hash (string)
- phone (string)
- bio (string)
- home_address (string)
- role (string: "user" or "head-admin")
- created_at (datetime)
- updated_at (datetime)

### Board Games & Custom Games
- Board Games: Standard games in collection
- Custom Games: User-created games with creator_id

### Shared Game Instances
- Tracks which games are shared and who contributed them
- Supports both board games and custom games

### Game Queue
- Ordered list of games for selection
- Admin can reorder/remove
- Any user can add

### Events
- date_time (required)
- location (auto-filled from organizer's home_address)
- selected_games (array)
- registered_players (array)

## Development Tips

### Adding New Endpoints
1. Create model in `app/models/`
2. Create schema in `app/schemas/`
3. Create route in `app/routes/`
4. Import and register in `app/main.py`

### Environment Variables
Edit `.env` file to change settings without modifying code.

### Database Queries
Use SQLAlchemy ORM instead of raw SQL:
```python
db.query(User).filter(User.email == "test@example.com").first()
```

## Performance Notes

- Database indexes created on frequently queried fields
- JWT tokens are stateless (no database lookup per request)
- Consider Redis caching for production

## Security Considerations

✓ Passwords hashed with bcrypt
✓ JWT tokens with expiration
✓ Role-based access control
✓ CORS properly configured
✓ SQL injection prevention (SQLAlchemy ORM)

For production:
- Use HTTPS only
- Set strong SECRET_KEY
- Enable HTTPS CORS only
- Consider rate limiting
- Add request validation logging

## Support & Issues

For issues:
1. Check logs in terminal
2. Verify database is initialized: `python init_db.py`
3. Ensure dependencies installed: `pip install -r requirements.txt`
4. Check `.env` configuration
5. Use `test_api.py` to verify basic connectivity

## Future Enhancements

- [ ] Email verification for registration
- [ ] Password reset functionality
- [ ] WebSocket support for real-time updates
- [ ] File uploads (game images/avatars)
- [ ] Advanced search and filtering
- [ ] Analytics and reporting
- [ ] Background job queue (Celery)
- [ ] Caching layer (Redis)
- [ ] API rate limiting
- [ ] Full test suite with pytest
- [ ] CI/CD integration
- [ ] Kubernetes deployment configs
