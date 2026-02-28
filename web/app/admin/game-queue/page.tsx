'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { queueAPI } from '@/services/queueApi';
import { gamesAPI } from '@/services/gamesApi';
import { BoardGame, QueueItem } from '@/types/BoardGame';



export default function GameQueueManagementPage() {
    const { isLoggedIn, user, isLoading: isAuthLoading, token } = useAuth();
    const router = useRouter();
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [selectedGame, setSelectedGame] = useState<BoardGame | null>(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [boardGames, setBoardGames] = useState<BoardGame[]>([]);
    const [areUnsavedChanges, setAreUnsavedChanges] = useState(false);

    useEffect(() => {
        if (isAuthLoading) {
            return;
        }
        if (!isLoggedIn) {
            router.push('/login');
            return;
        }

        gamesAPI.listBoardGames().then((games) => {
            setBoardGames(games);
        }).catch(() => {
            setBoardGames([]);
        });

        queueAPI
            .listQueue()
            .then((queue) => {
                const formattedQueue = queue.map((item) => ({
                    id: item.id,
                    name: item.name,
                    lengthInHours: item.length_in_minutes / 60
                }));
                setQueue(formattedQueue ?? []);
            })
            .catch(() => {
                setQueue([]);
            });
    }, [isLoggedIn, isAuthLoading, router]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (areUnsavedChanges) {
                e.preventDefault();
                e.returnValue = 'Unsaved changes in queue. Are you sure you want to leave?';
                return 'Unsaved changes in queue. Are you sure you want to leave?';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [areUnsavedChanges]);

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

    const isAdmin = user?.role === 'head-admin';

    const handleMoveUp = (index: number) => {
        if (index === 0) return;
        const newQueue = [...queue];
        [newQueue[index - 1], newQueue[index]] = [newQueue[index], newQueue[index - 1]];
        setQueue(newQueue);
        setAreUnsavedChanges(true);
    };

    const handleMoveDown = (index: number) => {
        if (index === queue.length - 1) return;
        const newQueue = [...queue];
        [newQueue[index], newQueue[index + 1]] = [newQueue[index + 1], newQueue[index]];
        setQueue(newQueue);
        setSuccessMessage('Queue item moved down');
        setAreUnsavedChanges(true);
    };

    const handleAddGameToQueue = () => {
        if (!selectedGame) {
            setErrorMessage('Please select a game to add');
            return;
        }


        const newQueueItem: QueueItem = {
            id: selectedGame.id,
            name: selectedGame.name,
            lengthInHours: selectedGame.lengthInMinutes / 60,
        };

        setQueue([...queue, newQueueItem]);
        setSuccessMessage(`"${selectedGame.name}" added to queue!`);
        setSelectedGame(null);
        setAreUnsavedChanges(true);
    };

    const handleSave = () => {
        if (!user || !token) {
            setErrorMessage('Not authenticated');
            return;
        }

        const queuePayload = queue.reduce((acc: string[], item) => {
            acc.push(item.id.toString());
            return acc;
        }, []);

        queueAPI.reorderQueue(queuePayload, token).then(() => {
            setSuccessMessage('Queue updated successfully!');
            setAreUnsavedChanges(false);
        }).catch((err) => {
            console.error('Failed to save queue order', err);
            setErrorMessage('Failed to save queue order');
        });
    }

    const handleRemoveFromQueue = (queueItemId: number) => {
        const newQueue = queue.filter(item => item.id !== queueItemId);
        console.log('Removing queue item with id:', queueItemId);
        console.log('New queue after removal:', newQueue);
        setQueue(newQueue);
        setAreUnsavedChanges(true);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Game Queue</h1>
                    <p className="text-gray-600">
                        Add games to the queue and manage upcoming game selections
                    </p>
                </div>

                {successMessage && (
                    <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg border border-green-300">
                        {successMessage}
                    </div>
                )}

                {errorMessage && (
                    <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg border border-red-300">
                        {errorMessage}
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
                    <div className="bg-linear-to-r from-purple-600 to-purple-700 text-white p-6">
                        <h2 className="text-2xl font-bold">Add Games to Queue</h2>
                        <p className="text-purple-100 mt-2">
                            Select a game to add to the queue
                        </p>
                    </div>

                    <div className="p-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Select Game <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedGame?.id || ''}
                                    onChange={(e) => setSelectedGame(boardGames.find(game => game.id === Number(e.target.value)) || null)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="">Choose a game...</option>
                                    {boardGames.map((game) => (
                                        <option key={game.id} value={game.id}>
                                            {game.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                disabled={!selectedGame}
                                onClick={handleAddGameToQueue}
                                className={`w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors ${!selectedGame ? 'opacity-50' : 'cursor-pointer'}`}
                            >
                                Add Game to Queue
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="bg-linear-to-r from-blue-600 to-blue-700 text-white p-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold">
                                    Queue: {queue.length} game{queue.length !== 1 ? 's' : ''}
                                </h2>
                                {isAdmin && (
                                    <p className="text-blue-100 mt-2">
                                        Admin mode: You can reorder and manage the queue
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {queue.length === 0 ? (
                        <div className="p-6">
                            <p className="text-gray-500 text-center py-8">
                                Queue is empty. Add games to get started.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {queue.map((item, index) => {

                                return (
                                    <div
                                        key={item.id}
                                        className="p-6 bg-white hover:bg-gray-50 transition-colors flex items-center gap-4"
                                    >
                                        <div className="shrink-0">
                                            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                                                <span className="text-lg font-bold text-blue-600">
                                                    {index + 1}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex-1">
                                            <div className='flex flex-row text-black items-center space-x-2'>
                                                <h3 className="text-lg font-bold text-gray-900">
                                                    {item.name}
                                                </h3>
                                                <h2>{item.lengthInHours.toFixed(1)} minutes</h2>
                                            </div>

                                            <p className="text-sm text-gray-600 mt-1">
                                                <strong>Added by: NO INFO FROM DB</strong>
                                            </p>

                                        </div>

                                        {isAdmin && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleMoveUp(index)}
                                                    disabled={index === 0}
                                                    className="px-3 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-700 rounded transition-colors"
                                                    title="Move up in queue"
                                                >
                                                    ↑
                                                </button>
                                                <button
                                                    onClick={() => handleMoveDown(index)}
                                                    disabled={index === queue.length - 1}
                                                    className="px-3 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-700 rounded transition-colors"
                                                    title="Move down in queue"
                                                >
                                                    ↓
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveFromQueue(item.id)}
                                                    className="px-3 py-2 bg-red-200 hover:bg-red-300 text-red-700 rounded transition-colors"
                                                    title="Remove from queue"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <div className="bg-gray-50 border-t p-6">
                        <button
                            disabled={!areUnsavedChanges}
                            onClick={handleSave}
                            className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors ${!areUnsavedChanges ? 'opacity-50' : 'cursor-pointer'}`}
                        >
                            Save Queue Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
