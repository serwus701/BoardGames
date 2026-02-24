'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Event } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { eventsAPI, usersAPI, gamesAPI, queueAPI } from '@/utils/api';
import EventEditModal from './EventEditModal';

export default function EventsPage() {
    const { isLoggedIn, user, token, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const [events, setEvents] = useState<Event[]>([]);
    const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
    const [userMap, setUserMap] = useState<{ [key: string]: any }>({});
    const [gamesMap, setGamesMap] = useState<{ [key: string]: any }>({});
    const [queueItems, setQueueItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    // Fetch events and users on mount
    useEffect(() => {
        // Wait for auth to load from localStorage
        if (isAuthLoading) {
            return;
        }

        if (!isLoggedIn) {
            router.push('/login');
            return;
        }

        const fetchData = async () => {
            try {
                setIsLoading(true);
                const [fetchedEvents, users, boardGames, customGames, queue] = await Promise.all([
                    eventsAPI.listEvents(),
                    usersAPI.listUsers(),
                    gamesAPI.listBoardGames(),
                    gamesAPI.listCustomGames(),
                    queueAPI.listQueue()
                ]);

                // Map users by ID
                const userMapping: { [key: string]: any } = {};
                users.forEach(u => {
                    userMapping[u.id] = u;
                });
                setUserMap(userMapping);

                // Map games by ID (combine board games and custom games)
                const gamesMapping: { [key: string]: any } = {};
                boardGames.forEach(g => {
                    gamesMapping[g.id] = g;
                });
                customGames.forEach(g => {
                    gamesMapping[g.id] = g;
                });
                setGamesMap(gamesMapping);
                setQueueItems(queue);

                // Filter to only upcoming events
                const now = new Date();
                const upcoming = fetchedEvents.filter(event => {
                    const eventDate = new Date(event.date_time);
                    return eventDate > now;
                }).sort((a, b) => {
                    return new Date(a.date_time).getTime() - new Date(b.date_time).getTime();
                });

                setEvents(fetchedEvents);
                setUpcomingEvents(upcoming);
                setError('');
            } catch (err) {
                console.error('Failed to fetch events:', err);
                setError('Failed to load events');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [isLoggedIn, isAuthLoading, router]);

    // Check if user can edit/delete event
    const canManageEvent = (event: Event): boolean => {
        if (!user) return false;
        return user.id === event.organizer_id || user.role === 'head-admin' || user.role === 'admin';
    };

    // Automatically assign games from queue to events based on time
    const assignGamesToEvents = () => {
        const assignments: { [eventId: string]: any[] } = {};

        // Get available queue items (not used yet)
        const availableQueue = queueItems
            .filter(item => !item.used_in_event_id && !item.usedInEventId)
            .sort((a, b) => (a.queue_position || 0) - (b.queue_position || 0));

        let queueIndex = 0;

        // Sort events by date
        const sortedEvents = [...upcomingEvents].sort((a, b) =>
            new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
        );

        // Assign games to each event
        for (const event of sortedEvents) {
            const eventDurationMinutes = event.estimated_length_in_minutes
                ? parseFloat(event.estimated_length_in_minutes)
                : 0;

            const assignedGames: any[] = [];
            let totalTime = 0;

            // Always assign at least one game
            while (queueIndex < availableQueue.length) {
                const queueItem = availableQueue[queueIndex];
                const gameId = queueItem.game_id || queueItem.gameId;
                const game = gamesMap[gameId];

                if (game) {
                    const gameTime = game.length_in_minutes || game.lengthInMinutes || 0;

                    // Add game if: it's the first game OR it fits within time limit
                    if (assignedGames.length === 0 || totalTime + gameTime <= eventDurationMinutes) {
                        assignedGames.push({ ...game, queueItemId: queueItem.id });
                        totalTime += gameTime;
                        queueIndex++;
                    } else {
                        // Game doesn't fit, move to next event
                        break;
                    }
                } else {
                    queueIndex++;
                }
            }

            if (assignedGames.length > 0) {
                assignments[event.id] = assignedGames;
            }
        }

        return assignments;
    };

    // Get games for a specific event
    const getEventGames = (eventId: string) => {
        const assignments = assignGamesToEvents();
        return assignments[eventId] || [];
    };

    // Calculate total duration of games in event
    const calculateTotalGameTime = (games: any[]) => {
        return games.reduce((total, game) => total + (game.length_in_minutes || 0), 0);
    };

    // Handle edit click
    const handleEditClick = (event: Event) => {
        setEditingEvent(event);
        setShowEditModal(true);
        setSaveError('');
    };

    // Handle save event
    const handleSaveEvent = async (updatedData: Partial<Event>) => {
        if (!editingEvent || !token) return;

        try {
            setIsSaving(true);
            setSaveError('');

            await eventsAPI.updateEvent(editingEvent.id, updatedData, token);

            // Refresh events list
            const fetchedEvents = await eventsAPI.listEvents();
            setEvents(fetchedEvents);

            // Filter to only upcoming events
            const now = new Date();
            const upcoming = fetchedEvents.filter(event => {
                const eventDate = new Date(event.date_time);
                return eventDate > now;
            }).sort((a, b) => {
                return new Date(a.date_time).getTime() - new Date(b.date_time).getTime();
            });

            setUpcomingEvents(upcoming);
            setShowEditModal(false);
            setEditingEvent(null);
        } catch (err: any) {
            console.error('Failed to save event:', err);
            setSaveError(err.data?.detail || 'Failed to save event');
        } finally {
            setIsSaving(false);
        }
    };

    // Handle delete event
    const handleDeleteEvent = async (eventId: string) => {
        if (!token || !confirm('Are you sure you want to delete this event?')) return;

        try {
            await eventsAPI.deleteEvent(eventId, token);

            // Refresh events list
            const fetchedEvents = await eventsAPI.listEvents();
            setEvents(fetchedEvents);

            // Filter to only upcoming events
            const now = new Date();
            const upcoming = fetchedEvents.filter(event => {
                const eventDate = new Date(event.date_time);
                return eventDate > now;
            }).sort((a, b) => {
                return new Date(a.date_time).getTime() - new Date(b.date_time).getTime();
            });

            setUpcomingEvents(upcoming);
        } catch (err) {
            console.error('Failed to delete event:', err);
            setError('Failed to delete event');
        }
    };

    // Check if user is registered for event
    const isUserRegistered = (event: Event): boolean => {
        if (!user) return false;
        return event.registered_players?.includes(user.id) || false;
    };

    // Handle register for event
    const handleRegister = async (eventId: string) => {
        if (!token) {
            setError('You must be logged in to register');
            return;
        }

        try {
            console.log('Registering for event:', eventId);
            console.log('Token:', token);
            await eventsAPI.registerForEvent(eventId, token);
            console.log('Successfully registered');

            // Refresh events list
            const fetchedEvents = await eventsAPI.listEvents();
            setEvents(fetchedEvents);

            // Filter to only upcoming events
            const now = new Date();
            const upcoming = fetchedEvents.filter(event => {
                const eventDate = new Date(event.date_time);
                return eventDate > now;
            }).sort((a, b) => {
                return new Date(a.date_time).getTime() - new Date(b.date_time).getTime();
            });

            setUpcomingEvents(upcoming);
            setError('');
        } catch (err: any) {
            console.error('Failed to register:', err);
            console.error('Error data:', err.data);
            console.error('Error message:', err.message);
            setError(err.data?.detail || err.message || 'Failed to register for event');
        }
    };

    // Handle unregister from event
    const handleUnregister = async (eventId: string) => {
        if (!token) return;

        try {
            await eventsAPI.unregisterFromEvent(eventId, token);

            // Refresh events list
            const fetchedEvents = await eventsAPI.listEvents();
            setEvents(fetchedEvents);

            // Filter to only upcoming events
            const now = new Date();
            const upcoming = fetchedEvents.filter(event => {
                const eventDate = new Date(event.date_time);
                return eventDate > now;
            }).sort((a, b) => {
                return new Date(a.date_time).getTime() - new Date(b.date_time).getTime();
            });

            setUpcomingEvents(upcoming);
            setError('');
        } catch (err: any) {
            console.error('Failed to unregister:', err);
            setError(err.data?.detail || 'Failed to unregister from event');
        }
    };

    const formatDateTime = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            }).format(date);
        } catch {
            return dateString;
        }
    };

    // Show loading while auth is initializing from localStorage
    if (isAuthLoading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <p className="text-gray-500">Loading...</p>
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <p className="text-gray-500">Redirecting to login...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">Board Game Events</h1>
                        <p className="text-gray-600">
                            Manage and register for upcoming board game events
                            {upcomingEvents.length > 0 && ` (${upcomingEvents.length} upcoming)`}
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/create-event')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                        + Create Event
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                        {error}
                    </div>
                )}

                {isLoading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Loading events...</p>
                    </div>
                ) : upcomingEvents.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg border">
                        <p className="text-gray-500 text-lg mb-4">No upcoming events scheduled</p>
                        <button
                            onClick={() => router.push('/create-event')}
                            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Create the first one
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {upcomingEvents.map((event) => {
                            const canManage = canManageEvent(event);
                            const organizer = userMap[event.organizer_id];

                            return (
                                <div
                                    key={event.id}
                                    className="border-l-4 border-blue-500 rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg bg-white"
                                >
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <h2 className="text-2xl font-bold text-gray-900">
                                                    Event {event.id}
                                                </h2>
                                                <p className="text-gray-600 text-sm mt-1">
                                                    Board game gathering
                                                </p>
                                            </div>
                                            <div className="flex gap-2 ml-4">
                                                {canManage ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleEditClick(event)}
                                                            className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-medium"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteEvent(event.id)}
                                                            className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 font-medium"
                                                        >
                                                            Delete
                                                        </button>
                                                    </>
                                                ) : isUserRegistered(event) ? (
                                                    <button
                                                        onClick={() => handleUnregister(event.id)}
                                                        className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 font-medium flex items-center gap-2"
                                                    >
                                                        <span>✓ Registered</span>
                                                        <span className="text-xs bg-red-200 px-2 py-0.5 rounded-full">
                                                            {event.registered_players?.length || 0} players
                                                        </span>
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleRegister(event.id)}
                                                        className="px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 font-medium flex items-center gap-2"
                                                    >
                                                        <span>Register</span>
                                                        {event.registered_players && event.registered_players.length > 0 && (
                                                            <span className="text-xs bg-green-200 px-2 py-0.5 rounded-full">
                                                                {event.registered_players.length} already joined
                                                            </span>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Event Details Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                            <div className="flex items-center space-x-3 text-gray-700">
                                                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v2h16V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                                </svg>
                                                <div>
                                                    <p className="text-sm text-gray-500">Date & Time</p>
                                                    <p className="font-semibold">{formatDateTime(event.date_time)}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-3 text-gray-700">
                                                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                </svg>
                                                <div>
                                                    <p className="text-sm text-gray-500">Location</p>
                                                    <p className="font-semibold">{event.location}</p>
                                                </div>
                                            </div>

                                            {organizer && (
                                                <div className="flex items-center space-x-3 text-gray-700">
                                                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3z" />
                                                    </svg>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Organizer</p>
                                                        <p className="font-semibold">{organizer.full_name || organizer.email}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {event.estimated_length_in_minutes && (
                                                <div className="flex items-center space-x-3 text-gray-700">
                                                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00-.293.707l-3 3a1 1 0 101.414 1.414L9 11.414V6z" clipRule="evenodd" />
                                                    </svg>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Duration</p>
                                                        <p className="font-semibold">
                                                            {(parseFloat(event.estimated_length_in_minutes) / 60).toFixed(1)} hours
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {(() => {
                                            const eventGames = getEventGames(event.id);
                                            const totalGameTime = calculateTotalGameTime(eventGames);
                                            const eventDuration = event.estimated_length_in_minutes
                                                ? parseFloat(event.estimated_length_in_minutes)
                                                : 0;

                                            return eventGames.length > 0 && (
                                                <div className="bg-green-50 rounded-lg p-4 mb-4 border-2 border-green-200">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            🎲 Games for this Event ({eventGames.length})
                                                        </p>
                                                        <p className="text-xs text-gray-600">
                                                            Total: {(totalGameTime / 60).toFixed(1)}h
                                                            {eventDuration > 0 && ` / ${(eventDuration / 60).toFixed(1)}h available`}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {eventGames.map(game => (
                                                            <div
                                                                key={game.queueItemId}
                                                                className="bg-white border border-green-200 rounded-lg p-3 flex justify-between items-center"
                                                            >
                                                                <div>
                                                                    <p className="font-semibold text-gray-900">{game.name}</p>
                                                                    <p className="text-xs text-gray-500">
                                                                        {game.valid_player_counts?.join(', ')} players
                                                                    </p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-sm font-semibold text-green-700">
                                                                        {(game.length_in_minutes / 60).toFixed(1)}h
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">
                                                                        {game.length_in_minutes} min
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {!isUserRegistered(event) && !canManageEvent(event) && (
                                            <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-300">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900 mb-1">
                                                            Want to join this event?
                                                        </p>
                                                        <p className="text-xs text-gray-600">
                                                            {event.registered_players?.length || 0} player{(event.registered_players?.length || 0) !== 1 ? 's' : ''} already registered
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRegister(event.id)}
                                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium whitespace-nowrap ml-4"
                                                    >
                                                        Join Event
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {event.registered_players && event.registered_players.length > 0 ? (
                                            <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                                                <p className="text-sm font-semibold text-gray-900 mb-3">
                                                    👥 Registered Players ({event.registered_players.length})
                                                </p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {event.registered_players.map(playerId => {
                                                        const player = userMap[playerId];
                                                        return (
                                                            <div
                                                                key={playerId}
                                                                className="bg-white border border-blue-200 rounded-lg px-3 py-2 flex items-center space-x-2"
                                                            >
                                                                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                                                    {(player?.full_name || player?.email || 'U')[0].toUpperCase()}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                                        {player?.full_name || player?.email || 'Unknown'}
                                                                    </p>
                                                                    {player?.full_name && player?.email && (
                                                                        <p className="text-xs text-gray-500 truncate">
                                                                            {player.email}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-center">
                                                <p className="text-sm text-gray-500">
                                                    No players registered yet. Be the first to join!
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <EventEditModal
                    isOpen={showEditModal}
                    event={editingEvent}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingEvent(null);
                        setSaveError('');
                    }}
                    onSave={handleSaveEvent}
                    isLoading={isSaving}
                    error={saveError}
                />

                {/* Info Section */}
                <div className="mt-12 grid md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                        <h3 className="font-bold text-lg text-gray-900 mb-2">About Events</h3>
                        <ul className="text-sm text-gray-700 space-y-2">
                            <li>✓ Create events with date, time and location</li>
                            <li>✓ Edit or delete events you created (or as admin)</li>
                            <li>✓ Only upcoming events are shown</li>
                            <li>✓ Admins can manage all events</li>
                        </ul>
                    </div>

                    <div className="bg-green-50 rounded-lg border border-green-200 p-6">
                        <h3 className="font-bold text-lg text-gray-900 mb-2">Event Management</h3>
                        <p className="text-sm text-gray-700">
                            Create events for your board game gatherings. As event organizer or admin, you can edit or delete events at any time. Manage player registrations and keep everyone updated.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
