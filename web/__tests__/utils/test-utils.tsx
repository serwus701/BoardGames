import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { AuthUser, AuthContextType } from '@/types/auth'

// Store the mock context value globally so we can update it per test
let mockAuthContextValue: AuthContextType = {
    user: null,
    isLoading: false,
    isLoggedIn: false,
    token: null,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    refreshUserData: jest.fn(),
}

// Mock the entire AuthContext module
jest.mock('@/context/AuthContext', () => ({
    AuthProvider: ({ children }: { children: React.ReactNode }) => children,
    useAuth: () => mockAuthContextValue,
}))

interface MockAuthProviderProps {
    children: React.ReactNode
    mockUser?: AuthUser | null
    isLoggedIn?: boolean
    token?: string | null
}

export function MockAuthProvider({
    children,
    mockUser = null,
    isLoggedIn = false,
    token = null
}: MockAuthProviderProps) {
    // Update the global mock value
    mockAuthContextValue = {
        user: mockUser,
        isLoading: false,
        isLoggedIn,
        token,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refreshUserData: jest.fn(),
    }

    return <>{children}</>
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
    user?: AuthUser | null
    isLoggedIn?: boolean
    token?: string | null
}

export function renderWithAuth(
    ui: React.ReactElement,
    options?: CustomRenderOptions
) {
    const { user, isLoggedIn, token, ...renderOptions } = options || {}

    return render(ui, {
        wrapper: ({ children }) => (
            <MockAuthProvider mockUser={user} isLoggedIn={isLoggedIn} token={token}>
                {children}
            </MockAuthProvider>
        ),
        ...renderOptions,
    })
}

// Mock user data
export const mockUsers = {
    regularUser: {
        id: 'user-1',
        email: 'user@test.com',
        full_name: 'Test User',
        name: 'Test User',
        role: 'user' as const,
        is_active: true,
    },
    admin: {
        id: 'admin-1',
        email: 'admin@test.com',
        full_name: 'Admin User',
        name: 'Admin User',
        role: 'admin' as const,
        is_active: true,
    },
    headAdmin: {
        id: 'head-admin-1',
        email: 'head-admin@test.com',
        full_name: 'Head Admin',
        name: 'Head Admin',
        role: 'head-admin' as const,
        is_active: true,
    },
}

// Mock events data
export const mockEvents = [
    {
        id: 'event-1',
        date_time: '2026-03-15T18:00:00Z',
        location: 'Game Cafe Downtown',
        organizer_id: 'user-1',
        estimated_length_in_minutes: '240',
        registered_players: ['user-2', 'user-3'],
        event_games: [
            {
                id: 'game-1',
                name: 'Catan',
                valid_player_counts: [3, 4],
                length_in_minutes: 90,
                owner_id: 'user-1',
            },
            {
                id: 'game-2',
                name: 'Ticket to Ride',
                valid_player_counts: [2, 3, 4, 5],
                length_in_minutes: 60,
                owner_id: 'user-2',
            },
        ],
    },
    {
        id: 'event-2',
        date_time: '2026-03-20T19:00:00Z',
        location: 'Community Center',
        organizer_id: 'admin-1',
        estimated_length_in_minutes: '180',
        registered_players: [],
        event_games: [],
    },
]

// Mock API responses
export const mockAPI = {
    authAPI: {
        login: jest.fn(),
        register: jest.fn(),
    },
    eventsAPI: {
        getEvents: jest.fn(),
        createEvent: jest.fn(),
        updateEvent: jest.fn(),
        deleteEvent: jest.fn(),
        registerForEvent: jest.fn(),
        unregisterFromEvent: jest.fn(),
    },
    gamesAPI: {
        getGames: jest.fn(),
        createGame: jest.fn(),
        updateGame: jest.fn(),
        deleteGame: jest.fn(),
    },
    usersAPI: {
        getProfile: jest.fn(),
        updateProfile: jest.fn(),
        getUsers: jest.fn(),
    },
}
