'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

export default function Navbar() {
    const { user, logout, isLoggedIn } = useAuth();
    const router = useRouter();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleLogout = () => {
        logout();
        setIsDropdownOpen(false);
        router.push('/');
    };

    return (
        <nav className="bg-white shadow-md">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    {/* Logo/Brand */}
                    <Link href="/" className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold">🎲</span>
                        </div>
                        <span className="font-bold text-xl text-gray-900">BoardGames</span>
                    </Link>

                    {isLoggedIn && (
                        <div className="flex items-center space-x-8">
                            <div className="flex space-x-6">
                                <Link href="/events" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                                    Events
                                </Link>
                                <Link href="/create-event" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                                    Create Event
                                </Link>
                                <Link href="/my-games" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                                    Our Games
                                </Link>
                                {user?.role === 'head-admin' && (
                                    <>
                                        <Link href="/admin/game-queue" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                                            Manage Queue
                                        </Link>
                                        <Link href="/admin/users" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                                            Manage Users
                                        </Link>
                                    </>
                                )}
                            </div>

                            {/* User Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
                                >
                                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                        {user?.name.charAt(0)}
                                    </div>
                                    <span className="font-medium">{user?.name}</span>
                                    <svg
                                        className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>

                                {/* Dropdown Menu */}
                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                        <Link
                                            href="/profile"
                                            className="block px-4 py-2 text-gray-700 hover:bg-gray-100 font-medium rounded-t-lg"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            My Profile
                                        </Link>
                                        {user?.role === 'admin' && (
                                            <Link
                                                href="/admin"
                                                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 font-medium border-t"
                                                onClick={() => setIsDropdownOpen(false)}
                                            >
                                                Admin Panel
                                            </Link>
                                        )}
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 font-medium border-t rounded-b-lg"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
