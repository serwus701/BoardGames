from sqlalchemy import Column, String, DateTime, func, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(String, primary_key=True)
    date_time = Column(DateTime, nullable=False, index=True)
    location = Column(String, nullable=False)
    organizer_id = Column(String, ForeignKey("users.id"), nullable=False)
    selected_games = Column(JSON, nullable=True)  # Array of game IDs selected for this event
    registered_players = Column(JSON, nullable=True)  # Array of user IDs
    estimated_length_in_minutes = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    organizer = relationship("User", back_populates="events", foreign_keys=[organizer_id])

    def __repr__(self):
        return f"<Event {self.id} on {self.date_time}>"
