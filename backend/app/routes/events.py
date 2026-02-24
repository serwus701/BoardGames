from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.database import get_db
from app.models.event import Event
from app.models.event_registration import EventRegistration
from app.models.user import User
from app.schemas.event import EventCreate, EventUpdate, EventResponse
from app.utils.auth import get_current_user

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=List[EventResponse])
def list_events(db: Session = Depends(get_db)):
    """List all events."""
    events = db.query(Event).options(joinedload(Event.registrations)).order_by(Event.date_time).all()
    # Build response with registered_players
    response = []
    for event in events:
        event_dict = EventResponse.model_validate(event).model_dump()
        event_dict['registered_players'] = [reg.user_id for reg in event.registrations]
        response.append(event_dict)

    return response


@router.post("", response_model=EventResponse, status_code=201)
async def create_event(
    event_data: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new event."""
    db_event = Event(
        date_time=event_data.date_time,
        location=event_data.location,
        organizer_id=current_user.id,
        estimated_length_in_minutes=event_data.estimated_length_in_minutes
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    
    # Automatically add creator to registered players
    registration = EventRegistration(
        event_id=db_event.id,
        user_id=current_user.id
    )
    db.add(registration)
    db.commit()
    db.refresh(db_event)
    
    # Build response with registered_players
    event_dict = EventResponse.model_validate(db_event).model_dump()
    event_dict['registered_players'] = [current_user.id]
    return event_dict


@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: int, db: Session = Depends(get_db)):
    """Get event by ID."""
    event = db.query(Event).options(joinedload(Event.registrations)).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Build response with registered_players
    event_dict = EventResponse.model_validate(event).model_dump()
    event_dict['registered_players'] = [reg.user_id for reg in event.registrations]
    return event_dict


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: int,
    event_data: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update event (organizer or admin only)."""
    event = db.query(Event).options(joinedload(Event.registrations)).filter(Event.id == event_id).first()
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

    db.commit()
    db.refresh(event)
    
    # Build response with registered_players
    event_dict = EventResponse.model_validate(event).model_dump()
    event_dict['registered_players'] = [reg.user_id for reg in event.registrations]
    return event_dict


@router.delete("/{event_id}", status_code=204)
async def delete_event(
    event_id: int,
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
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Register current user for an event."""
    event = db.query(Event).options(joinedload(Event.registrations)).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if user is already registered
    existing_registration = db.query(EventRegistration).filter(
        EventRegistration.event_id == event_id,
        EventRegistration.user_id == current_user.id
    ).first()
    
    if existing_registration:
        raise HTTPException(status_code=400, detail="User already registered for this event")
    
    # Add user to registered players
    registration = EventRegistration(
        event_id=event_id,
        user_id=current_user.id
    )
    db.add(registration)
    db.commit()
    db.refresh(event)
    
    # Build response with registered_players
    event_dict = EventResponse.model_validate(event).model_dump()
    event_dict['registered_players'] = [reg.user_id for reg in event.registrations]
    return event_dict


@router.delete("/{event_id}/register", status_code=204)
async def unregister_from_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Unregister current user from an event."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Find registration
    registration = db.query(EventRegistration).filter(
        EventRegistration.event_id == event_id,
        EventRegistration.user_id == current_user.id
    ).first()
    
    if not registration:
        raise HTTPException(status_code=400, detail="User not registered for this event")
    
    # Remove registration
    db.delete(registration)
    db.commit()


@router.delete("/{event_id}/members/{user_id}", status_code=204)
async def remove_event_member(
    event_id: int,
    user_id: int,
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
    
    # Find registration
    registration = db.query(EventRegistration).filter(
        EventRegistration.event_id == event_id,
        EventRegistration.user_id == user_id
    ).first()
    
    if not registration:
        raise HTTPException(status_code=400, detail="User not registered for this event")
    
    # Remove registration
    db.delete(registration)
    db.commit()
