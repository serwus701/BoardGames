import { RegistrationRequest, AuthUser } from '@/types/auth';

// Users that can login
export const mockUsers: AuthUser[] = [
    {
        id: 'user-1',
        name: 'John Smith',
        email: 'john.smith@example.com',
        homeAddress: '123 Main Street, New York, NY 10001',
        contributedGameIds: ['dune', 'catan', 'ticket_to_ride'],
        role: 'head-admin'
    },
    {
        id: 'user-2',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        homeAddress: '456 Oak Avenue, Boston, MA 02101',
        contributedGameIds: ['carcassonne', 'azul', 'catan'],
        role: 'user'
    }
];

// Pending registration requests
export const mockRegistrationRequests: RegistrationRequest[] = [
    {
        id: 'reg-1',
        name: 'James Peterson',
        email: 'james.peterson@example.com',
        status: 'pending',
        requestedAt: new Date(2026, 1, 20, 10, 0)
    },
    {
        id: 'reg-2',
        name: 'Patricia Martinez',
        email: 'patricia.martinez@example.com',
        status: 'pending',
        requestedAt: new Date(2026, 1, 19, 15, 30)
    },
    {
        id: 'reg-3',
        name: 'Robert Thompson',
        email: 'robert.thompson@example.com',
        status: 'approved',
        requestedAt: new Date(2026, 1, 15, 8, 0),
        respondedAt: new Date(2026, 1, 16, 10, 0),
        respondedBy: 'John Smith'
    },
    {
        id: 'reg-4',
        name: 'Jessica Lee',
        email: 'jessica.lee@example.com',
        status: 'rejected',
        requestedAt: new Date(2026, 1, 10, 12, 0),
        respondedAt: new Date(2026, 1, 11, 14, 0),
        respondedBy: 'John Smith'
    }
];
