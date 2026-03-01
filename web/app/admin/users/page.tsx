'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usersAPI } from '@/services/userApi';
import { AuthUser } from '@/types/auth';

interface EditingUser {
    id: string;
    name: string;
    email: string;
    homeAddress: string;
    role: 'head-admin' | 'admin' | 'user';
}

export default function UsersManagementPage() {
    const { isLoggedIn, user, token, refreshUserData } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<AuthUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [editingUser, setEditingUser] = useState<EditingUser | null>(null);

    // Fetch users from backend
    useEffect(() => {
        if (!isLoggedIn && !isLoading) {
            router.push('/login');
        } else if (user && user.role !== 'head-admin' && !isLoading) {
            router.push('/');
        } else if (isLoggedIn && user?.role === 'head-admin') {
            fetchUsers();
        }
    }, [isLoggedIn, user?.role, isLoading, router]);

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const userData = await usersAPI.listUsers();
            const formattedUsers = userData.map((u: any) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                homeAddress: u.home_address || '',
                role: u.role,
                phone: u.phone,
                bio: u.bio,
                created_at: u.created_at,
                updated_at: u.updated_at,
            }));
            setUsers(formattedUsers);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            setErrorMessage('Failed to load users');
            setTimeout(() => setErrorMessage(''), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <p className="text-gray-500">Redirecting to login...</p>
            </div>
        );
    }

    if (user?.role !== 'head-admin') {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-red-100 border border-red-400 rounded-lg p-6">
                        <h2 className="text-2xl font-bold text-red-800 mb-2">Access Denied</h2>
                        <p className="text-red-700">Only head admins can manage users.</p>
                    </div>
                </div>
            </div>
        );
    }

    const handleEditClick = (userData: AuthUser) => {
        setEditingUser({
            id: userData.id,
            name: userData.name,
            email: userData.email,
            homeAddress: userData.homeAddress || '',
            role: userData.role
        });
    };

    const handleEditChange = (field: keyof EditingUser, value: string) => {
        if (editingUser) {
            setEditingUser({
                ...editingUser,
                [field]: value
            });
        }
    };

    const handleSaveEdit = async () => {
        if (!editingUser?.name.trim() || !editingUser?.email.trim() || !editingUser?.homeAddress.trim()) {
            setErrorMessage('All fields are required');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        if (!token) {
            setErrorMessage('No authentication token found');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        try {
            // Send update to backend
            await usersAPI.updateUser(
                editingUser.id,
                {
                    name: editingUser.name,
                    email: editingUser.email,
                    home_address: editingUser.homeAddress,
                    role: editingUser.role
                } as any,
                token
            );

            // Update local state
            setUsers((prevUsers) =>
                prevUsers.map((u) =>
                    u.id === editingUser.id
                        ? {
                            ...u,
                            name: editingUser.name,
                            email: editingUser.email,
                            homeAddress: editingUser.homeAddress,
                            role: editingUser.role
                        }
                        : u
                )
            );

            // If editing current user, refresh their data in AuthContext
            if (editingUser.id === user?.id) {
                await refreshUserData();
            }

            setSuccessMessage(`User "${editingUser.name}" updated successfully`);
            setTimeout(() => setSuccessMessage(''), 3000);
            setEditingUser(null);
        } catch (error: any) {
            console.error('Failed to update user:', error);
            setErrorMessage(error.message || 'Failed to update user');
            setTimeout(() => setErrorMessage(''), 3000);
        }
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (userId === user?.id) {
            setErrorMessage("You can't delete your own account");
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        if (!token) {
            setErrorMessage('No authentication token found');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        if (confirm(`Are you sure you want to delete "${userName}"?`)) {
            try {
                await usersAPI.deleteUser(userId, token);
                setUsers((prevUsers) => prevUsers.filter((u) => u.id !== userId));
                setSuccessMessage(`User "${userName}" deleted successfully`);
                setTimeout(() => setSuccessMessage(''), 3000);
            } catch (error: any) {
                console.error('Failed to delete user:', error);
                setErrorMessage(error.message || 'Failed to delete user');
                setTimeout(() => setErrorMessage(''), 3000);
            }
        }
    };

    const handleChangeRole = async (userId: string, newRole: 'head-admin' | 'user') => {
        if (userId === user?.id) {
            setErrorMessage("You can't change your own role");
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        if (!token) {
            setErrorMessage('No authentication token found');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        try {
            const userToUpdate = users.find(u => u.id === userId);
            if (!userToUpdate) return;

            await usersAPI.updateUser(
                userId,
                {
                    name: userToUpdate.name,
                    email: userToUpdate.email,
                    role: newRole
                } as any,
                token
            );

            setUsers((prevUsers) =>
                prevUsers.map((u) =>
                    u.id === userId ? { ...u, role: newRole } : u
                )
            );

            setSuccessMessage(`${userToUpdate.name}'s role changed to ${newRole === 'head-admin' ? 'Head Admin' : 'User'}`);
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error: any) {
            console.error('Failed to update user role:', error);
            setErrorMessage(error.message || 'Failed to update user role');
            setTimeout(() => setErrorMessage(''), 3000);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="inline-block bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                            ADMIN ONLY
                        </span>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Users Management</h1>
                    <p className="text-gray-600">
                        Manage user accounts, roles, and information
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

                {/* Edit User Modal */}
                {editingUser && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
                                <h2 className="text-2xl font-bold">Edit User</h2>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        value={editingUser.name}
                                        onChange={(e) => handleEditChange('name', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={editingUser.email}
                                        onChange={(e) => handleEditChange('email', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Home Address
                                    </label>
                                    <input
                                        type="text"
                                        value={editingUser.homeAddress}
                                        onChange={(e) => handleEditChange('homeAddress', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Role
                                    </label>
                                    <select
                                        value={editingUser.role}
                                        onChange={(e) => handleEditChange('role', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="user">User</option>
                                        <option value="head-admin">Head Admin</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bg-gray-50 px-6 py-4 flex gap-3">
                                <button
                                    onClick={() => setEditingUser(null)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Users Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
                        <h2 className="text-2xl font-bold">
                            {users.length} User{users.length !== 1 ? 's' : ''}
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-100 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Address</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {users.map((userData) => (
                                    <tr key={userData.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                                                    {(userData.name || 'U').charAt(0)}
                                                </div>
                                                <span className="font-semibold text-gray-900">{userData.name || 'Unknown'}</span>
                                                {userData.id === user?.id && (
                                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                                        You
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{userData.email}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{userData.homeAddress}</td>
                                        <td className="px-6 py-4">
                                            {userData.id === user?.id ? (
                                                <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded">
                                                    {userData.role === 'head-admin' ? 'Head Admin' : 'User'}
                                                </span>
                                            ) : (
                                                <select
                                                    value={userData.role}
                                                    onChange={(e) =>
                                                        handleChangeRole(userData.id, e.target.value as 'head-admin' | 'user')
                                                    }
                                                    className="text-xs font-semibold px-2 py-1 border border-gray-300 rounded bg-white"
                                                >
                                                    <option value="user">User</option>
                                                    <option value="head-admin">Head Admin</option>
                                                </select>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEditClick(userData)}
                                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                {userData.id !== user?.id && (
                                                    <button
                                                        onClick={() => handleDeleteUser(userData.id, userData.name || 'Unknown User')}
                                                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-8 grid md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                        <h3 className="font-bold text-lg text-gray-900 mb-2">User Management</h3>
                        <ul className="text-sm text-gray-700 space-y-2">
                            <li>✓ Edit user details (name, email, address)</li>
                            <li>✓ Change user roles</li>
                            <li>✓ Delete user accounts</li>
                            <li>✓ View all users and their information</li>
                        </ul>
                    </div>

                    <div className="bg-purple-50 rounded-lg border border-purple-200 p-6">
                        <h3 className="font-bold text-lg text-gray-900 mb-2">Roles</h3>
                        <ul className="text-sm text-gray-700 space-y-2">
                            <li><strong>Head Admin:</strong> Full access to all admin features</li>
                            <li><strong>User:</strong> Regular player with basic permissions</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
