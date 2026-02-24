'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { boardGames, gameQueue } from '@/data/mockEvents';

export default function GameQueueManagementPage() {
    const { isLoggedIn, user } = useAuth();
    const router = useRouter();
    const [queue, setQueue] = useState(gameQueue);
    const [selectedGameId, setSelectedGameId] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!isLoggedIn) {
            router.push('/login');
        }
    }, [isLoggedIn, router]);

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
        setSuccessMessage('Queue item moved up');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const handleMoveDown = (index: number) => {
        if (index === queue.length - 1) return;
        const newQueue = [...queue];
        [newQueue[index], newQueue[index + 1]] = [newQueue[index + 1], newQueue[index]];
        setQueue(newQueue);
        setSuccessMessage('Queue item moved down');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const handleRemove = (index: number) => {
        const newQueue = queue.filter((_, i) => i !== index);
        setQueue(newQueue);
        setSuccessMessage('Item removed from queue');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const handleAddGameToQueue = () => {
        if (!selectedGameId) {
            setErrorMessage('Please select a game to add');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        // Find the game
        let gameName = '';
        const gameRef = boardGames[selectedGameId as keyof typeof boardGames];

        if (gameRef) {
            gameName = gameRef.name;
        }

        // Create new queue item
        const newQueueItem = {
            id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            gameInstanceId: `instance-${selectedGameId}-${Date.now()}`,
            gameId: selectedGameId,
            addedByName: user?.name || 'Unknown',
            addedAt: new Date()
        };

        setQueue([...queue, newQueueItem]);
        setSuccessMessage(`"${gameName}" added to queue!`);
        setTimeout(() => setSuccessMessage(''), 3000);
        setSelectedGameId('');
    };

    const handleSave = () => {
        setSuccessMessage('Queue updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const getGame = (gameId: string) => {
        const game = boardGames[gameId as keyof typeof boardGames];
        return game ? { name: game.name, isCustom: false } : { name: 'Unknown Game', isCustom: false };
    };

    // All games for the dropdown
    const allGames = Object.values(boardGames).map(g => ({ id: g.id, name: g.name }));

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

                {/* Add Games to Queue Section */}
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
                                    value={selectedGameId}
                                    onChange={(e) => setSelectedGameId(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="">Choose a game...</option>
                                    {allGames.map((game) => (
                                        <option key={game.id} value={game.id}>
                                            {game.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={handleAddGameToQueue}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors"
                            >
                                Add Game to Queue
                            </button>
                        </div>
                    </div>
                </div>

                {/* Queue Management Section */}
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
                                const game = getGame(item.gameId);

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
                                            <h3 className="text-lg font-bold text-gray-900">
                                                {game.name}
                                            </h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                <strong>Added by:</strong> {item.addedByName}
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
                                                    onClick={() => handleRemove(index)}
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

                    {isAdmin && (
                        <div className="bg-gray-50 border-t p-6">
                            <button
                                onClick={handleSave}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
                            >
                                Save Queue Changes
                            </button>
                        </div>
                    )}
                </div>

                <div className="mt-8 grid md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                        <h3 className="font-bold text-lg text-gray-900 mb-2">How the Queue Works</h3>
                        <ul className="text-sm text-gray-700 space-y-2">
                            <li>✓ Any player can add games to the queue</li>
                            <li>✓ Games at top of queue are selected first for events</li>
                            <li>✓ Only head admins can reorder and remove games</li>
                            <li>✓ Support both standard and custom games</li>
                        </ul>
                    </div>

                    {isAdmin && (
                        <div className="bg-red-50 rounded-lg border border-red-200 p-6">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="inline-block bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                    ADMIN
                                </span>
                                <h3 className="font-bold text-lg text-gray-900">Queue Management</h3>
                            </div>
                            <ul className="text-sm text-gray-700 space-y-2">
                                <li>✓ Reorder games to change priority</li>
                                <li>✓ Remove games from queue</li>
                                <li>✓ Control which games are selected for events</li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
