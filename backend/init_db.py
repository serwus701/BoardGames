"""Script to initialize the database with sample data."""
import sys
from datetime import datetime, timedelta, timezone

from app.database import SessionLocal, init_db
from app.models import User, BoardGame, Event, EventRegistration
from app.utils.auth import hash_password


def init_sample_data():
    """Initialize database with sample data."""
    init_db()
    db = SessionLocal()

    try:
        if db.query(User).count() > 0:
            print("Database already initialized with users. Skipping...")
            return

        user1 = User(
            name="Michaś",
            email="serwus701@gmail.com",
            password_hash=hash_password("pass123"),
            bio="Board game enthusiast for 10 years",
            home_address="stalowo",
            role="head-admin",
        )
        user2 = User(
            name="Kacper",
            email="kacper4553@gmail.com",
            password_hash=hash_password("pass123"),
            bio="Love strategy games",
            home_address="Dokerska",
            role="head-admin",
        )
        user3 = User(
            name="Edi",
            email="mike@oxlong.com",
            password_hash=hash_password("pass123"),
            home_address="Jugosłowiańska",
            role="user",
        )
        user4 = User(
            name="Ludi",
            email="mike@oxshort.com",
            password_hash=hash_password("pass123"),
            bio="Party game enthusiast",
            home_address="Grunwald",
            role="user",
        )
        user5 = User(
            name="Vanessa",
            email="noc@ox.com",
            password_hash=hash_password("pass123"),
            bio="Euro games specialist",
            home_address="Grunwald",
            role="user",
        )
        user6 = User(
            name="Bucket",
            email="ligma@balls.com",
            password_hash=hash_password("pass123"),
            bio="Euro games specialist",
            home_address="żegie",
            role="user",
        )

        db.add_all([user1, user2, user3, user4, user5, user6])
        db.commit()
        for u in (user1, user2, user3, user4, user5, user6):
            db.refresh(u)
        print("✓ Created sample users")

        game1 = BoardGame(
            name="Dune",
            description="A strategic game of politics and intrigue",
            length_in_minutes=120,
            player_count_type="exact",
            valid_player_counts=[1, 3, 4, 6],
            creator_id=1
        )
        game2 = BoardGame(
            name="Catan",
            description="Build settlements on the island of Catan",
            length_in_minutes=60,
            player_count_type="exact",
            valid_player_counts=[3, 4],
            creator_id=1
        )
        game3 = BoardGame(
            name="Carcassonne",
            description="Build a medieval landscape tile by tile",
            length_in_minutes=45,
            player_count_type="minMax",
            min_players=2,
            max_players=6,
            creator_id=1

        )
        game4 = BoardGame(
            name="Ticket to Ride",
            description="Claim railway routes across continents",
            length_in_minutes=90,
            player_count_type="minMax",
            min_players=2,
            max_players=5,
            creator_id=1

        )
        game5 = BoardGame(
            name="Azul",
            description="Create beautiful tile patterns",
            length_in_minutes=30,
            player_count_type="exact",
            valid_player_counts=[2, 3, 4],
            creator_id=1

        )
        game6 = BoardGame(
            name="Wingspan",
            description="Build the best bird sanctuary",
            length_in_minutes=70,
            player_count_type="minMax",
            min_players=1,
            max_players=5,
            creator_id=1

        )
        game7 = BoardGame(
            name="7 Wonders",
            description="Lead your civilization to greatness",
            length_in_minutes=30,
            player_count_type="minMax",
            min_players=2,
            max_players=7,
            creator_id=1

        )
        game8 = BoardGame(
            name="Pandemic",
            description="Save humanity from deadly diseases",
            length_in_minutes=45,
            player_count_type="minMax",
            min_players=2,
            max_players=4,
            creator_id=1

        )
        game9 = BoardGame(
            name="Codenames",
            description="Word-based party game",
            length_in_minutes=15,
            player_count_type="minOnly",
            min_players=4,
            creator_id=1

        )
        game10 = BoardGame(
            name="Splendor",
            description="Become a Renaissance merchant",
            length_in_minutes=30,
            player_count_type="exact",
            valid_player_counts=[2, 3, 4],
            creator_id=1

        )

        db.add_all([game1, game2, game3, game4, game5, game6, game7, game8, game9, game10])
        db.commit()
        for g in (game1, game2, game3, game4, game5, game6, game7, game8, game9, game10):
            db.refresh(g)
        print("✓ Created board games")

        # --- Custom (user) game ---
        custom_game = BoardGame(
            name="Homebrew Dice Game",
            player_count_type="exact",
            valid_player_counts=[2, 3, 4],
            length_in_minutes=45,
            creator_id=user2.id,
        )
        db.add(custom_game)
        db.commit()
        db.refresh(custom_game)
        print("✓ Created custom (user) games")

        # --- Events ---
        now = datetime.now(timezone.utc)
        event1 = Event(
            date_time=now + timedelta(days=7),
            location="stalowo",
            organizer_id=user1.id,
            estimated_length_in_minutes=120,
        )
        event2 = Event(
            date_time=now + timedelta(days=14),
            location="Dokerska",
            organizer_id=user2.id,
            estimated_length_in_minutes=180,
        )

        db.add_all([event1, event2])
        db.commit()
        db.refresh(event1)
        db.refresh(event2)

        event1.games = [game1, game2, custom_game]
        event2.games = [game3, game5]

        db.commit()
        db.refresh(event1)
        db.refresh(event2)

        print("✓ Assigned games to events")

        # --- Registrations ---
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

    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    init_sample_data()