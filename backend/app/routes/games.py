import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import BoardGame
from app.models import User
from app.models.schemas.game import (
    BoardGameCreate, BoardGameResponse,
    CustomGameCreate, CustomGameUpdate, CustomGameResponse,
    BoardGameUpdate
)
from app.utils.auth import get_current_user

import xml.etree.ElementTree as ET
import os

router = APIRouter(prefix="/games", tags=["games"])


@router.get("/board-games", response_model=List[BoardGameResponse])
def list_board_games(db: Session = Depends(get_db)):
    """List all board games."""
    games = db.query(BoardGame).all()
    return games


@router.post("/board-games", response_model=BoardGameResponse, status_code=201)
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


@router.get("/custom-games", response_model=List[CustomGameResponse])
def list_custom_games(db: Session = Depends(get_db)):
    """List all custom games."""
    # Custom games are stored in the same `board_games` table with a non-null `creator_id`
    games = db.query(BoardGame).filter(BoardGame.creator_id.isnot(None)).all()
    return games


@router.post("/custom-games", response_model=CustomGameResponse, status_code=201)
async def create_custom_game(
    game: CustomGameCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new custom game."""
    db_game = BoardGame(
        name=game.name,
        valid_player_counts=game.valid_player_counts,
        length_in_minutes=game.length_in_minutes,
        creator_id=current_user.id
    )
    # debug: print total custom-like entries
    print(db.query(BoardGame).filter(BoardGame.creator_id.isnot(None)).count())
    db.add(db_game)
    db.commit()
    db.refresh(db_game)
    return db_game


@router.get("/custom-games/{game_id}", response_model=CustomGameResponse)
def get_custom_game(game_id: int, db: Session = Depends(get_db)):
    """Get custom game by ID."""
    game = db.query(BoardGame).filter(BoardGame.id == game_id, BoardGame.creator_id.isnot(None)).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game


@router.put("/custom-games/{game_id}", response_model=CustomGameResponse)
async def update_custom_game(
    game_id: int,
    game_data: CustomGameUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update custom game (creator or admin only)."""
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


@router.delete("/custom-games/{game_id}", status_code=204)
async def delete_custom_game(
    game_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete custom game (creator or admin only)."""
    game = db.query(BoardGame).filter(BoardGame.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    # Check permissions
    if game.creator_id != current_user.id and current_user.role != "head-admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(game)
    db.commit()


@router.put("/board-games/{game_id}", response_model=BoardGameResponse)
async def update_board_game(
    game_id: int,
    game_data: BoardGameUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update board game (admin only)."""
    if current_user.role != "head-admin":
        raise HTTPException(status_code=403, detail="Only admins can update board games")

    game = db.query(BoardGame).filter(BoardGame.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    if game_data.name is not None:
        game.name = game_data.name
    if game_data.description is not None:
        game.description = game_data.description
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