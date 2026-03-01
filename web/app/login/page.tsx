'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
            router.push('/events');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Login failed';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 flex items-center justify-center">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-center">
                        <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
                        <p className="text-blue-100">Login to your Board Games account</p>
                    </div>

                    {/* Form */}
                    <div className="p-6">
                        {error && (
                            <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg border border-red-300">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition-colors"
                            >
                                {isLoading ? 'Logging in...' : 'Login'}
                            </button>
                        </form>

                        {/* Test Accounts Info */}
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm font-semibold text-gray-700 mb-3">Test Accounts (after backend init_db.py):</p>
                            <div className="space-y-2 text-xs text-gray-600">
                                <div>
                                    <p className="font-medium text-gray-700">Admin</p>
                                    <p className="text-gray-500">serwus701@gmail.com / pass123</p>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-700">User</p>
                                    <p className="text-gray-500">mike@oxlong.com / pass123</p>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-700">User</p>
                                    <p className="text-gray-500">mike@oxshort.com / pass123</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
