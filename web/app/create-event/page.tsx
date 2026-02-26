'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { eventsAPI, queueAPI, gamesAPI } from '@/utils/api';

export default function CreateEventPage() {
    const { isLoggedIn, user, token, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const [formData, setFormData] = useState({
        date_time: '',
        estimated_length_in_hours: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [queueItems, setQueueItems] = useState<any[]>([]);
    const [boardGamesMap, setBoardGamesMap] = useState<Record<number, any>>({});

    useEffect(() => {
        if (isAuthLoading) {
            return;
        }
        if (!isLoggedIn) {
            router.push('/login');
        }
        // load queue + games for assignment suggestions
        (async () => {
            try {
                const [queue, games] = await Promise.all([queueAPI.listQueue(), gamesAPI.listBoardGames()]);
                setQueueItems(queue || []);
                const map: Record<number, any> = {};
                (games || []).forEach((g: any) => (map[Number(g.id)] = g));
                setBoardGamesMap(map);
            } catch (e) {
                // ignore
            }
        })();
    }, [isLoggedIn, isAuthLoading, router]);

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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.date_time) {
            setError('Please fill in date and time');
            return;
        }

        if (!user?.home_address) {
            setError('Please set your home address in your profile first');
            return;
        }

        if (!token) {
            setError('Not authenticated');
            return;
        }

        try {
            setIsLoading(true);

            // Convert hours to minutes for backend
            const estimatedMinutes = formData.estimated_length_in_hours
                ? String(parseFloat(formData.estimated_length_in_hours) * 60)
                : undefined;

            // Auto-assign all queue items to the event
            const autoAssignedGames = queueItems.map(qi => qi.id);

            await eventsAPI.createEvent(
                {
                    date_time: formData.date_time,
                    location: user.home_address,
                    organizer_id: user.id,
                    estimated_length_in_minutes: estimatedMinutes,
                    selected_games: autoAssignedGames
                },
                token
            );

            setSuccessMessage('Event created successfully!');
            setTimeout(() => {
                router.push('/events');
            }, 1500);
        } catch (err: any) {
            console.error('Failed to create event:', err);
            setError(err.data?.detail || 'Failed to create event');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Create New Event</h1>
                    <p className="text-gray-600">Schedule a board game event and manage it</p>
                </div>

                {successMessage && (
                    <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg border border-green-300">
                        {successMessage}
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg border border-red-300">
                        {error}
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-md p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <h3 className="font-semibold text-blue-900 mb-2">Create an Event:</h3>
                            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                                <li>Provide a date and time for your event</li>
                                <li>Location will be automatically set to your home address from profile</li>
                                <li>Optionally estimate how long the event will run (in hours)</li>
                                <li>Other users can register and you can manage the event</li>
                            </ol>
                        </div>

                        {!user?.home_address && (
                            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6">
                                <p className="text-yellow-800 font-semibold">⚠️ No home address set</p>
                                <p className="text-sm text-yellow-700 mt-1">
                                    Please set your home address in your <a href="/profile" className="underline">profile</a> before creating an event.
                                </p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Date & Time <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                name="date_time"
                                value={formData.date_time}
                                onChange={handleInputChange}
                                required
                                disabled={isLoading}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                            />
                            <p className="text-xs text-gray-500 mt-1">Only future dates are allowed</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Location (from your profile)
                            </label>
                            <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                                {user?.home_address || 'Not set - please update your profile'}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Update your home address in your profile to change this</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Estimated Duration (hours)
                            </label>
                            <input
                                type="number"
                                name="estimated_length_in_hours"
                                value={formData.estimated_length_in_hours}
                                onChange={handleInputChange}
                                placeholder="e.g., 3"
                                step="0.5"
                                min="0"
                                disabled={isLoading}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                            />
                            <p className="text-xs text-gray-500 mt-1">Optional - how many hours you expect the event to last</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Games for next session
                            </label>
                            <div className="space-y-2 max-h-48 overflow-auto border rounded p-3 bg-gray-50">
                                {queueItems.length === 0 && (
                                    <p className="text-sm text-gray-500 italic">No games in queue</p>
                                )}
                                {queueItems.map((qi) => {
                                    const gid = qi.game_id ?? qi.gameId;
                                    const game = boardGamesMap[Number(gid)];
                                    const label = game ? `${game.name}` : `Game #${gid}`;
                                    return (
                                        <div key={qi.id} className="flex items-center gap-2 text-sm text-gray-700">
                                            <span className="text-green-600">✓</span>
                                            <span>{label}</span>
                                            {/* <span>{game.}</span> */}
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                All queue items will be automatically assigned to this event and removed from the global queue.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors mt-8"
                        >
                            {isLoading ? 'Creating Event...' : 'Create Event'}
                        </button>
                    </form>

                    <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Event Preview</h3>
                        <div className="space-y-2 text-sm text-gray-700">
                            <p>
                                <span className="font-semibold">Organizer:</span> {user?.full_name || user?.email || 'Not logged in'}
                            </p>
                            <p>
                                <span className="font-semibold">Date & Time:</span> {formData.date_time ? new Date(formData.date_time).toLocaleString() : 'Not selected'}
                            </p>
                            <p>
                                <span className="font-semibold">Location:</span> {user?.home_address || 'Not set in profile'}
                            </p>
                            {formData.estimated_length_in_hours && (
                                <p>
                                    <span className="font-semibold">Duration:</span> {formData.estimated_length_in_hours} hours
                                </p>
                            )}
                            <p className="text-xs text-gray-500 mt-3">You will be able to edit the date/time and duration after creation</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
