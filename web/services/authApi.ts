import { User } from '@/types/User';
import { apiCall } from './baseApi';

export const authAPI = {
    async register(userData: {
        name: string;
        email: string;
        password: string;
        phone?: string;
        bio?: string;
        home_address?: string;
    }) {
        return apiCall<{
            access_token: string;
            token_type: string;
            user: User;
        }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    },

    /**
     * Login with email and password
     */
    async login(email: string, password: string) {
        return apiCall<{
            access_token: string;
            token_type: string;
            user: User;
        }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    },
};