from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional


class EventBase(BaseModel):
    date_time: datetime
    location: str
    estimated_length_in_minutes: Optional[str] = None


class EventCreate(EventBase):
    organizer_id: int
    selected_games: Optional[List[int]] = None


class EventUpdate(BaseModel):
    date_time: Optional[datetime] = None
    location: Optional[str] = None
    estimated_length_in_minutes: Optional[str] = None
    selected_games: Optional[List[int]] = None


class EventResponse(EventBase):
    id: int
    organizer_id: int
    selected_games: Optional[List[int]] = None
    registered_players: List[int] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
