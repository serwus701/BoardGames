from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

from app.models.schemas.game import BoardGameResponse


class EventBase(BaseModel):
    date_time: datetime
    location: str
    estimated_length_in_minutes: str

class EventUpdate(BaseModel):
    date_time: Optional[datetime] = None
    location: Optional[str] = None
    estimated_length_in_minutes: Optional[str] = None
    selected_games: Optional[List[int]] = None


class UserInfo(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True


class EventResponse(EventBase):
    id: int
    organizer_id: int
    organizer: Optional[UserInfo] = None
    selected_games: Optional[List[BoardGameResponse]] = None
    registered_players: List[UserInfo] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
