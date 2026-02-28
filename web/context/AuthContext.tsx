'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, AuthContextType } from '@/types/auth';
import { APIError } from '@/services/baseApi';
import { authAPI } from '@/services/authApi';
import { usersAPI } from '@/services/userApi';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);

    // Initialize auth from localStorage on component mount
    useEffect(() => {
        const storedUser = localStorage.getItem('currentUser');
        const storedToken = localStorage.getItem('authToken');

        if (storedUser && storedToken) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                setToken(storedToken);
            } catch (error) {
                console.error('Failed to parse stored user:', error);
                localStorage.removeItem('currentUser');
                localStorage.removeItem('authToken');
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await authAPI.login(email, password);

            // Store token
            setToken(response.access_token);
            localStorage.setItem('authToken', response.access_token);

            // Store user data directly from backend
            const userData: AuthUser = {
                ...response.user,
                // Legacy compatibility
                name: response.user.full_name || response.user.email,
                homeAddress: response.user.home_address
            };

            setUser(userData);
            localStorage.setItem('currentUser', JSON.stringify(userData));
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (data: {
        name: string;
        email: string;
        password: string;
        phone?: string;
        bio?: string;
        home_address?: string;
    }) => {
        setIsLoading(true);
        try {
            const response = await authAPI.register(data);

            // Store token
            setToken(response.access_token);
            localStorage.setItem('authToken', response.access_token);

            // Store user data directly from backend
            const userData: AuthUser = {
                ...response.user,
                // Legacy compatibility
                name: response.user.full_name || response.user.email,
                homeAddress: response.user.home_address
            };

            setUser(userData);
            localStorage.setItem('currentUser', JSON.stringify(userData));
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
    };

    const refreshUserData = async () => {
        const currentToken = token || localStorage.getItem('authToken');
        if (!currentToken) {
            return;
        }

        try {
            const updatedUserData = await usersAPI.getCurrentUser(currentToken);
            const userData: AuthUser = {
                ...updatedUserData,
                // Legacy compatibility
                name: updatedUserData.full_name || updatedUserData.email,
                homeAddress: updatedUserData.home_address
            };

            setUser(userData);
            localStorage.setItem('currentUser', JSON.stringify(userData));
        } catch (error) {
            console.error('Failed to refresh user data:', error);
            // Only logout if it's a 401 (unauthorized) error, otherwise keep user logged in
            if (error instanceof APIError && error.status === 401) {
                logout();
            }
            // For other errors, don't logout - let the user stay logged in
        }
    };

    const value: AuthContextType = {
        user,
        isLoading,
        login,
        logout,
        refreshUserData,
        isLoggedIn: !!user,
        token,
        register,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
