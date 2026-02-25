from sqlalchemy import Column, ForeignKey, Integer
from app.database import Base


class EventGame(Base):
    __tablename__ = "event_games"

    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), primary_key=True)
    game_id = Column(Integer, ForeignKey("board_games.id", ondelete="CASCADE"), primary_key=True)

    def __repr__(self):
        return f"<EventGame event={self.event_id} game={self.game_id}>"