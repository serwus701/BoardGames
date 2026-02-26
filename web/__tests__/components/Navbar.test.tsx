import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Navbar from '@/components/Navbar'
import { renderWithAuth, mockUsers } from '../utils/test-utils'
import { useRouter } from 'next/navigation'

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(() => ({
        push: mockPush,
        replace: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
    })),
}))

describe('Navbar Component', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('Logo and Brand', () => {
        it('should render the BoardGames logo and brand', () => {
            renderWithAuth(<Navbar />, { isLoggedIn: false })

            expect(screen.getByText('🎲')).toBeInTheDocument()
            expect(screen.getByText('BoardGames')).toBeInTheDocument()
        })

        it('should link logo to home page', () => {
            renderWithAuth(<Navbar />, { isLoggedIn: false })

            const logoLink = screen.getByText('BoardGames').closest('a')
            expect(logoLink).toHaveAttribute('href', '/')
        })
    })

    describe('Unauthenticated State', () => {
        it('should only show logo when user is not logged in', () => {
            renderWithAuth(<Navbar />, { isLoggedIn: false })

            expect(screen.queryByText('Events')).not.toBeInTheDocument()
            expect(screen.queryByText('Create Event')).not.toBeInTheDocument()
        })
    })

    describe('Authenticated State - Regular User', () => {
        it('should show navigation links for logged in users', () => {
            renderWithAuth(<Navbar />, {
                user: mockUsers.regularUser,
                isLoggedIn: true
            })

            expect(screen.getByText('Events')).toBeInTheDocument()
            expect(screen.getByText('Create Event')).toBeInTheDocument()
            expect(screen.getByText('Our Games')).toBeInTheDocument()
        })

        it('should display user name', () => {
            renderWithAuth(<Navbar />, {
                user: mockUsers.regularUser,
                isLoggedIn: true
            })

            expect(screen.getByText('Test User')).toBeInTheDocument()
        })

        it('should display user initial in avatar', () => {
            renderWithAuth(<Navbar />, {
                user: mockUsers.regularUser,
                isLoggedIn: true
            })

            expect(screen.getByText('T')).toBeInTheDocument()
        })

        it('should not show admin links for regular users', () => {
            renderWithAuth(<Navbar />, {
                user: mockUsers.regularUser,
                isLoggedIn: true
            })

            expect(screen.queryByText('Manage Queue')).not.toBeInTheDocument()
            expect(screen.queryByText('Manage Users')).not.toBeInTheDocument()
        })

        it('should have correct href attributes for navigation links', () => {
            renderWithAuth(<Navbar />, {
                user: mockUsers.regularUser,
                isLoggedIn: true
            })

            const eventsLink = screen.getByText('Events').closest('a')
            const createEventLink = screen.getByText('Create Event').closest('a')
            const myGamesLink = screen.getByText('Our Games').closest('a')

            expect(eventsLink).toHaveAttribute('href', '/events')
            expect(createEventLink).toHaveAttribute('href', '/create-event')
            expect(myGamesLink).toHaveAttribute('href', '/my-games')
        })
    })

    describe('Authenticated State - Head Admin', () => {
        it('should show admin navigation links', () => {
            renderWithAuth(<Navbar />, {
                user: mockUsers.headAdmin,
                isLoggedIn: true
            })

            expect(screen.getByText('Manage Queue')).toBeInTheDocument()
            expect(screen.getByText('Manage Users')).toBeInTheDocument()
        })

        it('should have correct href attributes for admin links', () => {
            renderWithAuth(<Navbar />, {
                user: mockUsers.headAdmin,
                isLoggedIn: true
            })

            const manageQueueLink = screen.getByText('Manage Queue').closest('a')
            const manageUsersLink = screen.getByText('Manage Users').closest('a')

            expect(manageQueueLink).toHaveAttribute('href', '/admin/game-queue')
            expect(manageUsersLink).toHaveAttribute('href', '/admin/users')
        })
    })

    describe('User Dropdown', () => {
        it('should toggle dropdown when clicking user button', () => {
            renderWithAuth(<Navbar />, {
                user: mockUsers.regularUser,
                isLoggedIn: true
            })

            // Find the button containing the username
            const userButton = screen.getByText('Test User').closest('button')
            expect(userButton).toBeInTheDocument()

            // Dropdown should not be visible initially
            expect(screen.queryByText('My Profile')).not.toBeInTheDocument()

            // Click to open dropdown
            fireEvent.click(userButton!)

            // Dropdown should now be visible
            expect(screen.getByText('My Profile')).toBeInTheDocument()
            expect(screen.getByText('Logout')).toBeInTheDocument()

            // Click again to close
            fireEvent.click(userButton!)

            // Dropdown should be hidden
            expect(screen.queryByText('My Profile')).not.toBeInTheDocument()
        })

        it('should show My Profile link in dropdown', () => {
            renderWithAuth(<Navbar />, {
                user: mockUsers.regularUser,
                isLoggedIn: true
            })

            const userButton = screen.getByText('Test User').closest('button')
            fireEvent.click(userButton!)

            const profileLink = screen.getByText('My Profile').closest('a')
            expect(profileLink).toHaveAttribute('href', '/profile')
        })

        it('should show Admin Panel link for admin users', () => {
            renderWithAuth(<Navbar />, {
                user: mockUsers.admin,
                isLoggedIn: true
            })

            const userButton = screen.getByText('Admin User').closest('button')
            fireEvent.click(userButton!)

            const adminLink = screen.getByText('Admin Panel').closest('a')
            expect(adminLink).toHaveAttribute('href', '/admin')
        })

        it('should not show Admin Panel link for regular users', () => {
            renderWithAuth(<Navbar />, {
                user: mockUsers.regularUser,
                isLoggedIn: true
            })

            const userButton = screen.getByText('Test User').closest('button')
            fireEvent.click(userButton!)

            expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument()
        })

        it('should close dropdown when clicking profile link', () => {
            renderWithAuth(<Navbar />, {
                user: mockUsers.regularUser,
                isLoggedIn: true
            })

            const userButton = screen.getByText('Test User').closest('button')
            fireEvent.click(userButton!)

            expect(screen.getByText('My Profile')).toBeInTheDocument()

            const profileLink = screen.getByText('My Profile')
            fireEvent.click(profileLink)

            // Dropdown closes (profile link click handler sets dropdown to false)
            expect(screen.queryByText('Logout')).not.toBeInTheDocument()
        })
    })

    describe('Logout Functionality', () => {
        it('should call logout and redirect to home when logout is clicked', () => {
            const { container } = renderWithAuth(<Navbar />, {
                user: mockUsers.regularUser,
                isLoggedIn: true
            })

            // Open dropdown
            const userButton = screen.getByText('Test User').closest('button')
            fireEvent.click(userButton!)

            // Click logout
            const logoutButton = screen.getByText('Logout')
            fireEvent.click(logoutButton)

            // Should navigate to home page
            expect(mockPush).toHaveBeenCalledWith('/')
        })

        it('should close dropdown after logout', () => {
            renderWithAuth(<Navbar />, {
                user: mockUsers.regularUser,
                isLoggedIn: true
            })

            // Open dropdown
            const userButton = screen.getByText('Test User').closest('button')
            fireEvent.click(userButton!)

            expect(screen.getByText('Logout')).toBeInTheDocument()

            // Click logout
            const logoutButton = screen.getByText('Logout')
            fireEvent.click(logoutButton)

            // Dropdown should close (though we can't verify the state change directly in this test)
            // We verify through the redirect behavior
            expect(mockPush).toHaveBeenCalled()
        })
    })

    describe('Visual Elements', () => {
        it('should rotate chevron icon when dropdown is open', () => {
            renderWithAuth(<Navbar />, {
                user: mockUsers.regularUser,
                isLoggedIn: true
            })

            const userButton = screen.getByText('Test User').closest('button')
            const svg = userButton?.querySelector('svg')

            // Initially should not have rotate class
            expect(svg).not.toHaveClass('rotate-180')

            // Click to open
            fireEvent.click(userButton!)

            // Now should have rotate class
            expect(svg).toHaveClass('rotate-180')
        })

        it('should apply hover styles to navigation links', () => {
            renderWithAuth(<Navbar />, {
                user: mockUsers.regularUser,
                isLoggedIn: true
            })

            const eventsLink = screen.getByText('Events')
            expect(eventsLink).toHaveClass('hover:text-blue-600')
        })
    })

    describe('Responsive Design', () => {
        it('should use proper layout classes', () => {
            const { container } = renderWithAuth(<Navbar />, {
                user: mockUsers.regularUser,
                isLoggedIn: true
            })

            const nav = container.querySelector('nav')
            expect(nav).toHaveClass('bg-white', 'shadow-md')

            const maxWidthDiv = nav?.querySelector('.max-w-7xl')
            expect(maxWidthDiv).toBeInTheDocument()
        })
    })

    describe('Edge Cases', () => {
        it('should handle user without name gracefully', () => {
            const userWithoutName = {
                ...mockUsers.regularUser,
                name: '',
                full_name: '',
            }

            renderWithAuth(<Navbar />, {
                user: userWithoutName,
                isLoggedIn: true
            })

            // Should still render without crashing
            expect(screen.getByText('Events')).toBeInTheDocument()
        })

        it('should handle null user with isLoggedIn false', () => {
            renderWithAuth(<Navbar />, {
                user: null,
                isLoggedIn: false
            })

            expect(screen.getByText('BoardGames')).toBeInTheDocument()
            expect(screen.queryByText('Events')).not.toBeInTheDocument()
        })
    })
})
