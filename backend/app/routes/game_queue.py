
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, BoardGame
from app.models.schemas.game_queue import GameQueueResponse, GameQueueItem, SimpleQueueResponse
from app.services.game_queue_service import manager
from app.utils.auth import get_current_user

router = APIRouter(prefix="/game-queue", tags=["game-queue"])


@router.get("", response_model=GameQueueResponse)
async def list_queue(
    db: Session = Depends(get_db)
):
    ids = await manager.get_all()
    items = [
        GameQueueItem(id=game.id, length_in_minutes=game.length_in_minutes, name=game.name)
        for game in db.query(BoardGame).filter(BoardGame.id.in_(ids)).all()
    ]
    return GameQueueResponse(items=items)

@router.post("", status_code=201)
async def add_to_queue(item: str):
    await manager.add(item)
    return {"status": "added"}


@router.post("/rollback")
async def rollback_queue(current_user: User = Depends(get_current_user)):
    """Reverts the last add or remove operation."""
    if current_user.role != "head-admin":
        raise HTTPException(status_code=403, detail="Admin only")

    success = await manager.rollback()
    if not success:
        raise HTTPException(status_code=400, detail="No history to rollback")
    return {"message": "Rollback successful"}


@router.post("/reorder")
async def rollback_queue(new_queue: SimpleQueueResponse, current_user: User = Depends(get_current_user)):
    """Reverts the last add or remove operation."""
    if current_user.role != "head-admin":
        raise HTTPException(status_code=403, detail="Admin only")

    await manager.create_from_list(new_queue.items)
    return {"message": "New order saved"}


@router.delete("/session", status_code=204)
async def remove_from_queue(payload: SimpleQueueResponse, current_user: User = Depends(get_current_user)):
    if current_user.role != "head-admin":
        raise HTTPException(status_code=403, detail="Admin only")

    if not await manager.remove_batch(payload.items):
        raise HTTPException(status_code=404, detail="Game not found")


@router.delete("/{item}", status_code=204)
async def remove_from_queue(item: str, current_user: User = Depends(get_current_user)):
    if current_user.role != "head-admin":
        raise HTTPException(status_code=403, detail="Admin only")

    if not await manager.remove(item):
        raise HTTPException(status_code=404, detail="Game not found")
