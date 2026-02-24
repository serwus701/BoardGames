'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        bio: '',
        home_address: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Validate password length
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setIsLoading(true);

        try {
            await register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone || undefined,
                bio: formData.bio || undefined,
                home_address: formData.home_address || undefined
            });

            setSuccess(true);

            // Redirect to events page after successful registration
            setTimeout(() => {
                router.push('/events');
            }, 2000);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Registration failed';
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
                        <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
                        <p className="text-blue-100">Join our board game community</p>
                    </div>

                    {/* Form */}
                    <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                        {error && (
                            <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg border border-red-300">
                                {error}
                            </div>
                        )}

                        {success ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-green-100 text-green-800 rounded-lg border border-green-300">
                                    <p className="font-semibold mb-2">Account Created Successfully!</p>
                                    <p className="text-sm">
                                        Your account has been created and you are now logged in. Redirecting to events...
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="you@example.com"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Password *</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password *</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone (Optional)</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="555-0000"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Home Address (Optional)</label>
                                    <input
                                        type="text"
                                        name="home_address"
                                        value={formData.home_address}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="123 Main St, City, State 12345"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Bio (Optional)</label>
                                    <textarea
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                        placeholder="Tell us about yourself and your interest in board games..."
                                        rows={3}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition-colors"
                                >
                                    {isLoading ? 'Creating Account...' : 'Create Account'}
                                </button>
                            </form>
                        )}

                        {/* Login Link */}
                        <div className="mt-6 text-center border-t pt-6">
                            <p className="text-gray-600 mb-2">Already have an account?</p>
                            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                                Login Here
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
{
    !success && (
        <div className="mt-6 text-center border-t pt-6">
            <p className="text-gray-600 mb-2">Already have an account?</p>
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                Login here
            </Link>
        </div>
    )
}
                    </div >
                </div >
            </div >
        </div >
    );
}
