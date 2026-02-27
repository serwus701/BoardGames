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
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    creator = relationship("User", back_populates="custom_games", foreign_keys=[creator_id])

    def __repr__(self):
        return f"<BoardGame {self.name}>"
