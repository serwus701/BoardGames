
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, BoardGame
from app.models.schemas.game_queue import GameQueueResponse, GameQueueItem, NewQueuePayload, BaseQueueItem, \
    DeleteQueuePayload
from app.services.game_queue_service import manager
from app.utils.auth import get_current_user

router = APIRouter(prefix="/game-queue", tags=["game-queue"])


@router.get("", response_model=GameQueueResponse)
async def list_queue(
    db: Session = Depends(get_db)
):
    queue_items = await manager.get_all()

    if not queue_items:
        return GameQueueResponse(items=[])

    ordered_game_ids = [item.game_id for item in queue_items]
    unique_user_ids = list(set(item.user_id for item in queue_items))

    db_games = db.query(BoardGame).filter(BoardGame.id.in_(ordered_game_ids)).all()
    db_users = db.query(User).filter(User.id.in_(unique_user_ids)).all()

    db_games_map = {game.id: game for game in db_games}
    db_users_map = {user.id: user for user in db_users}

    response_items = []
    for queue_item in queue_items:
        game_data = db_games_map.get(queue_item.game_id)
        user_data = db_users_map.get(queue_item.user_id)

        if game_data:
            response_items.append(
                GameQueueItem(
                    id=game_data.id,
                    length_in_minutes=game_data.length_in_minutes,
                    name=game_data.name,
                    added_by=user_data
                )
            )

    return GameQueueResponse(items=response_items)

@router.post("", status_code=201)
async def add_to_queue(game_id: int, current_user: User = Depends(get_current_user)):
    await manager.add(game_id, current_user.id)
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
async def rollback_queue(new_queue: NewQueuePayload, current_user: User = Depends(get_current_user)):
    """Reverts the last add or remove operation."""
    if current_user.role != "head-admin":
        raise HTTPException(status_code=403, detail="Admin only")

    await manager.create_from_list(new_queue.items)
    return {"message": "New order saved"}


@router.delete("/session", status_code=204)
async def remove_from_queue(payload: DeleteQueuePayload, current_user: User = Depends(get_current_user)):
    if current_user.role != "head-admin":
        raise HTTPException(status_code=403, detail="Admin only")

    if not await manager.remove_batch(payload.items):
        raise HTTPException(status_code=404, detail="Game not found")


@router.delete("/{item}", status_code=204)
async def remove_from_queue(item: int, current_user: User = Depends(get_current_user)):
    if current_user.role != "head-admin":
        raise HTTPException(status_code=403, detail="Admin only")

    if not await manager.remove(item):
        raise HTTPException(status_code=404, detail="Game not found")
