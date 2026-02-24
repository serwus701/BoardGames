"""Script to initialize the database with sample data."""
import sys
from sqlalchemy.orm import Session
from app.database import SessionLocal, init_db, engine
from app.models import User, BoardGame, CustomGame, SharedGameInstance, GameQueueItem, Event, EventRegistration
from app.utils.auth import hash_password
from datetime import datetime, timedelta, timezone


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
            name="John Smith",
            email="john@example.com",
            password_hash=hash_password("pass123"),
            phone="555-0101",
            bio="Board game enthusiast for 10 years",
            home_address="123 Main St, New York, NY 10001",
            role="head-admin"
        )
        
        user2 = User(
            name="Sarah Johnson",
            email="sarah@example.com",
            password_hash=hash_password("pass123"),
            phone="555-0102",
            bio="Love strategy games",
            home_address="456 Oak Ave, Boston, MA 02101",
            role="user"
        )
        
        user3 = User(
            name="Mike Chen",
            email="mike@example.com",
            password_hash=hash_password("pass123"),
            phone="555-0103",
            home_address="789 Elm St, San Francisco, CA 94102",
            role="user"
        )
        
        user4 = User(
            name="Emily Davis",
            email="emily@example.com",
            password_hash=hash_password("pass123"),
            phone="555-0104",
            bio="Party game enthusiast",
            home_address="321 Pine St, Seattle, WA 98101",
            role="user"
        )
        
        user5 = User(
            name="Robert Wilson",
            email="robert@example.com",
            password_hash=hash_password("pass123"),
            phone="555-0105",
            bio="Euro games specialist",
            home_address="654 Cedar Ave, Portland, OR 97201",
            role="user"
        )
        
        db.add_all([user1, user2, user3, user4, user5])
        db.commit()
        db.refresh(user1)
        db.refresh(user2)
        db.refresh(user3)
        db.refresh(user4)
        db.refresh(user5)
        print("✓ Created sample users")
        
        # Create board games
        game1 = BoardGame(
            name="Dune",
            description="A strategic game of politics and intrigue",
            length_in_minutes=120,
            player_count_type='specific',
            valid_player_counts=[1, 3, 4, 6]
        )
        game2 = BoardGame(
            name="Catan",
            description="Build settlements on the island of Catan",
            length_in_minutes=60,
            player_count_type='specific',
            valid_player_counts=[3, 4]
        )
        game3 = BoardGame(
            name="Carcassonne",
            description="Build a medieval landscape tile by tile",
            length_in_minutes=45,
            player_count_type='range',
            min_players=2,
            max_players=6
        )
        game4 = BoardGame(
            name="Ticket to Ride",
            description="Claim railway routes across continents",
            length_in_minutes=90,
            player_count_type='range',
            min_players=2,
            max_players=5
        )
        game5 = BoardGame(
            name="Azul",
            description="Create beautiful tile patterns",
            length_in_minutes=30,
            player_count_type='specific',
            valid_player_counts=[2, 3, 4]
        )
        game6 = BoardGame(
            name="Wingspan",
            description="Build the best bird sanctuary",
            length_in_minutes=70,
            player_count_type='range',
            min_players=1,
            max_players=5
        )
        game7 = BoardGame(
            name="7 Wonders",
            description="Lead your civilization to greatness",
            length_in_minutes=30,
            player_count_type='range',
            min_players=2,
            max_players=7
        )
        game8 = BoardGame(
            name="Pandemic",
            description="Save humanity from deadly diseases",
            length_in_minutes=45,
            player_count_type='range',
            min_players=2,
            max_players=4
        )
        game9 = BoardGame(
            name="Codenames",
            description="Word-based party game",
            length_in_minutes=15,
            player_count_type='minimum',
            min_players=4
        )
        game10 = BoardGame(
            name="Splendor",
            description="Become a Renaissance merchant",
            length_in_minutes=30,
            player_count_type='specific',
            valid_player_counts=[2, 3, 4]
        )
        
        db.add_all([game1, game2, game3, game4, game5, game6, game7, game8, game9, game10])
        db.commit()
        db.refresh(game1)
        db.refresh(game2)
        db.refresh(game3)
        db.refresh(game4)
        db.refresh(game5)
        db.refresh(game6)
        db.refresh(game7)
        db.refresh(game8)
        db.refresh(game9)
        db.refresh(game10)
        print("✓ Created board games")
        
        # Create custom game
        custom_game = CustomGame(
            name="Homebrew Dice Game",
            player_count_type='specific',
            valid_player_counts=[2, 3, 4],
            length_in_minutes=45,
            creator_id=user2.id
        )
        
        db.add(custom_game)
        db.commit()
        db.refresh(custom_game)
        print("✓ Created custom games")
        
        # Create shared game instances
        instance1 = SharedGameInstance(game_id=game1.id, contributor_id=user1.id)
        instance2 = SharedGameInstance(game_id=game2.id, contributor_id=user1.id)
        instance3 = SharedGameInstance(game_id=game4.id, contributor_id=user1.id)
        instance4 = SharedGameInstance(game_id=game3.id, contributor_id=user2.id)
        instance5 = SharedGameInstance(game_id=game5.id, contributor_id=user2.id)
        instance6 = SharedGameInstance(game_id=game2.id, contributor_id=user2.id)
        instance7 = SharedGameInstance(custom_game_id=custom_game.id, contributor_id=user2.id)
        
        db.add_all([instance1, instance2, instance3, instance4, instance5, instance6, instance7])
        db.commit()
        db.refresh(instance1)
        db.refresh(instance2)
        db.refresh(instance4)
        print("✓ Created shared game instances")
        
        # Create game queue items
        queue1 = GameQueueItem(
            game_id=game1.id,
            game_instance_id=instance1.id,
            added_by_user_id=user1.id,
            queue_position=0
        )
        queue2 = GameQueueItem(
            game_id=game2.id,
            game_instance_id=instance2.id,
            added_by_user_id=user1.id,
            queue_position=1
        )
        queue3 = GameQueueItem(
            game_id=game3.id,
            game_instance_id=instance4.id,
            added_by_user_id=user2.id,
            queue_position=2
        )
        
        db.add_all([queue1, queue2, queue3])
        db.commit()
        print("✓ Created game queue items")
        
        # Create events
        now = datetime.now(timezone.utc)
        event1 = Event(
            date_time=now + timedelta(days=7),
            location="123 Main St, New York, NY 10001",
            organizer_id=user1.id
        )
        event2 = Event(
            date_time=now + timedelta(days=14),
            location="456 Oak Ave, Boston, MA 02101",
            organizer_id=user2.id
        )
        
        db.add_all([event1, event2])
        db.commit()
        db.refresh(event1)
        db.refresh(event2)
        
        # Register users for events
        reg1 = EventRegistration(event_id=event1.id, user_id=user1.id)
        reg2 = EventRegistration(event_id=event1.id, user_id=user2.id)
        reg3 = EventRegistration(event_id=event2.id, user_id=user2.id)
        reg4 = EventRegistration(event_id=event2.id, user_id=user3.id)
        
        db.add_all([reg1, reg2, reg3, reg4])
        db.commit()
        print("✓ Created sample events")
        
        print("\n✅ Database initialized successfully!")
        print("\nSample Users:")
        print("  - john@example.com / pass123 (admin)")
        print("  - sarah@example.com / pass123 (user)")
        print("  - mike@example.com / pass123 (user)")
        print("  - emily@example.com / pass123 (user)")
        print("  - robert@example.com / pass123 (user)")
        print("\nSample Data:")
        print("  - 10 board games with various player count types")
        print("  - 2 events with registrations")
        print("  - Multiple game instances and queue items")
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    init_sample_data()
