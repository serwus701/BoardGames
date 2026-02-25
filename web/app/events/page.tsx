'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Event, User, CustomGame, GameQueueItem } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { eventsAPI, usersAPI, gamesAPI, queueAPI } from '@/utils/api';
import EventEditModal from './EventEditModal';
import { EventsList } from './EventsList';
import { BoardGame } from '@/types/BoardGame';

export default function EventsPage() {
    const { isLoggedIn, user, token, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();

    const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
    const [userMap, setUserMap] = useState<Record<string, User>>({});
    const [gamesMap, setGamesMap] = useState<Record<string, BoardGame | CustomGame>>({});
    const [queueItems, setQueueItems] = useState<GameQueueItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    useEffect(() => {
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

                const userMapping: Record<string, User> = {};
                users.forEach((u: User) => {
                    userMapping[u.id] = u;
                });
                setUserMap(userMapping);

                const gamesMapping: Record<string, BoardGame | CustomGame> = {};
                (boardGames || []).forEach((g: BoardGame) => {
                    gamesMapping[g.id] = g;
                });
                (customGames || []).forEach((g: CustomGame) => {
                    gamesMapping[g.id] = g;
                });
                setGamesMap(gamesMapping);
                setQueueItems(queue);

                const now = new Date();
                const upcoming = fetchedEvents.filter(event => {
                    const eventDate = new Date(event.date_time);
                    return eventDate > now;
                }).sort((a, b) => {
                    return new Date(a.date_time).getTime() - new Date(b.date_time).getTime();
                });

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

    const canManageEvent = (event: Event): boolean => {
        if (!user) return false;
        return user.id === event.organizer_id || user.role === 'head-admin' || user.role === 'admin';
    };

    const assignGamesToEvents = () => {
        const assignments: Record<string, AssignedGame[]> = {};

        type RawQueueItem = GameQueueItem & Record<string, unknown> & {
            used_in_event_id?: string;
            usedInEventId?: string;
            queue_position?: number;
            game_id?: string;
            gameId?: string;
        };

        const availableQueue = (queueItems as RawQueueItem[])
            .filter(item => !(item.used_in_event_id ?? item.usedInEventId))
            .sort((a, b) => ((a.queue_position ?? 0) as number) - ((b.queue_position ?? 0) as number));

        let queueIndex = 0;

        const sortedEvents = [...upcomingEvents].sort((a, b) =>
            new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
        );

        for (const event of sortedEvents) {
            const eventDurationMinutes = event.estimated_length_in_minutes
                ? parseFloat(event.estimated_length_in_minutes)
                : 0;

            type AssignedGame = (BoardGame | CustomGame) & { queueItemId?: string };
            const assignedGames: AssignedGame[] = [];
            let totalTime = 0;

            while (queueIndex < availableQueue.length) {
                const queueItem = availableQueue[queueIndex];
                const gameId = (queueItem as RawQueueItem).game_id ?? (queueItem as RawQueueItem).gameId ?? (queueItem.gameId as unknown);
                const game = gamesMap[String(gameId)];

                if (game) {
                    const gRec = game as Record<string, unknown>;
                    const gameTime = Number(gRec['length_in_minutes'] ?? gRec['lengthInMinutes'] ?? gRec['lengthInMinutes'] ?? 0) || 0;

                    if (assignedGames.length === 0 || totalTime + gameTime <= eventDurationMinutes) {
                        assignedGames.push({ ...(game as AssignedGame), queueItemId: (queueItem as RawQueueItem).id });
                        totalTime += gameTime;
                        queueIndex++;
                    } else {
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



    const handleEditClick = (event: Event) => {
        setEditingEvent(event);
        setShowEditModal(true);
        setSaveError('');
    };

    const handleSaveEvent = async (updatedData: Partial<Event>) => {
        if (!editingEvent || !token) return;

        try {
            setIsSaving(true);
            setSaveError('');

            await eventsAPI.updateEvent(editingEvent.id, updatedData, token);

            const fetchedEvents = await eventsAPI.listEvents();

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
        } catch (err: unknown) {
            console.error('Failed to save event:', err);

            if (err instanceof Error) {
                setSaveError(err.message);
            } else {
                setSaveError('Failed to save event');
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteEvent = async (eventId: string) => {
        if (!token || !confirm('Are you sure you want to delete this event?')) return;

        try {
            await eventsAPI.deleteEvent(eventId, token);

            const fetchedEvents = await eventsAPI.listEvents();

            const now = new Date();
            const upcoming = fetchedEvents.filter(event => {
                const eventDate = new Date(event.date_time);
                return eventDate > now;
            }).sort((a, b) => {
                return new Date(a.date_time).getTime() - new Date(b.date_time).getTime();
            });

            setUpcomingEvents(upcoming);
        } catch (err: unknown) {
            console.error('Failed to delete event:', err);
            setError('Failed to delete event');
        }
    };

    const isUserRegistered = (event: Event): boolean => {
        if (!user) return false;
        return event.registered_players?.includes(user.id) || false;
    };

    const handleRegister = async (eventId: string) => {
        if (!token) {
            setError('You must be logged in to register');
            return;
        }

        try {
            await eventsAPI.registerForEvent(eventId, token);

            const fetchedEvents = await eventsAPI.listEvents();

            const now = new Date();
            const upcoming = fetchedEvents.filter(event => {
                const eventDate = new Date(event.date_time);
                return eventDate > now;
            }).sort((a, b) => {
                return new Date(a.date_time).getTime() - new Date(b.date_time).getTime();
            });

            setUpcomingEvents(upcoming);
            setError('');
        } catch (err: unknown) {
            console.error('Failed to register:', err);

            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Failed to register for event');
            }
        }
    };

    const handleUnregister = async (eventId: string) => {
        if (!token) return;

        try {
            await eventsAPI.unregisterFromEvent(eventId, token);

            const fetchedEvents = await eventsAPI.listEvents();

            const now = new Date();
            const upcoming = fetchedEvents.filter(event => {
                const eventDate = new Date(event.date_time);
                return eventDate > now;
            }).sort((a, b) => {
                return new Date(a.date_time).getTime() - new Date(b.date_time).getTime();
            });

            setUpcomingEvents(upcoming);
            setError('');
        } catch (err: unknown) {
            console.error('Failed to unregister:', err);

            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Failed to unregister from event');
            }
        }
    };



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
                        <EventsList
                            upcomingEvents={upcomingEvents}
                            userMap={userMap}
                            handleEditClick={handleEditClick}
                            handleDeleteEvent={handleDeleteEvent}
                            handleRegister={handleRegister}
                            handleUnregister={handleUnregister}
                            canManageEvent={canManageEvent}
                            isUserRegistered={isUserRegistered}
                        />
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
            </div>
        </div>
    );
}
