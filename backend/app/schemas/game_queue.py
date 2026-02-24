from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class GameQueueItemBase(BaseModel):
    game_id: int
    game_instance_id: int
    added_by_user_id: int


class GameQueueItemCreate(GameQueueItemBase):
    pass


class GameQueueItemResponse(GameQueueItemBase):
    id: int
    queue_position: int
    added_at: datetime

    class Config:
        from_attributes = True


class QueueReorderRequest(BaseModel):
    items: list[dict]  # Each item should have id and queue_position
