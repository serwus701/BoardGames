/**
 * API Client for Board Games Backend
 * Handles all communication with the Python FastAPI backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

import {
    CustomGame,
    SharedGameInstance,
    GameQueueItem,
} from '@/types';
import { Event } from '@/types/Event';
import { User } from '@/types/User';
import { BoardGame } from '@/types/BoardGame';
export class APIError extends Error {
    constructor(
        public status: number,
        public data: unknown,
        message: string
    ) {
        super(message);
    }
}

/**
 * Make an API request to the backend
 */
async function apiCall<T extends unknown>(
    path: string,
    options: RequestInit & { token?: string } = {}
): Promise<T> {
    const { token, ...fetchOptions } = options;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${path}`, {
        ...fetchOptions,
        headers,
    });

    // Handle 204 No Content (successful delete with no response body)
    if (response.status === 204) {
        if (!response.ok) {
            throw new APIError(response.status, {}, 'API Error');
        }
        return undefined as unknown as T;
    }

    const data = await response.json();

    if (!response.ok) {
        throw new APIError(response.status, data, (data && (data as any).detail) || 'API Error');
    }

    return data as T;
}

/**
 * Authentication API calls
 */
export const authAPI = {
    /**
     * Register a new user
     */
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

/**
 * User API calls
 */
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

/**
 * Games API calls
 */
export const gamesAPI = {
    /**
     * Get all board games
     */
    async listBoardGames() {
        return apiCall<BoardGame[]>('/games/board-games', {
            method: 'GET',
        });
    },

    /**
     * Create a board game (admin only)
     */
    async createBoardGame(game: Partial<BoardGame>, token: string) {
        return apiCall<BoardGame>('/games/board-games', {
            method: 'POST',
            body: JSON.stringify(game),
            token,
        });
    },

    /**
     * Get all custom games
     */
    async listCustomGames() {
        return apiCall<CustomGame[]>('/games/custom-games', {
            method: 'GET',
        });
    },

    /**
     * Create a custom game
     */
    async createCustomGame(
        game: {
            name: string;
            valid_player_counts: number[];
            length_in_minutes?: number;
        },
        token: string
    ) {
        return apiCall<CustomGame>('/games/custom-games', {
            method: 'POST',
            body: JSON.stringify(game),
            token,
        });
    },

    /**
     * Get custom game by ID
     */
    async getCustomGame(gameId: string) {
        return apiCall<CustomGame>(`/games/custom-games/${gameId}`, {
            method: 'GET',
        });
    },

    /**
     * Update custom game
     */
    async updateCustomGame(gameId: string, data: Partial<CustomGame>, token: string) {
        return apiCall<CustomGame>(`/games/custom-games/${gameId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
            token,
        });
    },

    /**
     * Delete custom game
     */
    async deleteCustomGame(gameId: string, token: string) {
        return apiCall<void>(`/games/custom-games/${gameId}`, {
            method: 'DELETE',
            token,
        });
    },

    /**
     * Get all shared instances
     */
    async listSharedInstances() {
        return apiCall<SharedGameInstance[]>('/games/shared-instances', {
            method: 'GET',
        });
    },

    /**
     * Add game instance to shared collection
     */
    async addGameInstance(
        props: {
            game_id?: string;
            custom_game_id?: string;
        },
        token: string
    ) {
        const params = new URLSearchParams();
        if (props.game_id) params.append('game_id', props.game_id);
        if (props.custom_game_id) params.append('custom_game_id', props.custom_game_id);

        return apiCall<SharedGameInstance>(`/games/shared-instances?${params}`, {
            method: 'POST',
            token,
        });
    },
};

/**
 * Events API calls
 */
export const eventsAPI = {
    /**
     * Get all events
     */
    async listEvents() {
        return apiCall<Event[]>('/events', {
            method: 'GET',
        });
    },

    /**
     * Create an event
     */
    async createEvent(
        event: {
            date_time: string;
            location: string;
            organizer_id: string;
            estimated_length_in_minutes?: string;
            selected_games?: number[];
        },
        token: string
    ) {
        return apiCall<Event>('/events', {
            method: 'POST',
            body: JSON.stringify(event),
            token,
        });
    },

    /**
     * Get event by ID
     */
    async getEvent(eventId: string) {
        return apiCall<Event>(`/events/${eventId}`, {
            method: 'GET',
        });
    },

    /**
     * Update event
     */
    async updateEvent(eventId: string, data: Partial<Event>, token: string) {
        return apiCall<Event>(`/events/${eventId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
            token,
        });
    },

    /**
     * Delete event
     */
    async deleteEvent(eventId: string, token: string) {
        return apiCall<void>(`/events/${eventId}`, {
            method: 'DELETE',
            token,
        });
    },

    /**
     * Register for an event
     */
    async registerForEvent(eventId: string, token: string) {
        return apiCall<{ success: boolean }>(`/events/${eventId}/register`, {
            method: 'POST',
            body: JSON.stringify({}),
            token,
        });
    },

    /**
     * Unregister from an event
     */
    async unregisterFromEvent(eventId: string, token: string) {
        return apiCall<void>(`/events/${eventId}/register`, {
            method: 'DELETE',
            token,
        });
    },
};

/**
 * Game Queue API calls
 */
export const queueAPI = {
    /**
     * Get all queue items
     */
    async listQueue() {
        return apiCall<GameQueueItem[]>('/game-queue', {
            method: 'GET',
        });
    },

    /**
     * Add game to queue
     */
    async addToQueue(
        item: {
            game_id: string;
            game_instance_id: string;
        },
        token: string
    ) {
        return apiCall<GameQueueItem>('/game-queue', {
            method: 'POST',
            body: JSON.stringify(item),
            token,
        });
    },

    /**
     * Reorder queue items (admin only)
     */
    async reorderQueue(
        items: Array<{ id: string; queue_position: number }>,
        token: string
    ) {
        return apiCall<GameQueueItem[]>('/game-queue/reorder', {
            method: 'POST',
            body: JSON.stringify({ items }),
            token,
        });
    },

    /**
     * Remove item from queue (admin only)
     */
    async removeFromQueue(queueItemId: string, token: string) {
        return apiCall<void>(`/game-queue/${queueItemId}`, {
            method: 'DELETE',
            token,
        });
    },
};
