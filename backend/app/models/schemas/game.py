from pydantic import BaseModel, model_validator
from datetime import datetime
from typing import List, Optional, Literal


class BoardGameOwner(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True


class BoardGameBase(BaseModel):
    name: str
    description: Optional[str] = None
    length_in_minutes: int
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


class BoardGameResponse(BaseModel):
    id: int
    owner: BoardGameOwner
    name: str
    playerCountsType: Literal['exact', 'minMax', 'minOnly']
    playerCountsExact: List[int]
    playerCountsMin: int
    playerCountsMax: int
    lengthInMinutes: int

    @model_validator(mode="before")
    @classmethod
    def from_board_game_model(cls, value):
        if isinstance(value, dict):
            if value.get("owner") is None:
                value["owner"] = {
                    "id": 0,
                    "name": "System",
                    "email": "system@local",
                }
            return value

        player_count_type_mapping = {
            "specific": "exact",
            "range": "minMax",
            "minimum": "minOnly",
        }


        creator = getattr(value, "creator", None)
        owner = creator or {
            "id": 0,
            "name": "System",
            "email": "system@local",
        }

        return {
            "id": value.id,
            "owner": owner,
            "name": value.name,
            "playerCountsType": player_count_type_mapping.get(getattr(value, "player_count_type", "specific"), "exact"),
            "playerCountsExact": getattr(value, "valid_player_counts", None) or [],
            "playerCountsMin": getattr(value, "min_players", None) or 0,
            "playerCountsMax": getattr(value, "max_players", None) or 0,
            "lengthInMinutes": getattr(value, "length_in_minutes", None)
        }

    class Config:
        from_attributes = True


class GameBase(BaseModel):
    name: str
    player_count_type: Literal['specific', 'range', 'minimum'] = 'specific'
    min_players: Optional[int] = None
    max_players: Optional[int] = None
    valid_player_counts: Optional[List[int]] = None
    length_in_minutes: int


class GameUpdate(BaseModel):
    name: Optional[str] = None
    player_count_type: Optional[Literal['specific', 'range', 'minimum']] = None
    min_players: Optional[int] = None
    max_players: Optional[int] = None
    valid_player_counts: Optional[List[int]] = None
    length_in_minutes: Optional[int] = None


class GameResponse(GameBase):
    id: int
    creator_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RecommendationResponse(BaseModel):
    strict: list[BoardGameResponse]
    rest: list[BoardGameResponse]