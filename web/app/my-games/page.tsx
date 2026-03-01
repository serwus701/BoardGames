'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { gamesAPI } from '@/services/gamesApi';
import { AddGame } from './AddGame';
import { BoardGame } from '@/types/BoardGame';



export default function OurGamesPage() {
    const { isLoggedIn, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();

    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const [boardGames, setBoardGames] = useState<BoardGame[]>([]);
    const [isLoadingGames, setIsLoadingGames] = useState(false);

    const loadGames = async () => {
        setIsLoadingGames(true);
        try {
            const games = await gamesAPI.listBoardGames();
            setBoardGames(games);
        } catch (err) {
            console.error('Failed to load games data', err);
            setErrorMessage('Failed to load games');
            setTimeout(() => setErrorMessage(''), 3000);
        } finally {
            setIsLoadingGames(false);
        }
    };

    useEffect(() => {
        if (isAuthLoading) return;

        if (!isLoggedIn) {
            router.push('/login');
            return;
        }

        loadGames();
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

    const formatDuration = (minutes: number): string => {
        if (!minutes || minutes <= 0) return '';
        if (minutes < 60) return `${minutes}m`;

        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
    };

    const formatPlayerCounts = (
        counts: number[],
        meta?: { type?: string; min?: number; max?: number }
    ): string => {
        if (!counts || counts.length === 0) return '';

        if (meta?.type === 'minOnly' && typeof meta.min === 'number') {
            return `${meta.min}+`;
        }

        if (counts.length === 1) return `${counts[0]}`;

        let consecutive = true;
        for (let i = 1; i < counts.length; i++) {
            if (counts[i] !== counts[i - 1] + 1) {
                consecutive = false;
                break;
            }
        }

        return consecutive ? `${counts[0]}-${counts[counts.length - 1]}` : counts.join(', ');
    };


    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">Games</h1>
                        <p className="text-gray-600">List of games available in the system.</p>
                    </div>
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

                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-6 border-b">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {boardGames.length} game{boardGames.length !== 1 ? 's' : ''}
                        </h2>
                    </div>

                    <div className="p-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            {boardGames.map((game) => (
                                <div
                                    key={game.id}
                                    className="p-4 rounded-lg border-2 border-gray-200 bg-white hover:border-green-300 transition-all"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg text-gray-900">{game.name}</h3>
                                        </div>
                                    </div>

                                    {/* <div className="mt-3 space-y-1 text-sm text-gray-600">
                                        {!!game.validPlayerCounts?.length && (
                                            <p>
                                                <strong>Players:</strong>{' '}
                                                {formatPlayerCounts(
                                                    game.validPlayerCounts,
                                                    (game as BoardGameWithMeta).playerCountsMeta
                                                )}
                                            </p>
                                        )}
                                        {!!game.lengthInMinutes && (
                                            <p>
                                                <strong>Duration:</strong> {formatDuration(game.lengthInMinutes)}
                                            </p>
                                        )}
                                    </div> */}
                                </div>
                            ))}

                            {boardGames.length === 0 && (
                                <p className="text-gray-500">No games found.</p>
                            )}
                        </div>
                    </div>
                </div>
                <AddGame
                    setErrorMessage={setErrorMessage}
                    setSuccessMessage={setSuccessMessage}
                    refreshGamesList={loadGames}
                />

            </div>
        </div>
    );
}