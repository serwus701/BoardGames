import { User } from '@/types';
import { Event } from '@/types/Event';



interface EventsListProps {
    upcomingEvents: Event[];
    userMap: { [key: string]: User };
    handleEditClick: (event: Event) => void;
    handleDeleteEvent: (eventId: string) => void;
    handleRegister: (eventId: string) => void;
    handleUnregister: (eventId: string) => void;
    canManageEvent: (event: Event) => boolean;
    isUserRegistered: (event: Event) => boolean;

}

export const EventsList = (props: EventsListProps) => {
    const { upcomingEvents, userMap, handleEditClick, handleDeleteEvent, handleRegister, handleUnregister, canManageEvent, isUserRegistered } = props;

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

    const calculateTotalGameTime = (games: Array<Record<string, unknown>>) => {
        return games.reduce((sum, game) => {
            const g = game as Record<string, unknown>;
            const minutes = Number(g['length_in_minutes'] ?? g['lengthInMinutes'] ?? 0) || 0;
            return sum + minutes;
        }, 0);
    };

    return (
        <>
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
                                            <p className="font-semibold">{organizer.name}</p>
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
                                const eventGames = event.event_games ?? [];
                                const totalGameTime = calculateTotalGameTime(eventGames);
                                const eventDuration = event.estimated_length_in_minutes
                                    ? parseFloat(event.estimated_length_in_minutes)
                                    : 0;

                                return eventGames.length > 0 && (
                                    <div className="bg-green-50 rounded-lg p-4 mb-4 border-2 border-green-200">
                                        <div className="flex justify-between items-center mb-3">
                                            <p className="text-sm font-semibold text-gray-900">
                                                Games for this Event ({eventGames.length})
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                Total: {(totalGameTime / 60).toFixed(1)}h
                                                {eventDuration > 0 && ` / ${(eventDuration / 60).toFixed(1)}h available`}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            {eventGames.map(game => (
                                                <div
                                                    key={game.id}
                                                    className="bg-white border border-green-200 rounded-lg p-3 flex justify-between items-center"
                                                >
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{(game as any).name}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {(game as any).valid_player_counts?.join?.(', ')} players
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-500">
                                                            {((Number((game as any).length_in_minutes ?? (game as any).lengthInMinutes ?? 0) || 0) / 60).toFixed(1)} h
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
        </>
    )
}