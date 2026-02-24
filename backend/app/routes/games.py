from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.database import get_db
from app.models.game import BoardGame, CustomGame
from app.models.game_instance import SharedGameInstance
from app.models.user import User
from app.schemas.game import (
    BoardGameCreate, BoardGameResponse,
    CustomGameCreate, CustomGameUpdate, CustomGameResponse
)
from app.utils.auth import get_current_user

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
    games = db.query(CustomGame).all()
    return games


@router.post("/custom-games", response_model=CustomGameResponse, status_code=201)
async def create_custom_game(
    game: CustomGameCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new custom game."""
    db_game = CustomGame(
        id=f"custom-{uuid.uuid4().hex[:8]}",
        name=game.name,
        valid_player_counts=game.valid_player_counts,
        length_in_minutes=game.length_in_minutes,
        creator_id=current_user.id
    )
    db.add(db_game)
    db.commit()
    db.refresh(db_game)
    return db_game


@router.get("/custom-games/{game_id}", response_model=CustomGameResponse)
def get_custom_game(game_id: str, db: Session = Depends(get_db)):
    """Get custom game by ID."""
    game = db.query(CustomGame).filter(CustomGame.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game


@router.put("/custom-games/{game_id}", response_model=CustomGameResponse)
async def update_custom_game(
    game_id: str,
    game_data: CustomGameUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update custom game (creator or admin only)."""
    game = db.query(CustomGame).filter(CustomGame.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    # Check permissions
    if game.creator_id != current_user.id and current_user.role != "head-admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    # Update fields
    if game_data.name:
        game.name = game_data.name
    if game_data.valid_player_counts:
        game.valid_player_counts = game_data.valid_player_counts
    if game_data.length_in_minutes:
        game.length_in_minutes = game_data.length_in_minutes

    db.commit()
    db.refresh(game)
    return game


@router.delete("/custom-games/{game_id}", status_code=204)
async def delete_custom_game(
    game_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete custom game (creator or admin only)."""
    game = db.query(CustomGame).filter(CustomGame.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    # Check permissions
    if game.creator_id != current_user.id and current_user.role != "head-admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(game)
    db.commit()


@router.get("/shared-instances", response_model=list)
def list_shared_instances(db: Session = Depends(get_db)):
    """List all shared game instances."""
    instances = db.query(SharedGameInstance).all()
    return instances


@router.post("/shared-instances", status_code=201)
async def add_game_instance(
    game_id: str = None,
    custom_game_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a game instance to shared collection."""
    if not game_id and not custom_game_id:
        raise HTTPException(status_code=400, detail="Either game_id or custom_game_id required")

    instance = SharedGameInstance(
        id=f"instance-{uuid.uuid4().hex[:8]}",
        game_id=game_id,
        custom_game_id=custom_game_id,
        contributor_id=current_user.id
    )
    db.add(instance)
    db.commit()
    db.refresh(instance)
    return instance
