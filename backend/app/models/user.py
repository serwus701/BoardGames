from sqlalchemy import Column, String, DateTime, func, Integer
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    home_address = Column(String, nullable=True)
    role = Column(String, default="user")  # "user" or "head-admin"
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    custom_games = relationship("BoardGame", back_populates="creator", foreign_keys="BoardGame.creator_id")
    events = relationship("Event", back_populates="organizer", foreign_keys="Event.organizer_id")
    event_registrations = relationship("EventRegistration", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.name}>"
