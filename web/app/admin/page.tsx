'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usersAPI } from '@/services/userApi';
import { gamesAPI } from '@/services/gamesApi';
import { RegistrationRequest } from '@/types/auth';

export default function AdminPage() {
    const { isLoggedIn, user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'registrations' | 'users' | 'games' | 'locations'>('registrations');
    const [registrationRequests, setRegistrationRequests] = useState<RegistrationRequest[]>([]);
    const [successMessage, setSuccessMessage] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [boardGames, setBoardGames] = useState<Record<number, any>>({});
    const [locations, setLocations] = useState<any[]>([]);

    useEffect(() => {
        if (isAuthLoading) {
            return;
        }
        if (!isLoggedIn || user?.role !== 'head-admin') {
            router.push('/');
        }
        // Load users and board games for admin UI
        (async () => {
            try {
                const [fetchedUsers, fetchedGames] = await Promise.all([
                    usersAPI.listUsers(),
                    gamesAPI.listBoardGames()
                ]);

                setUsers(fetchedUsers || []);

                const gamesMap: Record<number, any> = {};
                (fetchedGames || []).forEach((g: any) => {
                    gamesMap[g.id] = {
                        id: g.id,
                        name: g.name,
                        description: g.description,
                        validPlayerCounts: g.valid_player_counts || [],
                        lengthInMinutes: g.length_in_minutes || 0
                    };
                });
                setBoardGames(gamesMap);
            } catch (err) {
                console.error('Failed to load admin data', err);
            }
        })();
    }, [isLoggedIn, user, isAuthLoading, router]);

    if (isAuthLoading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <p className="text-gray-500">Loading...</p>
            </div>
        );
    }

    if (!isLoggedIn || user?.role !== 'head-admin') {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <p className="text-gray-500">Redirecting...</p>
            </div>
        );
    }

    const handleApproveRegistration = (id: string) => {
        setRegistrationRequests(
            registrationRequests.map((req) =>
                req.id === id
                    ? {
                        ...req,
                        status: 'approved' as const,
                        respondedAt: new Date(),
                        respondedBy: user?.name
                    }
                    : req
            )
        );
        showSuccess('Registration approved!');
    };

    const handleRejectRegistration = (id: string) => {
        setRegistrationRequests(
            registrationRequests.map((req) =>
                req.id === id
                    ? {
                        ...req,
                        status: 'rejected' as const,
                        respondedAt: new Date(),
                        respondedBy: user?.name
                    }
                    : req
            )
        );
        showSuccess('Registration rejected!');
    };

    const showSuccess = (message: string) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const formatDateTime = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).format(date);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved':
                return 'bg-green-100 text-green-800 border border-green-300';
            case 'rejected':
                return 'bg-red-100 text-red-800 border border-red-300';
            default:
                return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-12 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Panel</h1>
                    <p className="text-gray-600">Manage users, games, locations, and registration requests</p>
                </div>

                {successMessage && (
                    <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg border border-green-300">
                        {successMessage}
                    </div>
                )}

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                    <div className="flex border-b">
                        <button
                            onClick={() => setActiveTab('registrations')}
                            className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${activeTab === 'registrations'
                                ? 'bg-blue-600 text-white border-b-0'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            Registration Requests ({registrationRequests.filter((r) => r.status === 'pending').length})
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${activeTab === 'users'
                                ? 'bg-blue-600 text-white border-b-0'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            Users ({users.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('games')}
                            className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${activeTab === 'games'
                                ? 'bg-blue-600 text-white border-b-0'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            Games ({Object.keys(boardGames).length})
                        </button>
                        <button
                            onClick={() => setActiveTab('locations')}
                            className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${activeTab === 'locations'
                                ? 'bg-blue-600 text-white border-b-0'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            Locations ({locations.length})
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {/* Registration Requests Tab */}
                        {activeTab === 'registrations' && (
                            <div className="space-y-4">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Registration Requests</h2>
                                {registrationRequests.length === 0 ? (
                                    <p className="text-gray-500">No registration requests</p>
                                ) : (
                                    <div className="space-y-4">
                                        {registrationRequests.map((request) => (
                                            <div
                                                key={request.id}
                                                className={`p-4 rounded-lg border ${getStatusColor(request.status)}`}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h3 className="font-bold text-lg">{request.name}</h3>
                                                        <p className="text-sm opacity-90">{request.email}</p>
                                                        {request.phone && <p className="text-sm opacity-90">{request.phone}</p>}
                                                    </div>
                                                    <span className="capitalize font-semibold">{request.status}</span>
                                                </div>
                                                <p className="text-xs opacity-75 mb-3">
                                                    Requested: {formatDateTime(request.requestedAt)}
                                                </p>
                                                {request.status === 'pending' && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleApproveRegistration(request.id)}
                                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded transition-colors"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectRegistration(request.id)}
                                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded transition-colors"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                                {request.respondedAt && request.respondedBy && (
                                                    <p className="text-xs opacity-75 mt-2">
                                                        {request.status === 'approved' ? 'Approved' : 'Rejected'} by {request.respondedBy} on{' '}
                                                        {formatDateTime(request.respondedAt)}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Users Tab */}
                        {activeTab === 'users' && (
                            <div className="space-y-4">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Registered Users</h2>
                                <div className="grid gap-4">
                                    {users.map((u) => (
                                        <div key={u.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-bold text-lg">{u.name}</h3>
                                                    <p className="text-sm text-gray-600">{u.email}</p>
                                                    <p className="text-sm text-gray-600">{u.homeAddress}</p>
                                                </div>
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${u.role === 'head-admin'
                                                        ? 'bg-purple-100 text-purple-800'
                                                        : 'bg-blue-100 text-blue-800'
                                                        }`}
                                                >
                                                    {u.role === 'head-admin' ? 'Head Admin' : 'User'}
                                                </span>
                                            </div>
                                            {u.ownedGames && u.ownedGames.length > 0 && (
                                                <div className="mt-2">
                                                    <p className="text-xs font-semibold text-gray-700 mb-1">Owned Games:</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {u.ownedGames.map((gameId: string | number) => (
                                                            <span key={gameId} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                                                {boardGames[gameId as keyof typeof boardGames]?.name || gameId}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Games Tab */}
                        {activeTab === 'games' && (
                            <div className="space-y-4">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Board Games</h2>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {Object.values(boardGames).map((game) => (
                                        <div key={game.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <h3 className="font-bold text-lg mb-2">{game.name}</h3>
                                            {game.description && <p className="text-sm text-gray-600 mb-2">{game.description}</p>}
                                            <div className="space-y-1 text-sm text-gray-600">
                                                <p>
                                                    <strong>Valid Player Counts:</strong> {game.validPlayerCounts.join(', ')}
                                                </p>
                                                <p>
                                                    <strong>Duration:</strong> {game.lengthInMinutes} minutes
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Locations Tab */}
                        {activeTab === 'locations' && (
                            <div className="space-y-4">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Locations</h2>
                                <div className="grid gap-4">
                                    {locations.map((location) => (
                                        <div key={location.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <h3 className="font-bold text-lg mb-2">{location.name}</h3>
                                            <div className="space-y-1 text-sm text-gray-600">
                                                <p>{location.address}</p>
                                                <p>
                                                    {location.city}, {location.postalCode}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
