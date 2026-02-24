"""Script to initialize the database with sample data."""
import sys
from sqlalchemy.orm import Session
from app.database import SessionLocal, init_db, engine
from app.models import User, BoardGame, CustomGame, SharedGameInstance, GameQueueItem, Event
from app.utils.auth import hash_password
from datetime import datetime, timedelta
import uuid


def init_sample_data():
    """Initialize database with sample data."""
    # Create tables
    init_db()
    
    db = SessionLocal()
    
    try:
        # Check if data already exists
        if db.query(User).count() > 0:
            print("Database already initialized with users. Skipping...")
            return
        
        # Create sample users
        user1 = User(
            id="user-1",
            name="John Smith",
            email="john@example.com",
            password_hash=hash_password("password123"),
            phone="555-0101",
            bio="Board game enthusiast for 10 years",
            home_address="123 Main St, New York, NY 10001",
            role="head-admin"
        )
        
        user2 = User(
            id="user-2",
            name="Sarah Johnson",
            email="sarah@example.com",
            password_hash=hash_password("password123"),
            phone="555-0102",
            bio="Love strategy games",
            home_address="456 Oak Ave, Boston, MA 02101",
            role="user"
        )
        
        user3 = User(
            id="user-3",
            name="Mike Chen",
            email="mike@example.com",
            password_hash=hash_password("password123"),
            phone="555-0103",
            home_address="789 Elm St, San Francisco, CA 94102",
            role="user"
        )
        
        db.add_all([user1, user2, user3])
        db.commit()
        print("✓ Created sample users")
        
        # Create board games
        board_games = [
            BoardGame(
                id="dune",
                name="Dune",
                description="A strategic game of politics and intrigue",
                length_in_minutes=120,
                valid_player_counts=[1, 3, 4, 6]
            ),
            BoardGame(
                id="catan",
                name="Catan",
                description="Build settlements on the island of Catan",
                length_in_minutes=60,
                valid_player_counts=[3, 4]
            ),
            BoardGame(
                id="carcassonne",
                name="Carcassonne",
                description="Build a medieval landscape tile by tile",
                length_in_minutes=45,
                valid_player_counts=[2, 3, 4, 5, 6]
            ),
            BoardGame(
                id="ticket_to_ride",
                name="Ticket to Ride",
                description="Claim railway routes across continents",
                length_in_minutes=90,
                valid_player_counts=[2, 3, 4, 5]
            ),
            BoardGame(
                id="azul",
                name="Azul",
                description="Create beautiful tile patterns",
                length_in_minutes=30,
                valid_player_counts=[2, 3, 4]
            )
        ]
        
        db.add_all(board_games)
        db.commit()
        print("✓ Created board games")
        
        # Create custom game
        custom_game = CustomGame(
            id="custom-1",
            name="Homebrew Dice Game",
            valid_player_counts=[2, 3, 4],
            length_in_minutes=45,
            creator_id="user-2"
        )
        
        db.add(custom_game)
        db.commit()
        print("✓ Created custom games")
        
        # Create shared game instances
        instances = [
            SharedGameInstance(id="shared-1", game_id="dune", contributor_id="user-1"),
            SharedGameInstance(id="shared-2", game_id="catan", contributor_id="user-1"),
            SharedGameInstance(id="shared-3", game_id="ticket_to_ride", contributor_id="user-1"),
            SharedGameInstance(id="shared-4", game_id="carcassonne", contributor_id="user-2"),
            SharedGameInstance(id="shared-5", game_id="azul", contributor_id="user-2"),
            SharedGameInstance(id="shared-6", game_id="catan", contributor_id="user-2"),
            SharedGameInstance(id="shared-custom-1", custom_game_id="custom-1", contributor_id="user-2"),
        ]
        
        db.add_all(instances)
        db.commit()
        print("✓ Created shared game instances")
        
        # Create game queue items
        queue_items = [
            GameQueueItem(
                id="queue-1",
                game_id="dune",
                game_instance_id="shared-1",
                added_by_user_id="user-1",
                queue_position=0
            ),
            GameQueueItem(
                id="queue-2",
                game_id="catan",
                game_instance_id="shared-2",
                added_by_user_id="user-1",
                queue_position=1
            ),
            GameQueueItem(
                id="queue-3",
                game_id="carcassonne",
                game_instance_id="shared-4",
                added_by_user_id="user-2",
                queue_position=2
            ),
        ]
        
        db.add_all(queue_items)
        db.commit()
        print("✓ Created game queue items")
        
        # Create events
        now = datetime.utcnow()
        events = [
            Event(
                id="event-1",
                date_time=now + timedelta(days=7),
                location="123 Main St, New York, NY 10001",
                organizer_id="user-1",
                registered_players=["user-1", "user-2"]
            ),
            Event(
                id="event-2",
                date_time=now + timedelta(days=14),
                location="456 Oak Ave, Boston, MA 02101",
                organizer_id="user-2",
                registered_players=["user-2", "user-3"]
            ),
        ]
        
        db.add_all(events)
        db.commit()
        print("✓ Created sample events")
        
        print("\n✅ Database initialized successfully!")
        print("\nSample Users:")
        print("  - john@example.com / password123 (admin)")
        print("  - sarah@example.com / password123 (user)")
        print("  - mike@example.com / password123 (user)")
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    init_sample_data()
