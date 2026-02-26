import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { EventsList } from '@/app/events/EventsList'
import { Event } from '@/types/Event'
import { User } from '@/types'

describe('EventsList Component', () => {
    const mockUserMap = {
        'user-1': {
            id: 'user-1',
            email: 'organizer@test.com',
            full_name: 'John Organizer',
            name: 'John Organizer',
            role: 'user' as const,
            is_active: true,
        },
        'user-2': {
            id: 'user-2',
            email: 'player@test.com',
            full_name: 'Jane Player',
            name: 'Jane Player',
            role: 'user' as const,
            is_active: true,
        },
    }

    const mockEvents: Event[] = [
        {
            id: 'event-1',
            date_time: '2026-03-15T18:00:00Z',
            location: 'Game Cafe Downtown',
            organizer_id: 'user-1',
            estimated_length_in_minutes: '240',
            registered_players: ['user-2'],
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
            organizer_id: 'user-1',
            estimated_length_in_minutes: '180',
            registered_players: [],
            event_games: [],
        },
    ]

    const mockHandlers = {
        handleEditClick: jest.fn(),
        handleDeleteEvent: jest.fn(),
        handleRegister: jest.fn(),
        handleUnregister: jest.fn(),
        canManageEvent: jest.fn(),
        isUserRegistered: jest.fn(),
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('Rendering', () => {
        it('should render all events', () => {
            mockHandlers.canManageEvent.mockReturnValue(false)
            mockHandlers.isUserRegistered.mockReturnValue(false)

            render(
                <EventsList
                    upcomingEvents={mockEvents}
                    userMap={mockUserMap}
                    {...mockHandlers}
                />
            )

            expect(screen.getByText('Event event-1')).toBeInTheDocument()
            expect(screen.getByText('Event event-2')).toBeInTheDocument()
        })

        it('should display event details correctly', () => {
            mockHandlers.canManageEvent.mockReturnValue(false)
            mockHandlers.isUserRegistered.mockReturnValue(false)

            render(
                <EventsList
                    upcomingEvents={[mockEvents[0]]}
                    userMap={mockUserMap}
                    {...mockHandlers}
                />
            )

            expect(screen.getByText('Game Cafe Downtown')).toBeInTheDocument()
            expect(screen.getByText('John Organizer')).toBeInTheDocument()
            expect(screen.getByText('4.0 hours')).toBeInTheDocument()
        })

        it('should format date and time correctly', () => {
            mockHandlers.canManageEvent.mockReturnValue(false)
            mockHandlers.isUserRegistered.mockReturnValue(false)

            render(
                <EventsList
                    upcomingEvents={[mockEvents[0]]}
                    userMap={mockUserMap}
                    {...mockHandlers}
                />
            )

            // Check if date is formatted (Mar 15, 2026 format)
            expect(screen.getByText(/Mar 15, 2026/)).toBeInTheDocument()
        })

        it('should display event games when available', () => {
            mockHandlers.canManageEvent.mockReturnValue(false)
            mockHandlers.isUserRegistered.mockReturnValue(false)

            render(
                <EventsList
                    upcomingEvents={[mockEvents[0]]}
                    userMap={mockUserMap}
                    {...mockHandlers}
                />
            )

            expect(screen.getByText('Catan')).toBeInTheDocument()
            expect(screen.getByText('Ticket to Ride')).toBeInTheDocument()
            expect(screen.getByText('Games for this Event (2)')).toBeInTheDocument()
        })

        it('should calculate total game time correctly', () => {
            mockHandlers.canManageEvent.mockReturnValue(false)
            mockHandlers.isUserRegistered.mockReturnValue(false)

            render(
                <EventsList
                    upcomingEvents={[mockEvents[0]]}
                    userMap={mockUserMap}
                    {...mockHandlers}
                />
            )

            // Total: 90 + 60 = 150 minutes = 2.5 hours
            expect(screen.getByText(/Total: 2.5h/)).toBeInTheDocument()
        })
    })

    describe('Event Management Buttons', () => {
        it('should show Edit and Delete buttons for event managers', () => {
            mockHandlers.canManageEvent.mockReturnValue(true)
            mockHandlers.isUserRegistered.mockReturnValue(false)

            render(
                <EventsList
                    upcomingEvents={[mockEvents[0]]}
                    userMap={mockUserMap}
                    {...mockHandlers}
                />
            )

            expect(screen.getByText('Edit')).toBeInTheDocument()
            expect(screen.getByText('Delete')).toBeInTheDocument()
        })

        it('should show Register button for non-registered users', () => {
            mockHandlers.canManageEvent.mockReturnValue(false)
            mockHandlers.isUserRegistered.mockReturnValue(false)

            render(
                <EventsList
                    upcomingEvents={[mockEvents[0]]}
                    userMap={mockUserMap}
                    {...mockHandlers}
                />
            )

            expect(screen.getByText('Register')).toBeInTheDocument()
        })

        it('should show Registered button for registered users', () => {
            mockHandlers.canManageEvent.mockReturnValue(false)
            mockHandlers.isUserRegistered.mockReturnValue(true)

            render(
                <EventsList
                    upcomingEvents={[mockEvents[0]]}
                    userMap={mockUserMap}
                    {...mockHandlers}
                />
            )

            expect(screen.getByText('✓ Registered')).toBeInTheDocument()
        })
    })

    describe('User Interactions', () => {
        it('should call handleEditClick when Edit button is clicked', () => {
            mockHandlers.canManageEvent.mockReturnValue(true)
            mockHandlers.isUserRegistered.mockReturnValue(false)

            render(
                <EventsList
                    upcomingEvents={[mockEvents[0]]}
                    userMap={mockUserMap}
                    {...mockHandlers}
                />
            )

            const editButton = screen.getByText('Edit')
            fireEvent.click(editButton)

            expect(mockHandlers.handleEditClick).toHaveBeenCalledWith(mockEvents[0])
            expect(mockHandlers.handleEditClick).toHaveBeenCalledTimes(1)
        })

        it('should call handleDeleteEvent when Delete button is clicked', () => {
            mockHandlers.canManageEvent.mockReturnValue(true)
            mockHandlers.isUserRegistered.mockReturnValue(false)

            render(
                <EventsList
                    upcomingEvents={[mockEvents[0]]}
                    userMap={mockUserMap}
                    {...mockHandlers}
                />
            )

            const deleteButton = screen.getByText('Delete')
            fireEvent.click(deleteButton)

            expect(mockHandlers.handleDeleteEvent).toHaveBeenCalledWith('event-1')
            expect(mockHandlers.handleDeleteEvent).toHaveBeenCalledTimes(1)
        })

        it('should call handleRegister when Register button is clicked', () => {
            mockHandlers.canManageEvent.mockReturnValue(false)
            mockHandlers.isUserRegistered.mockReturnValue(false)

            render(
                <EventsList
                    upcomingEvents={[mockEvents[0]]}
                    userMap={mockUserMap}
                    {...mockHandlers}
                />
            )

            const registerButton = screen.getByText('Register')
            fireEvent.click(registerButton)

            expect(mockHandlers.handleRegister).toHaveBeenCalledWith('event-1')
            expect(mockHandlers.handleRegister).toHaveBeenCalledTimes(1)
        })

        it('should call handleUnregister when Registered button is clicked', () => {
            mockHandlers.canManageEvent.mockReturnValue(false)
            mockHandlers.isUserRegistered.mockReturnValue(true)

            render(
                <EventsList
                    upcomingEvents={[mockEvents[0]]}
                    userMap={mockUserMap}
                    {...mockHandlers}
                />
            )

            const unregisterButton = screen.getByText('✓ Registered')
            fireEvent.click(unregisterButton)

            expect(mockHandlers.handleUnregister).toHaveBeenCalledWith('event-1')
            expect(mockHandlers.handleUnregister).toHaveBeenCalledTimes(1)
        })
    })

    describe('Player Count Display', () => {
        it('should display registered player count', () => {
            mockHandlers.canManageEvent.mockReturnValue(false)
            mockHandlers.isUserRegistered.mockReturnValue(true)

            render(
                <EventsList
                    upcomingEvents={[mockEvents[0]]}
                    userMap={mockUserMap}
                    {...mockHandlers}
                />
            )

            expect(screen.getByText('1 players')).toBeInTheDocument()
        })

        it('should show player count on Register button when others have joined', () => {
            mockHandlers.canManageEvent.mockReturnValue(false)
            mockHandlers.isUserRegistered.mockReturnValue(false)

            render(
                <EventsList
                    upcomingEvents={[mockEvents[0]]}
                    userMap={mockUserMap}
                    {...mockHandlers}
                />
            )

            expect(screen.getByText('1 already joined')).toBeInTheDocument()
        })
    })

    describe('Edge Cases', () => {
        it('should handle events with no games', () => {
            mockHandlers.canManageEvent.mockReturnValue(false)
            mockHandlers.isUserRegistered.mockReturnValue(false)

            render(
                <EventsList
                    upcomingEvents={[mockEvents[1]]}
                    userMap={mockUserMap}
                    {...mockHandlers}
                />
            )

            expect(screen.queryByText(/Games for this Event/)).not.toBeInTheDocument()
        })

        it('should handle empty events array', () => {
            mockHandlers.canManageEvent.mockReturnValue(false)
            mockHandlers.isUserRegistered.mockReturnValue(false)

            const { container } = render(
                <EventsList
                    upcomingEvents={[]}
                    userMap={mockUserMap}
                    {...mockHandlers}
                />
            )

            // Should not render any event cards
            expect(screen.queryByText(/Event event-/)).not.toBeInTheDocument()
            // Container should have no children or only empty fragment
            expect(container.querySelector('.border-l-4')).not.toBeInTheDocument()
        })

        it('should handle missing organizer in userMap', () => {
            mockHandlers.canManageEvent.mockReturnValue(false)
            mockHandlers.isUserRegistered.mockReturnValue(false)

            render(
                <EventsList
                    upcomingEvents={[mockEvents[0]]}
                    userMap={{}}
                    {...mockHandlers}
                />
            )

            // Should not crash, organizer section should not appear
            expect(screen.queryByText('John Organizer')).not.toBeInTheDocument()
        })

        it('should handle invalid date gracefully', () => {
            const eventWithInvalidDate = {
                ...mockEvents[0],
                date_time: 'invalid-date',
            }

            mockHandlers.canManageEvent.mockReturnValue(false)
            mockHandlers.isUserRegistered.mockReturnValue(false)

            render(
                <EventsList
                    upcomingEvents={[eventWithInvalidDate]}
                    userMap={mockUserMap}
                    {...mockHandlers}
                />
            )

            // Should display the raw string as fallback
            expect(screen.getByText('invalid-date')).toBeInTheDocument()
        })
    })
})
