import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AddGame } from '@/app/my-games/AddGame'
import { renderWithAuth, mockUsers } from '../utils/test-utils'
import * as api from '@/utils/api'

// Mock the API
jest.mock('@/utils/api', () => ({
    gamesAPI: {
        createCustomGame: jest.fn(),
        addGameInstance: jest.fn(),
    },
}))

// Mock console.error to suppress expected errors
const originalError = console.error
beforeAll(() => {
    console.error = jest.fn()
})

afterAll(() => {
    console.error = originalError
})

describe('Initial Rendering', () => {
    it('should render the component with header', () => {
        renderWithAuth(
            <AddGame
                setErrorMessage={mockSetErrorMessage}
                setSuccessMessage={mockSetSuccessMessage}
            />,
            { user: mockUsers.regularUser, isLoggedIn: true, token: 'test-token' }
        )

        expect(screen.getByText('Add New Game')).toBeInTheDocument()
        expect(screen.getByText('Create and add a new game to our collection')).toBeInTheDocument()
    })

    it('should show New Game button initially', () => {
        renderWithAuth(
            <AddGame
                setErrorMessage={mockSetErrorMessage}
                setSuccessMessage={mockSetSuccessMessage}
            />,
            { user: mockUsers.regularUser, isLoggedIn: true, token: 'test-token' }
        )

        expect(screen.getByText('+ New Game')).toBeInTheDocument()
    })

    it('should not show form initially', () => {
        renderWithAuth(
            <AddGame
                setErrorMessage={mockSetErrorMessage}
                setSuccessMessage={mockSetSuccessMessage}
            />,
            { user: mockUsers.regularUser, isLoggedIn: true, token: 'test-token' }
        )

        expect(screen.queryByPlaceholderText('e.g., Carcassonne')).not.toBeInTheDocument()
    })
})

describe('Form Toggle', () => {
    it('should show form when New Game button is clicked', () => {
        renderWithAuth(
            <AddGame
                setErrorMessage={mockSetErrorMessage}
                setSuccessMessage={mockSetSuccessMessage}
            />,
            { user: mockUsers.regularUser, isLoggedIn: true, token: 'test-token' }
        )

        const newGameButton = screen.getByText('+ New Game')
        fireEvent.click(newGameButton)

        expect(screen.getByPlaceholderText('e.g., Carcassonne')).toBeInTheDocument()
        expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('should hide form when Cancel button is clicked', () => {
        renderWithAuth(
            <AddGame
                setErrorMessage={mockSetErrorMessage}
                setSuccessMessage={mockSetSuccessMessage}
            />,
            { user: mockUsers.regularUser, isLoggedIn: true, token: 'test-token' }
        )

        // Open form
        const newGameButton = screen.getByText('+ New Game')
        fireEvent.click(newGameButton)

        // Close form
        const cancelButton = screen.getByText('Cancel')
        fireEvent.click(cancelButton)

        expect(screen.queryByPlaceholderText('e.g., Carcassonne')).not.toBeInTheDocument()
    })
})

describe('Form Inputs', () => {
    beforeEach(() => {
        renderWithAuth(
            <AddGame
                setErrorMessage={mockSetErrorMessage}
                setSuccessMessage={mockSetSuccessMessage}
            />,
            { user: mockUsers.regularUser, isLoggedIn: true, token: 'test-token' }
        )

        // Open form
        const newGameButton = screen.getByText('+ New Game')
        fireEvent.click(newGameButton)
    })

    it('should handle game name input', () => {
        const nameInput = screen.getByPlaceholderText('e.g., Carcassonne')
        fireEvent.change(nameInput, { target: { value: 'Catan' } })

        expect(nameInput).toHaveValue('Catan')
    })

    it('should have exact player counts selected by default', () => {
        const exactRadio = screen.getByLabelText(/Specific values/)
        expect(exactRadio).toBeChecked()
    })

    it('should show exact player counts input when exact is selected', () => {
        expect(screen.getByPlaceholderText('e.g., 2, 3, 4, 6')).toBeInTheDocument()
    })

    it('should switch to minMax input fields', () => {
        const minMaxRadio = screen.getByLabelText(/Min-Max range/)
        fireEvent.click(minMaxRadio)

        expect(screen.getByPlaceholderText('Min players')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Max players')).toBeInTheDocument()
    })

    it('should switch to minOnly input field', () => {
        const minOnlyRadio = screen.getByLabelText(/Minimum only/)
        fireEvent.click(minOnlyRadio)

        expect(screen.getByPlaceholderText('Minimum players')).toBeInTheDocument()
    })

    it('should handle duration input', () => {
        const durationInput = screen.getByPlaceholderText('e.g., 1, 1.5, 2')
        fireEvent.change(durationInput, { target: { value: '2.5' } })

        expect(durationInput).toHaveValue(2.5)
    })
})

describe('Form Validation', () => {
    beforeEach(() => {
        renderWithAuth(
            <AddGame
                setErrorMessage={mockSetErrorMessage}
                setSuccessMessage={mockSetSuccessMessage}
            />,
            { user: mockUsers.regularUser, isLoggedIn: true, token: 'test-token' }
        )

        // Open form
        const newGameButton = screen.getByText('+ New Game')
        fireEvent.click(newGameButton)
    })

    it('should show error when game name is empty', async () => {
        const submitButton = screen.getByText('Add Game to Collection')
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(mockSetErrorMessage).toHaveBeenCalledWith('Game name is required')
        })
    })

    it('should show error when exact player counts are invalid', async () => {
        const nameInput = screen.getByPlaceholderText('e.g., Carcassonne')
        fireEvent.change(nameInput, { target: { value: 'Test Game' } })

        const playerCountsInput = screen.getByPlaceholderText('e.g., 2, 3, 4, 6')
        fireEvent.change(playerCountsInput, { target: { value: 'invalid' } })

        const durationInput = screen.getByPlaceholderText('e.g., 1, 1.5, 2')
        fireEvent.change(durationInput, { target: { value: '1' } })

        const submitButton = screen.getByText('Add Game to Collection')
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(mockSetErrorMessage).toHaveBeenCalledWith(
                'Please enter valid player counts (comma separated, e.g., 2, 3, 4)'
            )
        })
    })

    it('should show error when min is greater than max', async () => {
        const nameInput = screen.getByPlaceholderText('e.g., Carcassonne')
        fireEvent.change(nameInput, { target: { value: 'Test Game' } })

        const minMaxRadio = screen.getByLabelText(/Min-Max range/)
        fireEvent.click(minMaxRadio)

        const minInput = screen.getByPlaceholderText('Min players')
        const maxInput = screen.getByPlaceholderText('Max players')
        fireEvent.change(minInput, { target: { value: '5' } })
        fireEvent.change(maxInput, { target: { value: '2' } })

        const durationInput = screen.getByPlaceholderText('e.g., 1, 1.5, 2')
        fireEvent.change(durationInput, { target: { value: '1' } })

        const submitButton = screen.getByText('Add Game to Collection')
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(mockSetErrorMessage).toHaveBeenCalledWith(
                'Please enter valid min and max player counts'
            )
        })
    })

    it('should show error when duration is too short', async () => {
        const nameInput = screen.getByPlaceholderText('e.g., Carcassonne')
        fireEvent.change(nameInput, { target: { value: 'Test Game' } })

        const playerCountsInput = screen.getByPlaceholderText('e.g., 2, 3, 4, 6')
        fireEvent.change(playerCountsInput, { target: { value: '2, 3' } })

        const durationInput = screen.getByPlaceholderText('e.g., 1, 1.5, 2')
        fireEvent.change(durationInput, { target: { value: '0.1' } })

        const submitButton = screen.getByText('Add Game to Collection')
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(mockSetErrorMessage).toHaveBeenCalledWith(
                'Game duration must be at least 15 minutes (0.25 hours)'
            )
        })
    })

    it('should show error when no token is available', async () => {
        // Re-render without token
        const { unmount } = render(
            <AddGame
                setErrorMessage={mockSetErrorMessage}
                setSuccessMessage={mockSetSuccessMessage}
            />
        )

        const newGameButton = screen.getByText('+ New Game')
        fireEvent.click(newGameButton)

        const nameInput = screen.getByPlaceholderText('e.g., Carcassonne')
        fireEvent.change(nameInput, { target: { value: 'Test Game' } })

        const playerCountsInput = screen.getByPlaceholderText('e.g., 2, 3, 4, 6')
        fireEvent.change(playerCountsInput, { target: { value: '2, 3' } })

        const durationInput = screen.getByPlaceholderText('e.g., 1, 1.5, 2')
        fireEvent.change(durationInput, { target: { value: '1' } })

        const submitButton = screen.getByText('Add Game to Collection')
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(mockSetErrorMessage).toHaveBeenCalledWith('No authentication token found')
        })

        unmount()
    })
})

describe('Successful Game Creation', () => {
    it('should create game with exact player counts', async () => {
        const mockApiResponse = {
            id: 'game-1',
            name: 'Test Game',
            valid_player_counts: [2, 3, 4],
            length_in_minutes: 60,
        }

            ; (api.gamesAPI.createCustomGame as jest.Mock).mockResolvedValue(mockApiResponse)
            ; (api.gamesAPI.addGameInstance as jest.Mock).mockResolvedValue({})

        renderWithAuth(
            <AddGame
                setErrorMessage={mockSetErrorMessage}
                setSuccessMessage={mockSetSuccessMessage}
            />,
            { user: mockUsers.regularUser, isLoggedIn: true, token: 'test-token' }
        )

        // Open form
        const newGameButton = screen.getByText('+ New Game')
        fireEvent.click(newGameButton)

        // Fill form
        const nameInput = screen.getByPlaceholderText('e.g., Carcassonne')
        fireEvent.change(nameInput, { target: { value: 'Test Game' } })

        const playerCountsInput = screen.getByPlaceholderText('e.g., 2, 3, 4, 6')
        fireEvent.change(playerCountsInput, { target: { value: '2, 3, 4' } })

        const durationInput = screen.getByPlaceholderText('e.g., 1, 1.5, 2')
        fireEvent.change(durationInput, { target: { value: '1' } })

        // Submit
        const submitButton = screen.getByText('Add Game to Collection')
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(api.gamesAPI.createCustomGame).toHaveBeenCalledWith(
                {
                    name: 'Test Game',
                    valid_player_counts: [2, 3, 4],
                    length_in_minutes: 60,
                },
                'test-token'
            )
        })

        await waitFor(() => {
            expect(mockSetSuccessMessage).toHaveBeenCalledWith('"Test Game" added to our collection!')
        })
    })

    it('should create game with min-max range', async () => {
        const mockApiResponse = {
            id: 'game-2',
            name: 'Range Game',
            valid_player_counts: [2, 3, 4, 5],
            length_in_minutes: 90,
        }

            ; (api.gamesAPI.createCustomGame as jest.Mock).mockResolvedValue(mockApiResponse)
            ; (api.gamesAPI.addGameInstance as jest.Mock).mockResolvedValue({})

        renderWithAuth(
            <AddGame
                setErrorMessage={mockSetErrorMessage}
                setSuccessMessage={mockSetSuccessMessage}
            />,
            { user: mockUsers.regularUser, isLoggedIn: true, token: 'test-token' }
        )

        // Open form
        const newGameButton = screen.getByText('+ New Game')
        fireEvent.click(newGameButton)

        // Fill form
        const nameInput = screen.getByPlaceholderText('e.g., Carcassonne')
        fireEvent.change(nameInput, { target: { value: 'Range Game' } })

        const minMaxRadio = screen.getByLabelText(/Min-Max range/)
        fireEvent.click(minMaxRadio)

        const minInput = screen.getByPlaceholderText('Min players')
        const maxInput = screen.getByPlaceholderText('Max players')
        fireEvent.change(minInput, { target: { value: '2' } })
        fireEvent.change(maxInput, { target: { value: '5' } })

        const durationInput = screen.getByPlaceholderText('e.g., 1, 1.5, 2')
        fireEvent.change(durationInput, { target: { value: '1.5' } })

        // Submit
        const submitButton = screen.getByText('Add Game to Collection')
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(api.gamesAPI.createCustomGame).toHaveBeenCalledWith(
                {
                    name: 'Range Game',
                    valid_player_counts: [2, 3, 4, 5],
                    length_in_minutes: 90,
                },
                'test-token'
            )
        })
    })

    it('should create game with minimum only', async () => {
        const mockApiResponse = {
            id: 'game-3',
            name: 'Min Only Game',
            valid_player_counts: [3],
            length_in_minutes: 120,
        }

            ; (api.gamesAPI.createCustomGame as jest.Mock).mockResolvedValue(mockApiResponse)
            ; (api.gamesAPI.addGameInstance as jest.Mock).mockResolvedValue({})

        renderWithAuth(
            <AddGame
                setErrorMessage={mockSetErrorMessage}
                setSuccessMessage={mockSetSuccessMessage}
            />,
            { user: mockUsers.regularUser, isLoggedIn: true, token: 'test-token' }
        )

        // Open form
        const newGameButton = screen.getByText('+ New Game')
        fireEvent.click(newGameButton)

        // Fill form
        const nameInput = screen.getByPlaceholderText('e.g., Carcassonne')
        fireEvent.change(nameInput, { target: { value: 'Min Only Game' } })

        const minOnlyRadio = screen.getByLabelText(/Minimum only/)
        fireEvent.click(minOnlyRadio)

        const minInput = screen.getByPlaceholderText('Minimum players')
        fireEvent.change(minInput, { target: { value: '3' } })

        const durationInput = screen.getByPlaceholderText('e.g., 1, 1.5, 2')
        fireEvent.change(durationInput, { target: { value: '2' } })

        // Submit
        const submitButton = screen.getByText('Add Game to Collection')
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(api.gamesAPI.createCustomGame).toHaveBeenCalledWith(
                {
                    name: 'Min Only Game',
                    valid_player_counts: [3],
                    length_in_minutes: 120,
                },
                'test-token'
            )
        })
    })

    it('should reset form after successful creation', async () => {
        const mockApiResponse = {
            id: 'game-1',
            name: 'Test Game',
            valid_player_counts: [2, 3],
            length_in_minutes: 60,
        }

            ; (api.gamesAPI.createCustomGame as jest.Mock).mockResolvedValue(mockApiResponse)
            ; (api.gamesAPI.addGameInstance as jest.Mock).mockResolvedValue({})

        renderWithAuth(
            <AddGame
                setErrorMessage={mockSetErrorMessage}
                setSuccessMessage={mockSetSuccessMessage}
            />,
            { user: mockUsers.regularUser, isLoggedIn: true, token: 'test-token' }
        )

        // Open form
        const newGameButton = screen.getByText('+ New Game')
        fireEvent.click(newGameButton)

        // Fill form
        const nameInput = screen.getByPlaceholderText('e.g., Carcassonne')
        fireEvent.change(nameInput, { target: { value: 'Test Game' } })

        const playerCountsInput = screen.getByPlaceholderText('e.g., 2, 3, 4, 6')
        fireEvent.change(playerCountsInput, { target: { value: '2, 3' } })

        const durationInput = screen.getByPlaceholderText('e.g., 1, 1.5, 2')
        fireEvent.change(durationInput, { target: { value: '1' } })

        // Submit
        const submitButton = screen.getByText('Add Game to Collection')
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(mockSetSuccessMessage).toHaveBeenCalled()
        })

        // Form should be hidden after successful creation
        await waitFor(() => {
            expect(screen.queryByPlaceholderText('e.g., Carcassonne')).not.toBeInTheDocument()
        })
    })
})

describe('Error Handling', () => {
    it('should handle API error during game creation', async () => {
        ; (api.gamesAPI.createCustomGame as jest.Mock).mockRejectedValue(
            new Error('API Error: Failed to create game')
        )

        renderWithAuth(
            <AddGame
                setErrorMessage={mockSetErrorMessage}
                setSuccessMessage={mockSetSuccessMessage}
            />,
            { user: mockUsers.regularUser, isLoggedIn: true, token: 'test-token' }
        )

        // Open form
        const newGameButton = screen.getByText('+ New Game')
        fireEvent.click(newGameButton)

        // Fill form
        const nameInput = screen.getByPlaceholderText('e.g., Carcassonne')
        fireEvent.change(nameInput, { target: { value: 'Test Game' } })

        const playerCountsInput = screen.getByPlaceholderText('e.g., 2, 3, 4, 6')
        fireEvent.change(playerCountsInput, { target: { value: '2, 3' } })

        const durationInput = screen.getByPlaceholderText('e.g., 1, 1.5, 2')
        fireEvent.change(durationInput, { target: { value: '1' } })

        // Submit
        const submitButton = screen.getByText('Add Game to Collection')
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(mockSetErrorMessage).toHaveBeenCalledWith('API Error: Failed to create game')
        })
    })

    it('should continue even if adding to shared collection fails', async () => {
        const mockApiResponse = {
            id: 'game-1',
            name: 'Test Game',
            valid_player_counts: [2, 3],
            length_in_minutes: 60,
        }

            ; (api.gamesAPI.createCustomGame as jest.Mock).mockResolvedValue(mockApiResponse)
            ; (api.gamesAPI.addGameInstance as jest.Mock).mockRejectedValue(
                new Error('Failed to add to collection')
            )

        renderWithAuth(
            <AddGame
                setErrorMessage={mockSetErrorMessage}
                setSuccessMessage={mockSetSuccessMessage}
            />,
            { user: mockUsers.regularUser, isLoggedIn: true, token: 'test-token' }
        )

        // Open form
        const newGameButton = screen.getByText('+ New Game')
        fireEvent.click(newGameButton)

        // Fill form
        const nameInput = screen.getByPlaceholderText('e.g., Carcassonne')
        fireEvent.change(nameInput, { target: { value: 'Test Game' } })

        const playerCountsInput = screen.getByPlaceholderText('e.g., 2, 3, 4, 6')
        fireEvent.change(playerCountsInput, { target: { value: '2, 3' } })

        const durationInput = screen.getByPlaceholderText('e.g., 1, 1.5, 2')
        fireEvent.change(durationInput, { target: { value: '1' } })

        // Submit
        const submitButton = screen.getByText('Add Game to Collection')
        fireEvent.click(submitButton)

        // Should still show success message
        await waitFor(() => {
            expect(mockSetSuccessMessage).toHaveBeenCalledWith('"Test Game" added to our collection!')
        })
    })
})

describe('Message Timeout', () => {
    it('should clear error message after timeout', async () => {
        renderWithAuth(
            <AddGame
                setErrorMessage={mockSetErrorMessage}
                setSuccessMessage={mockSetSuccessMessage}
            />,
            { user: mockUsers.regularUser, isLoggedIn: true, token: 'test-token' }
        )

        // Open form
        const newGameButton = screen.getByText('+ New Game')
        fireEvent.click(newGameButton)

        // Trigger validation error
        const submitButton = screen.getByText('Add Game to Collection')
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(mockSetErrorMessage).toHaveBeenCalledWith('Game name is required')
        })

        // Fast-forward time
        jest.advanceTimersByTime(3000)

        await waitFor(() => {
            expect(mockSetErrorMessage).toHaveBeenCalledWith('')
        })
    })
})
})
