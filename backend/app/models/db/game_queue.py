from sqlalchemy import Column, String, DateTime, func, ForeignKey, Integer
from sqlalchemy.orm import relationship
from app.database import Base


class GameQueueItem(Base):
    __tablename__ = "game_queue"

    id = Column(Integer, primary_key=True, autoincrement=True)
    game_id = Column(Integer, ForeignKey("board_games.id"), nullable=False)
    added_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    used_in_event_id = Column(Integer, ForeignKey("events.id"), nullable=True)
    added_at = Column(DateTime, server_default=func.now())
    queue_position = Column(Integer, nullable=False, default=0)

    # Relationships
    game = relationship("BoardGame", back_populates="queue_items", foreign_keys=[game_id])
    added_by = relationship("User", foreign_keys=[added_by_user_id])
    used_in_event = relationship("Event", foreign_keys=[used_in_event_id])

    def __repr__(self):
        return f"<GameQueueItem {self.game_id} position={self.queue_position}>"
