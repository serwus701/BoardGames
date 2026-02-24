from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class GameQueueItemBase(BaseModel):
    game_id: str
    game_instance_id: str
    added_by_user_id: str


class GameQueueItemCreate(GameQueueItemBase):
    pass


class GameQueueItemResponse(GameQueueItemBase):
    id: str
    queue_position: int
    added_at: datetime

    class Config:
        from_attributes = True


class QueueReorderRequest(BaseModel):
    items: list[dict]  # Each item should have id and queue_position
