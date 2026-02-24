'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { boardGames, sharedGameInstances } from '@/data/mockEvents';
import { gamesAPI } from '@/utils/api';

interface NewGameForm {
    name: string;
    playerCountsType: 'exact' | 'minMax' | 'minOnly';
    playerCountsExact: string;
    playerCountsMin: string;
    playerCountsMax: string;
    lengthInHours: string;
}

export default function OurGamesPage() {
    const { isLoggedIn, user, isLoading: isAuthLoading, token } = useAuth();
    const router = useRouter();
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showNewGameForm, setShowNewGameForm] = useState(false);
    const [newGameForm, setNewGameForm] = useState<NewGameForm>({
        name: '',
        playerCountsType: 'exact',
        playerCountsExact: '',
        playerCountsMin: '',
        playerCountsMax: '',
        lengthInHours: ''
    });

    useEffect(() => {
        if (isAuthLoading) {
            return;
        }
        if (!isLoggedIn) {
            router.push('/login');
        }
    }, [isLoggedIn, isAuthLoading, router]);

    if (isAuthLoading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <p className="text-gray-500">Loading...</p>
            </div>
        );
    }

    // Helper function to format minutes as hours
    const formatDuration = (minutes: number): string => {
        if (minutes < 60) {
            return `${minutes}m`;
        }
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (mins === 0) {
            return `${hours}h`;
        }
        return `${hours}h ${mins}m`;
    };

    // Helper function to format player counts based on their range
    // Accepts optional meta to distinguish min-only vs exact single values
    const formatPlayerCounts = (counts: number[], meta?: { type?: string; min?: number; max?: number }): string => {
        if (!counts || counts.length === 0) return '';

        if (meta?.type === 'minOnly' && typeof meta.min === 'number') {
            return `${meta.min}+`;
        }

        if (counts.length === 1) {
            // No meta indicating min-only, assume exact single value
            return `${counts[0]}`;
        }

        // Check if it's a consecutive range
        let isConsecutive = true;
        for (let i = 1; i < counts.length; i++) {
            if (counts[i] !== counts[i - 1] + 1) {
                isConsecutive = false;
                break;
            }
        }

        if (isConsecutive) {
            // Display as range
            return `${counts[0]}-${counts[counts.length - 1]}`;
        }

        // Display as comma-separated values
        return counts.join(', ');
    };

    if (!isLoggedIn) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <p className="text-gray-500">Redirecting to login...</p>
            </div>
        );
    }

    const handleNewGameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewGameForm((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddNewGame = async () => {
        // Validation
        if (!newGameForm.name.trim()) {
            setErrorMessage('Game name is required');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        let validPlayerCounts: number[] = [];

        // Parse player counts based on selected type
        if (newGameForm.playerCountsType === 'exact') {
            const playerCountsStr = newGameForm.playerCountsExact.trim();
            validPlayerCounts = playerCountsStr
                .split(',')
                .map((count) => {
                    const num = parseInt(count.trim());
                    return isNaN(num) ? null : num;
                })
                .filter((num) => num !== null && num > 0) as number[];

            if (validPlayerCounts.length === 0) {
                setErrorMessage('Please enter valid player counts (comma separated, e.g., 2, 3, 4)');
                setTimeout(() => setErrorMessage(''), 3000);
                return;
            }
        } else if (newGameForm.playerCountsType === 'minMax') {
            const min = parseInt(newGameForm.playerCountsMin.trim());
            const max = parseInt(newGameForm.playerCountsMax.trim());

            if (isNaN(min) || isNaN(max) || min < 1 || max < 1 || min > max) {
                setErrorMessage('Please enter valid min and max player counts');
                setTimeout(() => setErrorMessage(''), 3000);
                return;
            }

            // Generate array from min to max
            for (let i = min; i <= max; i++) {
                validPlayerCounts.push(i);
            }
        } else if (newGameForm.playerCountsType === 'minOnly') {
            const min = parseInt(newGameForm.playerCountsMin.trim());

            if (isNaN(min) || min < 1) {
                setErrorMessage('Please enter a valid minimum player count');
                setTimeout(() => setErrorMessage(''), 3000);
                return;
            }

            validPlayerCounts = [min];
        }

        if (validPlayerCounts.length === 0) {
            setErrorMessage('Please fill in player counts');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        if (!newGameForm.lengthInHours) {
            setErrorMessage('Please fill in game duration');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        const lengthInHours = parseFloat(newGameForm.lengthInHours);

        if (lengthInHours < 0.25) {
            setErrorMessage('Game duration must be at least 15 minutes (0.25 hours)');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        if (!token) {
            setErrorMessage('No authentication token found');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        // Convert hours to minutes for storage
        const lengthInMinutes = Math.round(lengthInHours * 60);

        try {
            // Send to API
            const apiResponse = await gamesAPI.createCustomGame(
                {
                    name: newGameForm.name,
                    valid_player_counts: validPlayerCounts,
                    length_in_minutes: lengthInMinutes
                },
                token
            );

            // Add game instance to shared collection
            try {
                await gamesAPI.addGameInstance(
                    {
                        custom_game_id: apiResponse.id
                    },
                    token
                );
            } catch (err) {
                console.error('Failed to add game to shared collection:', err);
            }

            // Update boardGames with new custom game and store playerCounts meta
            boardGames[apiResponse.id] = {
                id: apiResponse.id,
                name: apiResponse.name,
                description: undefined,
                validPlayerCounts: apiResponse.valid_player_counts,
                lengthInMinutes: apiResponse.length_in_minutes,
                playerCountsMeta: (newGameForm.playerCountsType === 'minOnly')
                    ? { type: 'minOnly', min: parseInt(newGameForm.playerCountsMin || '', 10) }
                    : (newGameForm.playerCountsType === 'minMax')
                        ? { type: 'minMax', min: parseInt(newGameForm.playerCountsMin || '', 10), max: parseInt(newGameForm.playerCountsMax || '', 10) }
                        : { type: 'exact' }
            };

            // Add to sharedGameInstances so it appears with contributors
            sharedGameInstances.push({
                id: `instance-${Date.now()}`,
                gameId: apiResponse.id,
                contributorId: user?.id || '',
                addedByName: user?.name || 'Unknown',
                addedAt: new Date()
            });

            setSuccessMessage(`"${apiResponse.name}" added to our collection!`);
            setTimeout(() => setSuccessMessage(''), 3000);

            // Reset form
            setNewGameForm({
                name: '',
                playerCountsType: 'exact',
                playerCountsExact: '',
                playerCountsMin: '',
                playerCountsMax: '',
                lengthInHours: ''
            });
            setShowNewGameForm(false);
        } catch (error: any) {
            console.error('Failed to create game:', error);
            setErrorMessage(error.message || 'Failed to create game');
            setTimeout(() => setErrorMessage(''), 3000);
        }
    };

    // Count instances of each game in the collection
    const gameInstanceMap: Record<string, number> = {};
    const gameContributors: Record<string, string[]> = {};

    sharedGameInstances.forEach((instance) => {
        gameInstanceMap[instance.gameId] = (gameInstanceMap[instance.gameId] || 0) + 1;
        if (!gameContributors[instance.gameId]) {
            gameContributors[instance.gameId] = [];
        }
        gameContributors[instance.gameId].push(instance.addedByName);
    });

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Our Game Collection</h1>
                    <p className="text-gray-600">
                        View and contribute to our shared board game collection. Every player can add games!
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

                {/* Shared Collection Summary */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
                    <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
                        <h2 className="text-2xl font-bold">
                            {Object.keys(gameInstanceMap).length} unique game{Object.keys(gameInstanceMap).length !== 1 ? 's' : ''} in our collection
                        </h2>
                        <p className="text-green-100 mt-2">
                            {sharedGameInstances.length} total instance{sharedGameInstances.length !== 1 ? 's' : ''} contributed by all players
                        </p>
                    </div>

                    <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Shared Games</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            {Object.values(boardGames).map((game) => {
                                const contributors = gameContributors[game.id] || [];

                                return (
                                    <div
                                        key={game.id}
                                        className="p-4 rounded-lg border-2 border-gray-200 bg-white hover:border-green-300 transition-all"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-lg text-gray-900">{game.name}</h3>
                                                {game.description && (
                                                    <p className="text-sm text-gray-600 mt-1">{game.description}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-3 space-y-1 text-sm text-gray-600">
                                            <p>
                                                <strong>Players:</strong> {formatPlayerCounts(game.validPlayerCounts, (game as any).playerCountsMeta)}
                                            </p>
                                            <p>
                                                <strong>Duration:</strong> {formatDuration(game.lengthInMinutes)}
                                            </p>
                                        </div>

                                        {contributors.length > 0 && (
                                            <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                                                <p className="font-semibold mb-1">Added by:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {contributors.map((name, idx) => (
                                                        <span key={idx} className="bg-gray-100 rounded px-2 py-1">
                                                            {name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Add Custom Game Section */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
                    <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold">
                                    Add New Game
                                </h2>
                                <p className="text-purple-100 mt-2">
                                    Create and add a new game to our collection
                                </p>
                            </div>
                            <button
                                onClick={() => setShowNewGameForm(!showNewGameForm)}
                                className="bg-white text-purple-600 font-semibold px-6 py-2 rounded-lg hover:bg-purple-50 transition-colors"
                            >
                                {showNewGameForm ? 'Cancel' : '+ New Game'}
                            </button>
                        </div>
                    </div>

                    {showNewGameForm && (
                        <div className="p-6 border-t border-gray-200">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Game Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={newGameForm.name}
                                        onChange={handleNewGameInputChange}
                                        placeholder="e.g., Carcassonne"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        Player Counts <span className="text-red-500">*</span>
                                    </label>

                                    <div className="space-y-3">
                                        {/* Radio buttons for player count type */}
                                        <div className="flex flex-col gap-3">
                                            <label className="flex items-center cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="playerCountsType"
                                                    value="exact"
                                                    checked={newGameForm.playerCountsType === 'exact'}
                                                    onChange={(e) => setNewGameForm(prev => ({ ...prev, playerCountsType: 'exact' as const }))}
                                                    className="w-4 h-4 text-purple-600"
                                                />
                                                <span className="ml-2 text-sm text-gray-700">Specific values (e.g., 2, 3, 5, 6)</span>
                                            </label>

                                            <label className="flex items-center cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="playerCountsType"
                                                    value="minMax"
                                                    checked={newGameForm.playerCountsType === 'minMax'}
                                                    onChange={(e) => setNewGameForm(prev => ({ ...prev, playerCountsType: 'minMax' as const }))}
                                                    className="w-4 h-4 text-purple-600"
                                                />
                                                <span className="ml-2 text-sm text-gray-700">Min-Max range (e.g., 2-6 players)</span>
                                            </label>

                                            <label className="flex items-center cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="playerCountsType"
                                                    value="minOnly"
                                                    checked={newGameForm.playerCountsType === 'minOnly'}
                                                    onChange={(e) => setNewGameForm(prev => ({ ...prev, playerCountsType: 'minOnly' as const }))}
                                                    className="w-4 h-4 text-purple-600"
                                                />
                                                <span className="ml-2 text-sm text-gray-700">Minimum only (e.g., 2+ players)</span>
                                            </label>
                                        </div>

                                        {/* Input fields based on selected type */}
                                        {newGameForm.playerCountsType === 'exact' && (
                                            <div>
                                                <input
                                                    type="text"
                                                    value={newGameForm.playerCountsExact}
                                                    onChange={(e) => setNewGameForm(prev => ({ ...prev, playerCountsExact: e.target.value }))}
                                                    placeholder="e.g., 2, 3, 4, 6"
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">Comma separated values</p>
                                            </div>
                                        )}

                                        {newGameForm.playerCountsType === 'minMax' && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={newGameForm.playerCountsMin}
                                                        onChange={(e) => setNewGameForm(prev => ({ ...prev, playerCountsMin: e.target.value }))}
                                                        placeholder="Min players"
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                    />
                                                </div>
                                                <div>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={newGameForm.playerCountsMax}
                                                        onChange={(e) => setNewGameForm(prev => ({ ...prev, playerCountsMax: e.target.value }))}
                                                        placeholder="Max players"
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {newGameForm.playerCountsType === 'minOnly' && (
                                            <div>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={newGameForm.playerCountsMin}
                                                    onChange={(e) => setNewGameForm(prev => ({ ...prev, playerCountsMin: e.target.value }))}
                                                    placeholder="Minimum players"
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">Players can be more than the minimum</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Duration (hours) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="lengthInHours"
                                        value={newGameForm.lengthInHours}
                                        onChange={handleNewGameInputChange}
                                        placeholder="e.g., 1, 1.5, 2"
                                        min="0.25"
                                        step="0.25"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Enter in hours (0.25 = 15 min, 0.5 = 30 min, 1 = 1 hour)</p>
                                </div>

                                <button
                                    onClick={handleAddNewGame}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors"
                                >
                                    Add Game to Collection
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-8 p-6 bg-purple-50 rounded-lg border border-purple-200">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">About Our Collection</h3>
                    <ul className="text-sm text-gray-700 space-y-2">
                        <li>✓ All players can contribute games to our shared collection</li>
                        <li>✓ You can see who has contributed each game</li>
                        <li>✓ Games are automatically selected from the collection for events</li>
                        <li>✓ Only the head admin can manage the game queue order</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
