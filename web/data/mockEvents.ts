import { Event, BoardGame, Location, User, SharedGameInstance, GameQueueItem } from '@/types';

const boardGames: Record<string, BoardGame> = {
    dune: {
        id: 'dune',
        name: 'Dune',
        validPlayerCounts: [1, 3, 4, 6],
        description: 'A strategic game of politics and intrigue',
        lengthInMinutes: 120
    },
    catan: {
        id: 'catan',
        name: 'Catan',
        validPlayerCounts: [3, 4],
        description: 'Build settlements on the island of Catan',
        lengthInMinutes: 60
    },
    carcassonne: {
        id: 'carcassonne',
        name: 'Carcassonne',
        validPlayerCounts: [2, 3, 4, 5, 6],
        description: 'Build a medieval landscape tile by tile',
        lengthInMinutes: 45
    },
    ticket_to_ride: {
        id: 'ticket_to_ride',
        name: 'Ticket to Ride',
        validPlayerCounts: [2, 3, 4, 5],
        description: 'Claim railway routes across continents',
        lengthInMinutes: 90
    },
    azul: {
        id: 'azul',
        name: 'Azul',
        validPlayerCounts: [2, 3, 4],
        description: 'Create beautiful tile patterns',
        lengthInMinutes: 30
    }
};

export const locations: Location[] = [
    {
        id: 'loc-1',
        name: 'Downtown Board Game Café',
        address: '123 Main Street',
        city: 'New York',
        postalCode: '10001'
    },
    {
        id: 'loc-2',
        name: 'Community Center Room 3',
        address: '456 Oak Avenue',
        city: 'Boston',
        postalCode: '02101'
    },
    {
        id: 'loc-3',
        name: 'Gaming Workshop',
        address: '789 Elm Street',
        city: 'San Francisco',
        postalCode: '94102'
    },
    {
        id: 'loc-4',
        name: 'The Game Lounge',
        address: '321 Pine Road',
        city: 'Los Angeles',
        postalCode: '90001'
    },
    {
        id: 'loc-5',
        name: 'Community Center Room 1',
        address: '654 Maple Drive',
        city: 'Chicago',
        postalCode: '60601'
    }
];

export const users: User[] = [
    {
        id: 'user-1',
        name: 'John Smith',
        email: 'john.smith@example.com',
        phone: '555-0101',
        bio: 'Board game enthusiast for 10 years',
        favoriteGames: ['dune', 'catan', 'ticket_to_ride']
    },
    {
        id: 'user-2',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        phone: '555-0102',
        bio: 'Love strategy games',
        favoriteGames: ['catan', 'azul']
    },
    {
        id: 'user-3',
        name: 'Mike Chen',
        email: 'mike.chen@example.com',
        phone: '555-0103',
        bio: 'Casual player, always up for fun',
        favoriteGames: ['carcassonne']
    },
    {
        id: 'user-4',
        name: 'Emma Wilson',
        email: 'emma.wilson@example.com',
        phone: '555-0104',
        bio: 'Designer and game collector',
        favoriteGames: ['ticket_to_ride', 'azul', 'carcassonne']
    },
    {
        id: 'user-5',
        name: 'Alex Rodriguez',
        email: 'alex.rodriguez@example.com',
        phone: '555-0105',
        bio: 'Competitive player',
        favoriteGames: ['dune']
    },
    {
        id: 'user-6',
        name: 'Lisa Anderson',
        email: 'lisa.anderson@example.com',
        phone: '555-0106',
        bio: 'New to board gaming but learning fast',
        favoriteGames: ['azul']
    }
];

export const mockEvents: Event[] = [
    {
        id: 'event-1',
        dateTime: new Date(2026, 1, 28, 19, 0),
        location: locations[0],
        organizerId: 'user-1',
        organizerName: 'John Smith'
    },
    {
        id: 'event-2',
        dateTime: new Date(2026, 2, 1, 18, 30),
        location: locations[1],
        organizerId: 'user-2',
        organizerName: 'Sarah Johnson'
    },
    {
        id: 'event-3',
        dateTime: new Date(2026, 2, 5, 19, 0),
        location: locations[2],
        organizerId: 'user-1',
        organizerName: 'John Smith'
    },
    {
        id: 'event-4',
        dateTime: new Date(2026, 2, 8, 14, 0),
        location: locations[0],
        organizerId: 'user-2',
        organizerName: 'Sarah Johnson'
    },
    {
        id: 'event-5',
        dateTime: new Date(2026, 2, 10, 20, 0),
        location: locations[3],
        organizerId: 'user-1',
        organizerName: 'John Smith'
    },
    {
        id: 'event-6',
        dateTime: new Date(2026, 2, 15, 18, 0),
        location: locations[4],
        organizerId: 'user-2',
        organizerName: 'Sarah Johnson'
    }
];

// Shared game collection - games contributed by all players
export const sharedGameInstances: SharedGameInstance[] = [
    {
        id: 'shared-1',
        gameId: 'dune',
        addedByUserId: 'user-1',
        addedByName: 'John Smith',
        addedAt: new Date(2026, 1, 15, 10, 0)
    },
    {
        id: 'shared-2',
        gameId: 'catan',
        addedByUserId: 'user-1',
        addedByName: 'John Smith',
        addedAt: new Date(2026, 1, 15, 10, 0)
    },
    {
        id: 'shared-3',
        gameId: 'ticket_to_ride',
        addedByUserId: 'user-1',
        addedByName: 'John Smith',
        addedAt: new Date(2026, 1, 15, 10, 0)
    },
    {
        id: 'shared-4',
        gameId: 'carcassonne',
        addedByUserId: 'user-2',
        addedByName: 'Sarah Johnson',
        addedAt: new Date(2026, 1, 16, 14, 0)
    },
    {
        id: 'shared-5',
        gameId: 'azul',
        addedByUserId: 'user-2',
        addedByName: 'Sarah Johnson',
        addedAt: new Date(2026, 1, 16, 14, 0)
    },
    {
        id: 'shared-6',
        gameId: 'catan',
        addedByUserId: 'user-2',
        addedByName: 'Sarah Johnson',
        addedAt: new Date(2026, 1, 20, 11, 30)
    }
];

// Game queue - managed by head admin, games are taken sequentially for events
export const gameQueue: GameQueueItem[] = [
    {
        id: 'queue-1',
        gameInstanceId: 'shared-1',
        gameId: 'dune',
        addedByName: 'John Smith',
        addedAt: new Date(2026, 1, 15, 10, 0)
    },
    {
        id: 'queue-2',
        gameInstanceId: 'shared-2',
        gameId: 'catan',
        addedByName: 'John Smith',
        addedAt: new Date(2026, 1, 15, 10, 0)
    },
    {
        id: 'queue-3',
        gameInstanceId: 'shared-4',
        gameId: 'carcassonne',
        addedByName: 'Sarah Johnson',
        addedAt: new Date(2026, 1, 16, 14, 0)
    },
    {
        id: 'queue-4',
        gameInstanceId: 'shared-5',
        gameId: 'azul',
        addedByName: 'Sarah Johnson',
        addedAt: new Date(2026, 1, 16, 14, 0)
    },
    {
        id: 'queue-5',
        gameInstanceId: 'shared-3',
        gameId: 'ticket_to_ride',
        addedByName: 'John Smith',
        addedAt: new Date(2026, 1, 15, 10, 0)
    },
    {
        id: 'queue-6',
        gameInstanceId: 'shared-6',
        gameId: 'catan',
        addedByName: 'Sarah Johnson',
        addedAt: new Date(2026, 1, 20, 11, 30)
    }
];

export { boardGames };
