from pydantic import BaseModel

class GameQueueItem(BaseModel):
    id: int
    name: str
    length_in_minutes: int

class GameQueueResponse(BaseModel):
    items: list[GameQueueItem]

class SimpleQueueResponse(BaseModel):
    items: list[str]