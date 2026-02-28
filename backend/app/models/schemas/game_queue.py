from pydantic import BaseModel

from app.models.schemas.event import UserInfo


class GameQueueItem(BaseModel):
    id: int
    name: str
    length_in_minutes: int
    added_by: UserInfo


class GameQueueResponse(BaseModel):
    items: list[GameQueueItem]


class BaseQueueItem(BaseModel):
    game_id: str
    user_id: int


class NewQueuePayload(BaseModel):
    items: list[BaseQueueItem]


class DeleteQueuePayload(BaseModel):
    items: list[str]
