from datetime import datetime, timedelta, UTC

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, cast, String, not_
from sqlalchemy.orm import Session, joinedload
from typing import List

from sqlalchemy.sql.elements import or_, and_

from app.database import get_db
from app.models import BoardGame, Event, EventRegistration
from app.models import User
from app.models.schemas.game import (
    BoardGameCreate, BoardGameResponse,
    GameUpdate, GameResponse, RecommendationResponse
)
from app.services.game_queue_service import manager as queue_manager
from app.utils.auth import get_current_user

import xml.etree.ElementTree as ET
import os

router = APIRouter(prefix="/games", tags=["games"])


@router.get("/", response_model=List[BoardGameResponse])
def list_board_games(db: Session = Depends(get_db)):
    """List all board games."""
    games = db.query(BoardGame).options(joinedload(BoardGame.creator)).all()
    return games


@router.get("/recommendations", response_model=RecommendationResponse)
async def list_recommended_games(
        event_id: int,
        from_queue: bool,
        db: Session = Depends(get_db)
):
    event = db.query(Event).options(
        joinedload(Event.registrations).joinedload(EventRegistration.user),
        joinedload(Event.games)
    ).filter(Event.id == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    player_count = len(event.registrations)
    # Pobierz listę ID użytkowników zarejestrowanych na event
    registered_user_ids = {reg.user_id for reg in event.registrations}

    time_used = sum(game.length_in_minutes or 0 for game in event.games)
    time_remaining = int(event.estimated_length_in_minutes) - time_used
    assigned_game_ids = [game.id for game in event.games]

    # --- 1. Base Query: Get candidates based on Queue/Assignment ---
    query = db.query(BoardGame)

    if from_queue:
        queue_game_ids = await queue_manager.get_all()
        if queue_game_ids:
            query = query.filter(BoardGame.id.in_(queue_game_ids))
        else:
            return RecommendationResponse(strict=[], rest=[])

    if assigned_game_ids:
        query = query.filter(not_(BoardGame.id.in_(assigned_game_ids)))

    # Pobierz kandydatów
    candidates = query.all()

    # --- 2. Enhanced Python-side Splitting Logic ---
    strict_recommendations = []
    rest_recommendations = []

    for game in candidates:
        # A. Check Player Count Match (poprzednia logika)
        players_match = False
        if game.min_players is not None and game.max_players is not None:
            if game.min_players <= player_count <= game.max_players:
                players_match = True
        elif game.valid_player_counts:
            if player_count in (game.valid_player_counts or ""):
                players_match = True
        elif game.min_players is not None:
            if player_count >= game.min_players:
                players_match = True

        # B. Check Time Match
        time_match = (game.length_in_minutes or 0) <= time_remaining

        owner_registered = game.creator_id in registered_user_ids

        # D. Split into lists
        if players_match and time_match and owner_registered:
            strict_recommendations.append(game)
        else:
            rest_recommendations.append(game)

    return RecommendationResponse(
        strict=strict_recommendations,
        rest=rest_recommendations
    )


@router.post("/", response_model=BoardGameResponse, status_code=201)
async def create_board_game(
    game: BoardGameCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new board game (admin only)."""
    if current_user.role != "head-admin":
        raise HTTPException(status_code=403, detail="Only admins can create board games")
    
    db_game = BoardGame(**game.dict())
    db.add(db_game)
    db.commit()
    db.refresh(db_game)
    return db_game


@router.get("/{game_id}", response_model=GameResponse)
def get_board_game(game_id: int, db: Session = Depends(get_db)):
    game = (
        db.query(BoardGame)
        .options(joinedload(BoardGame.creator))
        .filter(BoardGame.id == game_id)
        .first()
    )
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game


@router.put("/{game_id}", response_model=GameResponse)
async def update_board_game(
    game_id: int,
    game_data: GameUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    game = db.query(BoardGame).filter(BoardGame.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    # Check permissions
    if game.creator_id != current_user.id and current_user.role != "head-admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    # Update fields (check for None explicitly)
    if game_data.name is not None:
        game.name = game_data.name
    if game_data.player_count_type is not None:
        game.player_count_type = game_data.player_count_type
    if game_data.min_players is not None:
        game.min_players = game_data.min_players
    if game_data.max_players is not None:
        game.max_players = game_data.max_players
    if game_data.valid_player_counts is not None:
        game.valid_player_counts = game_data.valid_player_counts
    if game_data.length_in_minutes is not None:
        game.length_in_minutes = game_data.length_in_minutes

    db.commit()
    db.refresh(game)
    return game


@router.delete("{game_id}", status_code=204)
async def delete_custom_game(
    game_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    game = db.query(BoardGame).filter(BoardGame.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    # Check permissions
    if game.creator_id != current_user.id and current_user.role != "head-admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(game)
    db.commit()


@router.get("/bgg-search")
async def search_bgg_games(query: str = Query(..., min_length=2, description="BGG search query")):
    bgg_api_url = "https://boardgamegeek.com/xmlapi2/search"

    params = {
        "query": query,
        "type": "boardgame"
    }
    headers = {
        "authorization": f"Bearer {os.environ['BGG_API_KEY']}"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(bgg_api_url, params=params, timeout=10.0)
            response.raise_for_status()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"BGG API communication error: {str(e)}")

    # Parsowanie odpowiedzi XML
    try:
        root = ET.fromstring(response.content)
    except ET.ParseError:
        raise HTTPException(status_code=500, detail="BGG API data parsing error: Invalid XML response")

    results = []

    # Iteracja po każdym elemencie <item> w odpowiedzi XML
    for item in root.findall("item"):
        bgg_id = item.get("id")

        name_elem = item.find("name")
        year_elem = item.find("yearpublished")

        game_name = name_elem.get("value") if name_elem is not None else "Brak nazwy"
        year_published = year_elem.get("value") if year_elem is not None else None

        results.append({
            "bgg_id": bgg_id,
            "name": game_name,
            "year_published": year_published
        })

    return {"results": results}