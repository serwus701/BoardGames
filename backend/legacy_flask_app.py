"""
Legacy Flask demo app (moved aside).

This file was the old Flask-based API that used different routes
and ports (e.g. `/api/board-games` on port 5001). It conflicted with
the FastAPI app in `run.py` which provides the actual backend used by
the frontend (`http://localhost:8000` with `/games/...` endpoints).

Kept here for reference. Do not run this file; run `python run.py` instead.
"""

from datetime import date
import os

from flask import Flask, jsonify, request
from sqlalchemy import Column, Date, ForeignKey, Integer, String, Text, create_engine
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "boardgames")

DATABASE_URL = (
    f"mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


class BoardGame(Base):
    __tablename__ = "board_games"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    length_minutes = Column(Integer, nullable=False)
    min_players = Column(Integer, nullable=False)
    max_players = Column(Integer, nullable=False)

    events = relationship("Event", back_populates="board_game", cascade="all, delete")


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    event_date = Column(Date, nullable=False)
    location = Column(String(200))
    notes = Column(Text)
    board_game_id = Column(Integer, ForeignKey("board_games.id"))

    board_game = relationship("BoardGame", back_populates="events")


def create_app() -> Flask:
    app = Flask(__name__)

    @app.get("/api/board-games")
    def list_board_games():
        with SessionLocal() as session:
            games = session.query(BoardGame).all()
            return jsonify([serialize_board_game(game) for game in games])

    @app.post("/api/board-games")
    def create_board_game():
        payload = request.get_json(silent=True) or {}
        missing = [
            field
            for field in ("name", "length_minutes", "min_players", "max_players")
            if field not in payload
        ]
        if missing:
            return jsonify({"error": "Missing fields", "fields": missing}), 400

        game = BoardGame(
            name=str(payload["name"]).strip(),
            length_minutes=int(payload["length_minutes"]),
            min_players=int(payload["min_players"]),
            max_players=int(payload["max_players"]),
        )

        with SessionLocal() as session:
            session.add(game)
            session.commit()
            session.refresh(game)
            return jsonify(serialize_board_game(game)), 201

    @app.get("/api/board-games/<int:game_id>")
    def get_board_game(game_id: int):
        with SessionLocal() as session:
            game = session.get(BoardGame, game_id)
            if not game:
                return jsonify({"error": "Board game not found"}), 404
            return jsonify(serialize_board_game(game))

    @app.put("/api/board-games/<int:game_id>")
    def update_board_game(game_id: int):
        payload = request.get_json(silent=True) or {}
        with SessionLocal() as session:
            game = session.get(BoardGame, game_id)
            if not game:
                return jsonify({"error": "Board game not found"}), 404

            for field in ("name", "length_minutes", "min_players", "max_players"):
                if field in payload:
                    value = payload[field]
                    if field == "name":
                        value = str(value).strip()
                    else:
                        value = int(value)
                    setattr(game, field, value)

            session.commit()
            session.refresh(game)
            return jsonify(serialize_board_game(game))

    @app.delete("/api/board-games/<int:game_id>")
    def delete_board_game(game_id: int):
        with SessionLocal() as session:
            game = session.get(BoardGame, game_id)
            if not game:
                return jsonify({"error": "Board game not found"}), 404
            session.delete(game)
            session.commit()
            return "", 204

    @app.get("/api/events")
    def list_events():
        with SessionLocal() as session:
            events = session.query(Event).all()
            return jsonify([serialize_event(event) for event in events])

    @app.post("/api/events")
    def create_event():
        payload = request.get_json(silent=True) or {}
        missing = [field for field in ("title", "event_date") if field not in payload]
        if missing:
            return jsonify({"error": "Missing fields", "fields": missing}), 400

        event = Event(
            title=str(payload["title"]).strip(),
            event_date=parse_date(payload["event_date"]),
            location=payload.get("location"),
            notes=payload.get("notes"),
            board_game_id=payload.get("board_game_id"),
        )

        with SessionLocal() as session:
            session.add(event)
            session.commit()
            session.refresh(event)
            return jsonify(serialize_event(event)), 201

    @app.get("/api/events/<int:event_id>")
    def get_event(event_id: int):
        with SessionLocal() as session:
            event = session.get(Event, event_id)
            if not event:
                return jsonify({"error": "Event not found"}), 404
            return jsonify(serialize_event(event))

    @app.put("/api/events/<int:event_id>")
    def update_event(event_id: int):
        payload = request.get_json(silent=True) or {}
        with SessionLocal() as session:
            event = session.get(Event, event_id)
            if not event:
                return jsonify({"error": "Event not found"}), 404

            if "title" in payload:
                event.title = str(payload["title"]).strip()
            if "event_date" in payload:
                event.event_date = parse_date(payload["event_date"])
            if "location" in payload:
                event.location = payload["location"]
            if "notes" in payload:
                event.notes = payload["notes"]
            if "board_game_id" in payload:
                event.board_game_id = payload["board_game_id"]

            session.commit()
            session.refresh(event)
            return jsonify(serialize_event(event))

    @app.delete("/api/events/<int:event_id>")
    def delete_event(event_id: int):
        with SessionLocal() as session:
            event = session.get(Event, event_id)
            if not event:
                return jsonify({"error": "Event not found"}), 404
            session.delete(event)
            session.commit()
            return "", 204

    return app


def parse_date(value: str) -> date:
    return date.fromisoformat(str(value))


def serialize_board_game(game: BoardGame) -> dict:
    return {
        "id": game.id,
        "name": game.name,
        "length_minutes": game.length_minutes,
        "min_players": game.min_players,
        "max_players": game.max_players,
    }


def serialize_event(event: Event) -> dict:
    return {
        "id": event.id,
        "title": event.title,
        "event_date": event.event_date.isoformat(),
        "location": event.location,
        "notes": event.notes,
        "board_game_id": event.board_game_id,
    }


if __name__ == "__main__":
    print("This is a legacy Flask app kept for reference. Run `python run.py` to start the FastAPI server on port 8000.")
