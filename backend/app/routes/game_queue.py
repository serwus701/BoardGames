from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.game_queue import GameQueueItem
from app.models.user import User
from app.schemas.game_queue import GameQueueItemCreate, GameQueueItemResponse, QueueReorderRequest
from app.utils.auth import get_current_user

router = APIRouter(prefix="/game-queue", tags=["game-queue"])


@router.get("", response_model=List[GameQueueItemResponse])
def list_queue(db: Session = Depends(get_db)):
    """List all items in the game queue."""
    items = db.query(GameQueueItem).order_by(GameQueueItem.queue_position).all()
    return items


@router.post("", response_model=GameQueueItemResponse, status_code=201)
async def add_to_queue(
    queue_item: GameQueueItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a game to the queue (any user can do this)."""
    # Get current max position
    max_position = db.query(GameQueueItem).count()

    db_item = GameQueueItem(
        game_instance_id=queue_item.game_instance_id,
        game_id=queue_item.game_id,
        added_by_user_id=current_user.id,
        queue_position=max_position
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.post("/reorder")
async def reorder_queue(
    request: QueueReorderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reorder queue items (admin only)."""
    if current_user.role != "head-admin":
        raise HTTPException(status_code=403, detail="Only admins can reorder queue")

    for item_data in request.items:
        item = db.query(GameQueueItem).filter(GameQueueItem.id == item_data["id"]).first()
        if item:
            item.queue_position = item_data["queue_position"]

    db.commit()
    return {"message": "Queue reordered successfully"}


@router.delete("/{queue_item_id}", status_code=204)
async def remove_from_queue(
    queue_item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove item from queue (admin only)."""
    if current_user.role != "head-admin":
        raise HTTPException(status_code=403, detail="Only admins can remove from queue")

    item = db.query(GameQueueItem).filter(GameQueueItem.id == queue_item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Queue item not found")

    db.delete(item)
    db.commit()
