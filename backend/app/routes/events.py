from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.database import get_db
from app.models.event import Event
from app.models.user import User
from app.schemas.event import EventCreate, EventUpdate, EventResponse
from app.utils.auth import get_current_user

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=List[EventResponse])
def list_events(db: Session = Depends(get_db)):
    """List all events."""
    events = db.query(Event).order_by(Event.date_time).all()
    return events


@router.post("", response_model=EventResponse, status_code=201)
async def create_event(
    event_data: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new event."""
    db_event = Event(
        id=f"event-{uuid.uuid4().hex[:8]}",
        date_time=event_data.date_time,
        location=event_data.location,
        organizer_id=current_user.id,
        estimated_length_in_minutes=event_data.estimated_length_in_minutes
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    
    # Automatically add creator to registered players
    db_event.registered_players = [current_user.id]
    db.commit()
    db.refresh(db_event)
    return db_event


@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: str, db: Session = Depends(get_db)):
    """Get event by ID."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: str,
    event_data: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update event (organizer or admin only)."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check permissions
    if event.organizer_id != current_user.id and current_user.role != "head-admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    # Update fields
    if event_data.date_time:
        event.date_time = event_data.date_time
    if event_data.location:
        event.location = event_data.location
    if event_data.estimated_length_in_minutes:
        event.estimated_length_in_minutes = event_data.estimated_length_in_minutes
    if event_data.selected_games:
        event.selected_games = event_data.selected_games
    if event_data.registered_players:
        event.registered_players = event_data.registered_players

    db.commit()
    db.refresh(event)
    return event


@router.delete("/{event_id}", status_code=204)
async def delete_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete event (organizer or admin only)."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Check permissions
    if event.organizer_id != current_user.id and current_user.role != "head-admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(event)
    db.commit()


@router.post("/{event_id}/register", response_model=EventResponse)
async def register_for_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Register current user for an event."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Initialize registered_players if it's None
    if event.registered_players is None:
        event.registered_players = []
    
    # Check if user is already registered
    if current_user.id in event.registered_players:
        raise HTTPException(status_code=400, detail="User already registered for this event")
    
    # Add user to registered players
    event.registered_players.append(current_user.id)
    db.commit()
    db.refresh(event)
    return event


@router.delete("/{event_id}/register", status_code=204)
async def unregister_from_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Unregister current user from an event."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Initialize registered_players if it's None
    if event.registered_players is None:
        event.registered_players = []
    
    # Check if user is registered
    if current_user.id not in event.registered_players:
        raise HTTPException(status_code=400, detail="User not registered for this event")
    
    # Remove user from registered players
    event.registered_players.remove(current_user.id)
    db.commit()


@router.delete("/{event_id}/members/{user_id}", status_code=204)
async def remove_event_member(
    event_id: str,
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a member from an event (organizer or admin only)."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check permissions - only organizer or admin can remove members
    if event.organizer_id != current_user.id and current_user.role != "head-admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Initialize registered_players if it's None
    if event.registered_players is None:
        event.registered_players = []
    
    # Check if user is registered
    if user_id not in event.registered_players:
        raise HTTPException(status_code=400, detail="User not registered for this event")
    
    # Remove user from registered players
    event.registered_players.remove(user_id)
    db.commit()
