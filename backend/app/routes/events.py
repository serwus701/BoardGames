from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.database import get_db
from app.models import Event
from app.models import BoardGame
from app.models import GameQueueItem
from app.models import EventRegistration
from app.models import User
from app.models.schemas.event import EventCreate, EventUpdate, EventResponse
from app.utils.auth import get_current_user

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=List[EventResponse])
def list_events(db: Session = Depends(get_db)):
    events = (
        db.query(Event)
        .options(
            joinedload(Event.registrations).joinedload(EventRegistration.user),
            joinedload(Event.games),
        )
        .order_by(Event.date_time)
        .all()
    )

    response = []
    for event in events:
        event_dict = EventResponse.model_validate(event).model_dump()

        event_dict["registered_players"] = [reg.user for reg in event.registrations]
        event_dict["selected_games"] = list(event.games)

        response.append(event_dict)

    return response


@router.post("", response_model=EventResponse, status_code=201)
async def create_event(
    event_data: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new event."""
    db_event = Event(
        date_time=event_data.date_time,
        location=event_data.location,
        organizer_id=current_user.id,
        estimated_length_in_minutes=event_data.estimated_length_in_minutes,
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)

    # Automatically add creator to registered players
    registration = EventRegistration(event_id=db_event.id, user_id=current_user.id)
    db.add(registration)
    db.commit()
    db.refresh(db_event)

    # Selected games (many-to-many via event_games secondary)
    selected_ids = getattr(event_data, "selected_games", None) or []
    if selected_ids:
        games = db.query(BoardGame).filter(BoardGame.id.in_(selected_ids)).all()
        db_event.games = games  # SQLAlchemy writes to event_games automatically
        db.commit()
        db.refresh(db_event)

        # Attach first matching queue item to this event, if exists
        for gid in selected_ids:
            item = (
                db.query(GameQueueItem)
                .filter(
                    GameQueueItem.game_id == gid,
                    GameQueueItem.used_in_event_id.is_(None),
                )
                .order_by(GameQueueItem.queue_position)
                .first()
            )
            if item:
                item.used_in_event_id = db_event.id
        db.commit()

    event_dict = EventResponse.model_validate(db_event).model_dump()
    event_dict["registered_players"] = [reg.user_id for reg in db_event.registrations]
    event_dict["selected_games"] = [g.id for g in db_event.games]
    return event_dict


@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: int, db: Session = Depends(get_db)):
    """Get event by ID."""
    event = (
        db.query(Event)
        .options(
            joinedload(Event.registrations).joinedload(EventRegistration.user),
            joinedload(Event.games),
        )
        .filter(Event.id == event_id)
        .first()
    )
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    event_dict = EventResponse.model_validate(event).model_dump()
    event_dict["registered_players"] = [reg.user_id for reg in event.registrations]
    event_dict["selected_games"] = [g.id for g in event.games]
    return event_dict


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: int,
    event_data: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update event (organizer or admin only)."""
    event = (
        db.query(Event)
        .options(
            joinedload(Event.registrations),
            joinedload(Event.games),
        )
        .filter(Event.id == event_id)
        .first()
    )
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

    # Update selected games
    if getattr(event_data, "selected_games", None) is not None:
        old_ids = {g.id for g in event.games}
        new_ids = set(event_data.selected_games or [])

        to_add = list(new_ids - old_ids)
        to_remove = list(old_ids - new_ids)

        # set relation (SQLAlchemy updates junction table)
        new_games = []
        if new_ids:
            new_games = db.query(BoardGame).filter(BoardGame.id.in_(list(new_ids))).all()
        event.games = new_games

        # attach queue items for added games
        for gid in to_add:
            item = (
                db.query(GameQueueItem)
                .filter(
                    GameQueueItem.game_id == gid,
                    GameQueueItem.used_in_event_id.is_(None),
                )
                .order_by(GameQueueItem.queue_position)
                .first()
            )
            if item:
                item.used_in_event_id = event.id

        # detach queue items for removed games
        for gid in to_remove:
            item = (
                db.query(GameQueueItem)
                .filter(
                    GameQueueItem.game_id == gid,
                    GameQueueItem.used_in_event_id == event.id,
                )
                .first()
            )
            if item:
                item.used_in_event_id = None
                # return to front of global queue (your existing logic; keep as-is)
                db.query(GameQueueItem).filter(GameQueueItem.id != item.id).update(
                    {GameQueueItem.queue_position: GameQueueItem.queue_position + 1}
                )
                item.queue_position = 0

    db.commit()
    db.refresh(event)

    event_dict = EventResponse.model_validate(event).model_dump()
    event_dict["registered_players"] = [reg.user_id for reg in event.registrations]
    event_dict["selected_games"] = [g.id for g in event.games]
    return event_dict


@router.delete("/{event_id}", status_code=204)
async def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete event (organizer or admin only)."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.organizer_id != current_user.id and current_user.role != "head-admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(event)
    db.commit()


@router.post("/{event_id}/register", response_model=EventResponse)
async def register_for_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Register current user for an event."""
    event = (
        db.query(Event)
        .options(
            joinedload(Event.registrations),
            joinedload(Event.games),
        )
        .filter(Event.id == event_id)
        .first()
    )
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    existing_registration = (
        db.query(EventRegistration)
        .filter(
            EventRegistration.event_id == event_id,
            EventRegistration.user_id == current_user.id,
        )
        .first()
    )
    if existing_registration:
        raise HTTPException(status_code=400, detail="User already registered for this event")

    registration = EventRegistration(event_id=event_id, user_id=current_user.id)
    db.add(registration)
    db.commit()
    db.refresh(event)

    event_dict = EventResponse.model_validate(event).model_dump()
    event_dict["registered_players"] = [reg.user_id for reg in event.registrations]
    event_dict["selected_games"] = [g.id for g in event.games]
    return event_dict


@router.delete("/{event_id}/register", status_code=204)
async def unregister_from_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Unregister current user from an event."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    registration = (
        db.query(EventRegistration)
        .filter(
            EventRegistration.event_id == event_id,
            EventRegistration.user_id == current_user.id,
        )
        .first()
    )
    if not registration:
        raise HTTPException(status_code=400, detail="User not registered for this event")

    db.delete(registration)
    db.commit()


@router.delete("/{event_id}/members/{user_id}", status_code=204)
async def remove_event_member(
    event_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a member from an event (organizer or admin only)."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.organizer_id != current_user.id and current_user.role != "head-admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    registration = (
        db.query(EventRegistration)
        .filter(
            EventRegistration.event_id == event_id,
            EventRegistration.user_id == user_id,
        )
        .first()
    )
    if not registration:
        raise HTTPException(status_code=400, detail="User not registered for this event")

    db.delete(registration)
    db.commit()