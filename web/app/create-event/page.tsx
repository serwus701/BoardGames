'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { eventsAPI, queueAPI } from '@/utils/api';
import { QueueItem } from '@/types/BoardGame';


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
    const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
    const [limitedQueueItems, setLimitedQueueItems] = useState<QueueItem[]>([]);

    async function fetchQueue() {
        try {
            const queue = await queueAPI.listQueue();

            const formattedQueue = queue.map((item) => ({
                id: item.id,
                name: item.name,
                lengthInHours: item.length_in_minutes / 60
            }));

            setQueueItems(formattedQueue ?? []);
        } catch {
            setQueueItems([]);
        }
    };

    useEffect(() => {
        const maxHours = formData.estimated_length_in_hours;
        if (!maxHours) {
            setLimitedQueueItems([]);
            return;
        }
        const limitedQueue = [];
        let accumulatedHours = 0;
        console.log(queueItems);
        for (const item of queueItems) {
            console.log(item, accumulatedHours, maxHours);
            if (accumulatedHours + item.lengthInHours <= parseFloat(maxHours)) {
                limitedQueue.push(item);
                accumulatedHours += item.lengthInHours;
            } else {
                break;
            }
        }
        setLimitedQueueItems(limitedQueue);
    }, [queueItems, formData.estimated_length_in_hours]);

    useEffect(() => {
        if (isAuthLoading) {
            return;
        }
        if (!isLoggedIn) {
            router.push('/login');
        }
        fetchQueue();
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

            const estimatedMinutes = formData.estimated_length_in_hours
                ? String(parseFloat(formData.estimated_length_in_hours) * 60)
                : undefined;

            const autoAssignedGames = limitedQueueItems
                .map((queueItem) => queueItem.id)
                .filter((gameId): gameId is number => typeof gameId === 'number');

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
        } catch (err: unknown) {
            console.error('Failed to create event:', err);
            const message =
                err instanceof Object && 'data' in err && err.data instanceof Object && 'detail' in err.data
                    ? String(err.data.detail)
                    : 'Failed to create event';
            setError(message);
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
                            <div className="space-y-2 max-h-48 overflow-auto border rounded p-3 bg-gray-50 text-black">
                                {queueItems.length === 0 && (
                                    <p className="text-sm text-gray-500 italic">No games in queue</p>
                                )}
                                {limitedQueueItems.map((queueItem) => {
                                    return (
                                        <div key={queueItem.id} className="flex items-center gap-2 text-sm text-gray-700">
                                            <span>{queueItem.name}</span>
                                            <span>{`(${queueItem.lengthInHours.toFixed(1)} hours)`}</span>
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

                </div>
            </div>
        </div>
    );
}
