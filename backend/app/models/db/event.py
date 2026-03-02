from sqlalchemy import Column, String, DateTime, func, ForeignKey, Integer
from sqlalchemy.orm import relationship
from app.database import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date_time = Column(DateTime, nullable=False, index=True)
    location = Column(String, nullable=False)
    organizer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    estimated_length_in_minutes = Column(Integer, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    organizer = relationship("User", back_populates="events", foreign_keys=[organizer_id])
    registrations = relationship("EventRegistration", back_populates="event", cascade="all, delete-orphan")

    games = relationship("BoardGame", secondary="event_games")

    def __repr__(self):
        return f"<Event {self.id} on {self.date_time}>"