'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usersAPI } from '@/services/userApi';

export default function ProfilePage() {
    const { isLoggedIn, user, token, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        bio: '',
        home_address: ''
    });
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isAuthLoading) {
            return;
        }
        if (!isLoggedIn) {
            router.push('/login');
        } else if (user) {
            setFormData({
                full_name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                bio: user.bio || '',
                home_address: user.homeAddress || ''
            });
        }
    }, [isLoggedIn, isAuthLoading, user, router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user || !token) {
            setErrorMessage('Not authenticated');
            return;
        }

        try {
            setIsSaving(true);
            setErrorMessage('');

            await usersAPI.updateUser(user.id, formData, token);

            setSuccessMessage('Profile updated successfully!');
            setIsEditing(false);
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err: any) {
            console.error('Failed to update profile:', err);
            setErrorMessage(err.data?.detail || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

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

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">My Profile</h1>
                    <p className="text-gray-600">View and manage your account information</p>
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

                {user && (
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        {/* Profile Header */}
                        <div className="from-blue-600 to-blue-700 text-white p-8">
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                                    <span className="text-2xl font-bold text-blue-600">
                                        {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">{user.name || 'User'}</h2>
                                    <p className="text-blue-100">{user.email}</p>
                                    {user.role && (
                                        <span className="text-xs bg-blue-500 px-2 py-1 rounded-full mt-1 inline-block">
                                            {user.role}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Profile Content */}
                        <div className="p-8">
                            {!isEditing ? (
                                <>
                                    {/* View Mode */}
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-sm font-semibold text-gray-700">Full Name</label>
                                                <p className="text-lg text-gray-900 mt-1">{user.name || 'Not set'}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-semibold text-gray-700">Email</label>
                                                <p className="text-lg text-gray-900 mt-1">{user.email}</p>
                                            </div>
                                        </div>

                                        {user.phone && (
                                            <div>
                                                <label className="text-sm font-semibold text-gray-700">Phone</label>
                                                <p className="text-lg text-gray-900 mt-1">{user.phone}</p>
                                            </div>
                                        )}

                                        {user.bio && (
                                            <div>
                                                <label className="text-sm font-semibold text-gray-700">Bio</label>
                                                <p className="text-lg text-gray-900 mt-1 whitespace-pre-wrap">{user.bio}</p>
                                            </div>
                                        )}

                                        {user.homeAddress && (
                                            <div>
                                                <label className="text-sm font-semibold text-gray-700">Home Address</label>
                                                <p className="text-lg text-gray-900 mt-1">{user.homeAddress}</p>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => setIsEditing(true)}
                                            disabled={isSaving}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors mt-6"
                                        >
                                            Edit Profile
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Edit Mode */}
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Full Name
                                                </label>
                                                <input
                                                    type="text"
                                                    name="full_name"
                                                    value={formData.full_name}
                                                    onChange={handleInputChange}
                                                    disabled={isSaving}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Email
                                                </label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    disabled={isSaving}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Phone
                                            </label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                disabled={isSaving}
                                                placeholder="e.g., +1234567890"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Bio
                                            </label>
                                            <textarea
                                                name="bio"
                                                value={formData.bio}
                                                onChange={handleInputChange}
                                                disabled={isSaving}
                                                rows={4}
                                                placeholder="Tell us about yourself..."
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Home Address
                                            </label>
                                            <input
                                                type="text"
                                                name="home_address"
                                                value={formData.home_address}
                                                onChange={handleInputChange}
                                                disabled={isSaving}
                                                placeholder="123 Main St, City, State"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                            />
                                        </div>

                                        <div className="flex gap-4 pt-4">
                                            <button
                                                type="submit"
                                                disabled={isSaving}
                                                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors"
                                            >
                                                {isSaving ? 'Saving...' : 'Save Changes'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setErrorMessage('');
                                                }}
                                                disabled={isSaving}
                                                className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-800 font-semibold py-3 rounded-lg transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
