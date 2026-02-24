from sqlalchemy import Column, String, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
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
    custom_games = relationship("CustomGame", back_populates="creator", foreign_keys="CustomGame.creator_id")
    shared_game_instances = relationship("SharedGameInstance", back_populates="contributor", foreign_keys="SharedGameInstance.contributor_id")
    events = relationship("Event", back_populates="organizer", foreign_keys="Event.organizer_id")

    def __repr__(self):
        return f"<User {self.name}>"
