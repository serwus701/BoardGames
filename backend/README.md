# Board Games Backend API

Python FastAPI backend for the Board Games event management system.

## Quick Start

### Prerequisites
- Python 3.9+
- pip

### Installation

1. **Create virtual environment:**
```bash
python -m venv venv
source venv/Scripts/activate  # Windows
source venv/bin/activate      # macOS/Linux
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Create .env file:**
```bash
cp .env.example .env
```

4. **Run the server:**
```bash
python run.py
```

The API will be available at `http://localhost:8000`

### API Documentation

Once running, visit:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application setup
│   ├── config.py            # Configuration (settings)
│   ├── database.py          # Database setup & session management
│   ├── models/              # SQLAlchemy ORM models
│   │   ├── user.py
│   │   ├── game.py
│   │   ├── game_instance.py
│   │   ├── game_queue.py
│   │   └── event.py
│   ├── schemas/             # Pydantic models (validation & serialization)
│   │   ├── user.py
│   │   ├── game.py
│   │   ├── event.py
│   │   └── game_queue.py
│   ├── routes/              # API endpoints
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── games.py
│   │   ├── events.py
│   │   └── game_queue.py
│   └── utils/               # Utility functions
│       └── auth.py
├── run.py                   # Application entry point
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

### Users
- `GET /users` - List all users
- `GET /users/{user_id}` - Get user by ID
- `GET /users/me` - Get current user info
- `PUT /users/{user_id}` - Update user
- `DELETE /users/{user_id}` - Delete user (admin only)

### Games
- `GET /games/board-games` - List board games
- `POST /games/board-games` - Create board game
- `GET /games/custom-games` - List custom games
- `POST /games/custom-games` - Create custom game
- `GET /games/custom-games/{game_id}` - Get custom game
- `PUT /games/custom-games/{game_id}` - Update custom game
- `DELETE /games/custom-games/{game_id}` - Delete custom game
- `GET /games/shared-instances` - List shared instances
- `POST /games/shared-instances` - Add game instance

### Events
- `GET /events` - List all events
- `POST /events` - Create event
- `GET /events/{event_id}` - Get event by ID
- `PUT /events/{event_id}` - Update event
- `DELETE /events/{event_id}` - Delete event

### Game Queue
- `GET /game-queue` - List queue items
- `POST /game-queue` - Add game to queue
- `POST /game-queue/reorder` - Reorder queue (admin only)
- `DELETE /game-queue/{queue_item_id}` - Remove from queue (admin only)

## Development

### Running with auto-reload
```bash
python run.py
```

### Creating database tables
Tables are created automatically when the app starts.

### Database
Currently using SQLite (`boardgames.db`). To use PostgreSQL:
1. Update `DATABASE_URL` in `.env`
2. Install psycopg2: `pip install psycopg2-binary`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_token>
```

Tokens are obtained via login endpoint and expire based on `ACCESS_TOKEN_EXPIRE_MINUTES` setting.

## User Roles

- **user** - Regular user (can create custom games, add to queue, organize events)
- **head-admin** - Administrator (can manage queue priority, delete users, manage games)

## Future Enhancements

- [ ] Add database migrations with Alembic
- [ ] Implement more granular permission system
- [ ] Add email verification for registration
- [ ] Add WebSocket support for real-time queue updates
- [ ] Add file uploads for game images
- [ ] Implement caching with Redis
- [ ] Add comprehensive logging
- [ ] Deploy to production (Docker, Kubernetes, etc.)
