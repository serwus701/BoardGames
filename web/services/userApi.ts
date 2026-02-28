import { User } from '@/types/User';
import { apiCall } from './baseApi';

export const usersAPI = {
    /**
     * Get current user info
     */
    async getCurrentUser(token: string) {
        return apiCall<User>('/users/me', {
            method: 'GET',
            token,
        });
    },

    /**
     * Get all users
     */
    async listUsers() {
        return apiCall<User[]>('/users', {
            method: 'GET',
        });
    },

    /**
     * Get user by ID
     */
    async getUser(userId: string) {
        return apiCall<User>(`/users/${userId}`, {
            method: 'GET',
        });
    },

    /**
     * Update user
     */
    async updateUser(userId: string, data: Partial<User>, token: string) {
        return apiCall<User>(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
            token,
        });
    },

    /**
     * Delete user
     */
    async deleteUser(userId: string, token: string) {
        return apiCall<void>(`/users/${userId}`, {
            method: 'DELETE',
            token,
        });
    },
};