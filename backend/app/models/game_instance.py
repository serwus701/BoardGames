from sqlalchemy import Column, String, DateTime, func, ForeignKey, Integer
from sqlalchemy.orm import relationship
from app.database import Base


class SharedGameInstance(Base):
    __tablename__ = "shared_game_instances"

    id = Column(Integer, primary_key=True, autoincrement=True)
    game_id = Column(Integer, ForeignKey("board_games.id"), nullable=True)
    custom_game_id = Column(Integer, ForeignKey("custom_games.id"), nullable=True)
    contributor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    added_at = Column(DateTime, server_default=func.now())

    # Relationships
    board_game = relationship("BoardGame", back_populates="shared_instances", foreign_keys=[game_id])
    custom_game = relationship("CustomGame", back_populates="shared_instances", foreign_keys=[custom_game_id])
    contributor = relationship("User", back_populates="shared_game_instances", foreign_keys=[contributor_id])

    def __repr__(self):
        if self.game_id:
            return f"<SharedGameInstance {self.game_id}>"
        return f"<SharedGameInstance {self.custom_game_id}>"
