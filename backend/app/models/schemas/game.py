from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Literal


class BoardGameBase(BaseModel):
    name: str
    description: Optional[str] = None
    length_in_minutes: Optional[int] = None
    player_count_type: Literal['specific', 'range', 'minimum'] = 'specific'
    min_players: Optional[int] = None
    max_players: Optional[int] = None
    valid_player_counts: Optional[List[int]] = None


class BoardGameCreate(BoardGameBase):
    pass


class BoardGameUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    length_in_minutes: Optional[int] = None
    player_count_type: Optional[Literal['specific', 'range', 'minimum']] = None
    min_players: Optional[int] = None
    max_players: Optional[int] = None
    valid_player_counts: Optional[List[int]] = None


class BoardGameResponse(BoardGameBase):
    id: int
    created_at: datetime
    creator_id: Optional[int] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CustomGameBase(BaseModel):
    name: str
    player_count_type: Literal['specific', 'range', 'minimum'] = 'specific'
    min_players: Optional[int] = None
    max_players: Optional[int] = None
    valid_player_counts: Optional[List[int]] = None
    length_in_minutes: Optional[int] = None


class CustomGameCreate(CustomGameBase):
    pass


class CustomGameUpdate(BaseModel):
    name: Optional[str] = None
    player_count_type: Optional[Literal['specific', 'range', 'minimum']] = None
    min_players: Optional[int] = None
    max_players: Optional[int] = None
    valid_player_counts: Optional[List[int]] = None
    length_in_minutes: Optional[int] = None


class CustomGameResponse(CustomGameBase):
    id: int
    creator_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
