from sqlalchemy import Column, String, DateTime, ForeignKey, func, Integer
from sqlalchemy.orm import relationship
from app.database import Base


class EventRegistration(Base):
    """Junction table for many-to-many relationship between events and users."""
    __tablename__ = "event_registrations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    registered_at = Column(DateTime, server_default=func.now())

    # Relationships
    event = relationship("Event", back_populates="registrations")
    user = relationship("User", back_populates="event_registrations")

    def __repr__(self):
        return f"<EventRegistration {self.user_id} -> {self.event_id}>"
