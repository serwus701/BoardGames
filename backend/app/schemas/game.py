from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional


class BoardGameBase(BaseModel):
    name: str
    description: Optional[str] = None
    length_in_minutes: Optional[int] = None
    valid_player_counts: List[int]


class BoardGameCreate(BoardGameBase):
    id: str


class BoardGameResponse(BoardGameBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


class CustomGameBase(BaseModel):
    name: str
    valid_player_counts: List[int]
    length_in_minutes: Optional[int] = None


class CustomGameCreate(CustomGameBase):
    pass


class CustomGameUpdate(BaseModel):
    name: Optional[str] = None
    valid_player_counts: Optional[List[int]] = None
    length_in_minutes: Optional[int] = None


class CustomGameResponse(CustomGameBase):
    id: str
    creator_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
