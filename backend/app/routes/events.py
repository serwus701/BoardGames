from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import BoardGame, EventGame
from app.models import Event
from app.models import EventRegistration
from app.models import User
from app.models.schemas.event import EventUpdate, EventResponse, EventBase
from app.services.game_queue_service import manager as queue_manager
from app.utils.auth import get_current_user

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=List[EventResponse])
def list_events(db: Session = Depends(get_db)):
    events = (
        db.query(Event)
        .options(
            joinedload(Event.registrations).joinedload(EventRegistration.user),
            joinedload(Event.games).joinedload(BoardGame.creator),
            joinedload(Event.organizer),
        )
        .order_by(Event.date_time)
        .all()
    )

    response = []
    for event in events:
        event_dict = EventResponse.model_validate(event).model_dump()

        event_dict["registered_players"] = [reg.user for reg in event.registrations]
        event_dict["selected_games"] = event.games
        event_dict["organizer"] = event.organizer

        response.append(event_dict)

    return response


@router.post("", response_model=EventResponse, status_code=201)
async def create_event(
        event_data: EventBase,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    """Create a new event and automatically populate games from the queue."""

    db_event = Event(
        date_time=event_data.date_time,
        location=event_data.location,
        organizer_id=current_user.id,
        estimated_length_in_minutes=event_data.estimated_length_in_minutes,
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)

    registration = EventRegistration(event_id=db_event.id, user_id=current_user.id)
    db.add(registration)
    db.commit()

    queue_items = await queue_manager.get_all()
    game_ids = [item.game_id for item in queue_items]

    if game_ids:
        queued_games = db.query(BoardGame).filter(BoardGame.id.in_(game_ids)).all()

        game_map = {game.id: game.length_in_minutes for game in queued_games}

        selected_games = []
        total_duration = 0
        limit = int(event_data.estimated_length_in_minutes)

        for game_id in game_ids:
            duration = game_map.get(int(game_id))
            if not duration:
                continue

            if total_duration + duration <= limit:
                selected_games.append(int(game_id))
                total_duration += duration

                await queue_manager.remove(game_id)
        db_event_games = [EventGame(game_id=game_id, event_id=db_event.id) for game_id in selected_games]
        db.add_all(db_event_games)
        db.commit()
    db.refresh(db_event)

    event_dict = EventResponse.model_validate(db_event).model_dump()
    event_dict["registered_players"] = [reg.user for reg in db_event.registrations]
    event_dict["selected_games"] = db_event.games
    event_dict["organizer"] = db_event.organizer
    return event_dict


@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: int, db: Session = Depends(get_db)):
    """Get event by ID."""
    event = (
        db.query(Event)
        .options(
            joinedload(Event.registrations).joinedload(EventRegistration.user),
            joinedload(Event.games).joinedload(BoardGame.creator),
            joinedload(Event.organizer),
        )
        .filter(Event.id == event_id)
        .first()
    )
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    event_dict = EventResponse.model_validate(event).model_dump()
    event_dict["registered_players"] = [reg.user for reg in event.registrations]
    event_dict["selected_games"] = event.games
    event_dict["organizer"] = event.organizer
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
            joinedload(Event.registrations).joinedload(EventRegistration.user),
            joinedload(Event.games).joinedload(BoardGame.creator),
            joinedload(Event.organizer),
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

        new_games = []
        if new_ids:
            new_games = db.query(BoardGame).filter(BoardGame.id.in_(list(new_ids))).all()
        event.games = new_games

        for game_id in to_add:
            await queue_manager.remove(str(game_id))

        for game_id in to_remove:
            await queue_manager.add(str(game_id))

    db.commit()
    db.refresh(event)

    event_dict = EventResponse.model_validate(event).model_dump()
    event_dict["registered_players"] = [reg.user for reg in event.registrations]
    event_dict["selected_games"] = event.games
    event_dict["organizer"] = event.organizer
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
            joinedload(Event.registrations).joinedload(EventRegistration.user),
            joinedload(Event.games).joinedload(BoardGame.creator),
            joinedload(Event.organizer),
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
    event_dict["registered_players"] = [reg.user for reg in event.registrations]
    event_dict["selected_games"] = event.games
    event_dict["organizer"] = event.organizer
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


@router.delete("/{event_id}/{game_id}", status_code=204)
async def remove_event_game(
        event_id: int,
        game_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    """Remove a member from an event (organizer or admin only)."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.organizer_id != current_user.id and current_user.role != "head-admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    game = (
        db.query(EventGame)
        .filter(
            EventGame.event_id == event_id,
            EventGame.game_id == game_id,
        )
        .first()
    )
    if not game:
        raise HTTPException(status_code=400, detail="User not registered for this event")

    db.delete(game)
    db.commit()
    await queue_manager.add(str(game_id))
