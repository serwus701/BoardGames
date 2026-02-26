import { useAuth } from "@/context/AuthContext";
import { EventGame } from "@/types/BoardGame";
import { gamesAPI } from "@/utils/api";
import { useState } from "react";

interface AddGameProps {
    setErrorMessage: (msg: string) => void;
    setSuccessMessage: (msg: string) => void;
    setBoardGames?: (updater: any) => void;
}


export const AddGame = (props: AddGameProps) => {
    const { setErrorMessage, setSuccessMessage, setBoardGames } = props;
    const { token } = useAuth();

    const [showNewGameForm, setShowNewGameForm] = useState(false);
    const [newGameForm, setNewGameForm] = useState<EventGame>({
        name: '',
        playerCountsType: 'minMax',
        playerCountsExact: [],
        playerCountsMin: 0,
        playerCountsMax: 0,
        lengthInHours: 0,
    });

    const handleNewGameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewGameForm((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddNewGame = async () => {
        if (!newGameForm.name.trim()) {
            setErrorMessage('Game name is required');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        let validPlayerCounts: number[] = [];

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

            // Add game instance to shared collection (legacy param `custom_game_id` is accepted)
            try {
                await gamesAPI.addGameInstance({ custom_game_id: `${apiResponse.id}` }, token);
            } catch (err) {
                console.error('Failed to add game to shared collection:', err);
            }

            // Update boardGames map with new custom game and store playerCounts meta
            if (setBoardGames) {
                setBoardGames(prev => ({
                    ...prev,
                    [apiResponse.id]: {
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
                    }
                }));
            }

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
        } catch (error) {
            console.error('Failed to create game:', error);
            // Try to read message if available
            let errMsg = 'Failed to create game';
            if (error && typeof error === 'object') {
                const e = error as { message?: unknown };
                if (typeof e.message === 'string') errMsg = e.message;
            }
            setErrorMessage(errMsg);
            setTimeout(() => setErrorMessage(''), 3000);
        }
    };

    return (
        <>
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
        </>
    );
}