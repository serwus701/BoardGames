from sqlalchemy import Column, String, Integer, DateTime, func, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class BoardGame(Base):
    __tablename__ = "board_games"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False, index=True)
    description = Column(String, nullable=True)
    length_in_minutes = Column(Integer, nullable=True)
    player_count_type = Column(String, nullable=False, default='specific')  # 'specific', 'range', 'minimum'
    min_players = Column(Integer, nullable=True)  # For 'range' and 'minimum' types
    max_players = Column(Integer, nullable=True)  # For 'range' type only
    valid_player_counts = Column(JSON, nullable=True)  # For 'specific' type only [1, 3, 4, 6]
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    shared_instances = relationship("SharedGameInstance", back_populates="board_game", foreign_keys="SharedGameInstance.game_id")
    queue_items = relationship("GameQueueItem", back_populates="game", foreign_keys="GameQueueItem.game_id")

    def __repr__(self):
        return f"<BoardGame {self.name}>"


class CustomGame(Base):
    __tablename__ = "custom_games"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False, index=True)
    player_count_type = Column(String, nullable=False, default='specific')  # 'specific', 'range', 'minimum'
    min_players = Column(Integer, nullable=True)  # For 'range' and 'minimum' types
    max_players = Column(Integer, nullable=True)  # For 'range' type only
    valid_player_counts = Column(JSON, nullable=True)  # For 'specific' type only
    length_in_minutes = Column(Integer, nullable=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    creator = relationship("User", back_populates="custom_games", foreign_keys=[creator_id])
    shared_instances = relationship("SharedGameInstance", back_populates="custom_game", foreign_keys="SharedGameInstance.custom_game_id")

    def __repr__(self):
        return f"<CustomGame {self.name}>"
