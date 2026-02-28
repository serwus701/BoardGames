import { useAuth } from "@/context/AuthContext";
import { EventGameForm } from "@/types/BoardGame";
import { gamesAPI } from "@/services/gamesApi";
import { useState } from "react";

interface AddGameProps {
    setErrorMessage: (msg: string) => void;
    setSuccessMessage: (msg: string) => void;
    refreshGamesList: () => void;
}

const baseEventGameForm: EventGameForm = {
    name: '',
    playerCountsType: 'range',
    playerCountsExact: [1, 2],
    playerCountsMin: 0,
    playerCountsMax: 0,
    lengthInHours: 0
}


export const AddGame = (props: AddGameProps) => {
    const { setErrorMessage, setSuccessMessage, refreshGamesList } = props;
    const { token } = useAuth();

    const [showNewGameForm, setShowNewGameForm] = useState(false);
    const [newGameForm, setNewGameForm] = useState<EventGameForm>(baseEventGameForm);
    const [specificValuesInput, setSpecificValuesInput] = useState('');

    const handleSpecificValuesInputChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const value = e.target.value;

        if (value === '') {
            setSpecificValuesInput('');
            return;
        }

        if (!/^\d+$/.test(value)) {
            return;
        }

        const numericValue = Number(value);

        if (numericValue >= 100) {
            return;
        }

        setSpecificValuesInput(value);
    };

    const handleAddValue = () => {
        if (specificValuesInput === '') {
            return;
        }
        const newValue = parseInt(specificValuesInput, 10);
        if (isNaN(newValue) || newValue < 1) {
            setErrorMessage('Please enter a valid positive integer for player count');
            return;
        }
        if (newGameForm.playerCountsExact.includes(newValue)) {
            setErrorMessage('This player count is already added');
            return;
        }

        const newList = [...newGameForm.playerCountsExact, newValue].sort((a, b) => a - b);
        setNewGameForm(prev => ({ ...prev, playerCountsExact: newList }));
        setSpecificValuesInput('');
    };

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
            return;
        }

        if (newGameForm.playerCountsType === 'specific') {
            if (newGameForm.playerCountsExact.length === 0) {
                setErrorMessage('Please enter valid player counts (comma separated, e.g., 2, 3, 4)');
                return;
            }
        } else if (newGameForm.playerCountsType === 'range') {
            const min = newGameForm.playerCountsMin;
            const max = newGameForm.playerCountsMax;

            if (isNaN(min) || isNaN(max) || min < 1 || max < 1 || min > max) {
                setErrorMessage('Please enter valid min and max player counts');
                return;
            }

            if (min === max) {
                setErrorMessage('Min and max player counts cannot be the same for min-max type. Please use the "Specific values" option instead.');
                return;
            }

        } else if (newGameForm.playerCountsType === 'minimum') {
            const min = newGameForm.playerCountsMin;

            if (isNaN(min) || min < 1) {
                setErrorMessage('Please enter a valid minimum player count');
                return;
            }
        }

        if (!newGameForm.lengthInHours || newGameForm.lengthInHours === 0) {
            setErrorMessage('Please fill in game duration');
            return;
        }

        if (newGameForm.lengthInHours < 0.25) {
            setErrorMessage('Game duration must be at least 15 minutes (0.25 hours)');
            return;
        }

        if (!token) {
            setErrorMessage('No authentication token found');
            return;
        }

        const lengthInMinutes = Math.round(newGameForm.lengthInHours * 60);

        try {
            const apiResponse = await gamesAPI.createBoardGame(
                {
                    name: newGameForm.name,
                    length_in_minutes: lengthInMinutes,
                    player_count_type: newGameForm.playerCountsType,
                    min_players: newGameForm.playerCountsMin,
                    max_players: newGameForm.playerCountsMax,
                    valid_player_counts: newGameForm.playerCountsExact
                },
                token
            );

            refreshGamesList()

            setSuccessMessage(`"${apiResponse.name}" added to our collection!`);

            setNewGameForm(baseEventGameForm);
            setShowNewGameForm(false);
        } catch (error) {
            console.error('Failed to create game:', error);
            let errMsg = 'Failed to create game';
            if (error && typeof error === 'object') {
                const e = error as { message?: unknown };
                if (typeof e.message === 'string') errMsg = e.message;
            }
            setErrorMessage(errMsg);
        }
    };

    const handleValueRemove = (value: number) => {
        const currentValues = newGameForm.playerCountsExact || [];
        const updatedValues = currentValues.filter(v => v !== value);
        setNewGameForm(prev => ({ ...prev, playerCountsExact: updatedValues }));
    }

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
                                    <div className="flex flex-col gap-3">


                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                name="playerCountsType"
                                                value="range"
                                                checked={newGameForm.playerCountsType === 'range'}
                                                onChange={(e) => setNewGameForm(prev => ({ ...prev, playerCountsType: 'range' as const }))}
                                                className="w-4 h-4 text-purple-600"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Min-Max range (e.g., 2-6 players)</span>
                                        </label>

                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                name="playerCountsType"
                                                value="minimum"
                                                checked={newGameForm.playerCountsType === 'minimum'}
                                                onChange={(e) => setNewGameForm(prev => ({ ...prev, playerCountsType: 'minimum' as const }))}
                                                className="w-4 h-4 text-purple-600"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Minimum only (e.g., 2+ players)</span>
                                        </label>
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                name="playerCountsType"
                                                value="specific"
                                                checked={newGameForm.playerCountsType === 'specific'}
                                                onChange={(e) => setNewGameForm(prev => ({ ...prev, playerCountsType: 'specific' as const }))}
                                                className="w-4 h-4 text-purple-600"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Specific values (e.g., 2, 3, 5, 6)</span>
                                        </label>
                                    </div>

                                    {newGameForm.playerCountsType === 'specific' && (
                                        <div>
                                            <div className="flex flex-row">
                                                {newGameForm.playerCountsExact.map((value, idx) => (
                                                    <p
                                                        className="text-white w-10 h-10 bg-blue-800 rounded-md items-center flex justify-center mr-2 my-2 cursor-pointer"
                                                        key={idx}
                                                        onClick={() => handleValueRemove(value)}
                                                    >
                                                        {value}
                                                    </p>
                                                ))}
                                            </div>

                                            <input
                                                value={specificValuesInput}
                                                onChange={handleSpecificValuesInputChange}
                                                className="w-20 text-center justify-center px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            />
                                            <button className="cursor-pointer ml-2 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500" onClick={handleAddValue}>Add</button>
                                        </div>
                                    )}

                                    {newGameForm.playerCountsType === 'range' && (
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

                                    {newGameForm.playerCountsType === 'minimum' && (
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