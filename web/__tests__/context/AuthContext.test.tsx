import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import * as api from '@/utils/api'

// Mock the API module
jest.mock('@/utils/api', () => ({
    authAPI: {
        login: jest.fn(),
        register: jest.fn(),
    },
    usersAPI: {
        getCurrentUser: jest.fn(),
    },
    APIError: class APIError extends Error {
        constructor(message: string, public status: number) {
            super(message)
            this.name = 'APIError'
        }
    },
}))

describe('AuthContext', () => {
    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks()

        // Clear localStorage
        localStorage.clear()

            // Reset mock implementations
            ; (api.authAPI.login as jest.Mock).mockReset()
            ; (api.authAPI.register as jest.Mock).mockReset()
            ; (api.usersAPI.getCurrentUser as jest.Mock).mockReset()
    })

    describe('useAuth Hook', () => {
        it('should throw error when used outside AuthProvider', () => {
            // Suppress console.error for this test
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

            expect(() => {
                renderHook(() => useAuth())
            }).toThrow('useAuth must be used within AuthProvider')

            consoleSpy.mockRestore()
        })

        it('should return context when used within AuthProvider', () => {
            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <AuthProvider>{children}</AuthProvider>
            )

            const { result } = renderHook(() => useAuth(), { wrapper })

            expect(result.current).toHaveProperty('user')
            expect(result.current).toHaveProperty('login')
            expect(result.current).toHaveProperty('logout')
            expect(result.current).toHaveProperty('isLoggedIn')
        })
    })

    describe('Initial State', () => {
        it('should initialize with no user', () => {
            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <AuthProvider>{children}</AuthProvider>
            )

            const { result } = renderHook(() => useAuth(), { wrapper })

            expect(result.current.user).toBeNull()
            expect(result.current.isLoggedIn).toBe(false)
            expect(result.current.token).toBeNull()
        })

        it('should load user from localStorage on mount', async () => {
            const mockUser = {
                id: 'user-1',
                email: 'test@example.com',
                full_name: 'Test User',
                role: 'user' as const,
            }

            localStorage.setItem('currentUser', JSON.stringify(mockUser))
            localStorage.setItem('authToken', 'test-token')

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <AuthProvider>{children}</AuthProvider>
            )

            const { result } = renderHook(() => useAuth(), { wrapper })

            await waitFor(() => {
                expect(result.current.user).toEqual(mockUser)
                expect(result.current.token).toBe('test-token')
                expect(result.current.isLoggedIn).toBe(true)
            })
        })

        it('should handle corrupted localStorage data gracefully', async () => {
            localStorage.setItem('currentUser', 'invalid-json')
            localStorage.setItem('authToken', 'test-token')

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <AuthProvider>{children}</AuthProvider>
            )

            const { result } = renderHook(() => useAuth(), { wrapper })

            await waitFor(() => {
                expect(result.current.user).toBeNull()
                expect(result.current.isLoggedIn).toBe(false)
            })

            // Should clear corrupted data
            expect(localStorage.getItem('currentUser')).toBeNull()
            expect(localStorage.getItem('authToken')).toBeNull()
        })
    })

    describe('Login', () => {
        it('should successfully login user', async () => {
            const mockResponse = {
                access_token: 'new-token',
                user: {
                    id: 'user-1',
                    email: 'test@example.com',
                    full_name: 'Test User',
                    role: 'user' as const,
                    is_active: true,
                },
            }

                ; (api.authAPI.login as jest.Mock).mockResolvedValue(mockResponse)

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <AuthProvider>{children}</AuthProvider>
            )

            const { result } = renderHook(() => useAuth(), { wrapper })

            await act(async () => {
                await result.current.login('test@example.com', 'password123')
            })

            expect(api.authAPI.login).toHaveBeenCalledWith('test@example.com', 'password123')
            expect(result.current.user).toEqual(expect.objectContaining({
                id: 'user-1',
                email: 'test@example.com',
                full_name: 'Test User',
                name: 'Test User',
            }))
            expect(result.current.token).toBe('new-token')
            expect(result.current.isLoggedIn).toBe(true)
            expect(localStorage.getItem('authToken')).toBe('new-token')
        })

        it('should store user data in localStorage after login', async () => {
            const mockResponse = {
                access_token: 'new-token',
                user: {
                    id: 'user-1',
                    email: 'test@example.com',
                    full_name: 'Test User',
                    role: 'user' as const,
                },
            }

                ; (api.authAPI.login as jest.Mock).mockResolvedValue(mockResponse)

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <AuthProvider>{children}</AuthProvider>
            )

            const { result } = renderHook(() => useAuth(), { wrapper })

            await act(async () => {
                await result.current.login('test@example.com', 'password123')
            })

            const storedUser = JSON.parse(localStorage.getItem('currentUser')!)
            expect(storedUser.id).toBe('user-1')
            expect(storedUser.email).toBe('test@example.com')
        })

        it('should handle login failure', async () => {
            ; (api.authAPI.login as jest.Mock).mockRejectedValue(new Error('Invalid credentials'))

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <AuthProvider>{children}</AuthProvider>
            )

            const { result } = renderHook(() => useAuth(), { wrapper })

            await expect(async () => {
                await act(async () => {
                    await result.current.login('test@example.com', 'wrongpassword')
                })
            }).rejects.toThrow('Invalid credentials')

            expect(result.current.user).toBeNull()
            expect(result.current.isLoggedIn).toBe(false)
        })

        it('should set isLoading during login', async () => {
            const mockResponse = {
                access_token: 'new-token',
                user: {
                    id: 'user-1',
                    email: 'test@example.com',
                    full_name: 'Test User',
                    role: 'user' as const,
                },
            }

            let resolveLogin: (value: any) => void
            const loginPromise = new Promise((resolve) => {
                resolveLogin = resolve
            })

                ; (api.authAPI.login as jest.Mock).mockReturnValue(loginPromise)

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <AuthProvider>{children}</AuthProvider>
            )

            const { result } = renderHook(() => useAuth(), { wrapper })

            // Start login
            act(() => {
                result.current.login('test@example.com', 'password123')
            })

            // Should be loading
            await waitFor(() => {
                expect(result.current.isLoading).toBe(true)
            })

            // Resolve login
            await act(async () => {
                resolveLogin!(mockResponse)
                await loginPromise
            })

            // Should no longer be loading
            expect(result.current.isLoading).toBe(false)
        })
    })

    describe('Register', () => {
        it('should successfully register user', async () => {
            const mockResponse = {
                access_token: 'new-token',
                user: {
                    id: 'user-1',
                    email: 'newuser@example.com',
                    full_name: 'New User',
                    role: 'user' as const,
                },
            }

                ; (api.authAPI.register as jest.Mock).mockResolvedValue(mockResponse)

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <AuthProvider>{children}</AuthProvider>
            )

            const { result } = renderHook(() => useAuth(), { wrapper })

            const registerData = {
                name: 'New User',
                email: 'newuser@example.com',
                password: 'password123',
                phone: '123-456-7890',
            }

            await act(async () => {
                await result.current.register!(registerData)
            })

            expect(api.authAPI.register).toHaveBeenCalledWith(registerData)
            expect(result.current.user).toEqual(expect.objectContaining({
                id: 'user-1',
                email: 'newuser@example.com',
            }))
            expect(result.current.isLoggedIn).toBe(true)
        })

        it('should handle registration failure', async () => {
            ; (api.authAPI.register as jest.Mock).mockRejectedValue(new Error('Email already exists'))

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <AuthProvider>{children}</AuthProvider>
            )

            const { result } = renderHook(() => useAuth(), { wrapper })

            await expect(async () => {
                await act(async () => {
                    await result.current.register!({
                        name: 'Test',
                        email: 'existing@example.com',
                        password: 'password123',
                    })
                })
            }).rejects.toThrow('Email already exists')

            expect(result.current.user).toBeNull()
        })
    })

    describe('Logout', () => {
        it('should clear user data on logout', async () => {
            const mockUser = {
                id: 'user-1',
                email: 'test@example.com',
                full_name: 'Test User',
                role: 'user' as const,
            }

            localStorage.setItem('currentUser', JSON.stringify(mockUser))
            localStorage.setItem('authToken', 'test-token')

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <AuthProvider>{children}</AuthProvider>
            )

            const { result } = renderHook(() => useAuth(), { wrapper })

            // Wait for initial load
            await waitFor(() => {
                expect(result.current.isLoggedIn).toBe(true)
            })

            // Logout
            act(() => {
                result.current.logout()
            })

            expect(result.current.user).toBeNull()
            expect(result.current.token).toBeNull()
            expect(result.current.isLoggedIn).toBe(false)
            expect(localStorage.getItem('currentUser')).toBeNull()
            expect(localStorage.getItem('authToken')).toBeNull()
        })
    })

    describe('Refresh User Data', () => {
        it('should refresh user data successfully', async () => {
            const initialUser = {
                id: 'user-1',
                email: 'test@example.com',
                full_name: 'Test User',
                role: 'user' as const,
            }

            const updatedUser = {
                id: 'user-1',
                email: 'test@example.com',
                full_name: 'Updated User',
                role: 'admin' as const,
                bio: 'New bio',
            }

            localStorage.setItem('currentUser', JSON.stringify(initialUser))
            localStorage.setItem('authToken', 'test-token')

                ; (api.usersAPI.getCurrentUser as jest.Mock).mockResolvedValue(updatedUser)

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <AuthProvider>{children}</AuthProvider>
            )

            const { result } = renderHook(() => useAuth(), { wrapper })

            await waitFor(() => {
                expect(result.current.isLoggedIn).toBe(true)
            })

            await act(async () => {
                await result.current.refreshUserData()
            })

            expect(api.usersAPI.getCurrentUser).toHaveBeenCalledWith('test-token')
            expect(result.current.user).toEqual(expect.objectContaining({
                id: 'user-1',
                full_name: 'Updated User',
                role: 'admin',
                bio: 'New bio',
            }))
        })

        it('should logout on 401 error during refresh', async () => {
            const mockUser = {
                id: 'user-1',
                email: 'test@example.com',
                full_name: 'Test User',
                role: 'user' as const,
            }

            localStorage.setItem('currentUser', JSON.stringify(mockUser))
            localStorage.setItem('authToken', 'expired-token')

            const error = new api.APIError('Unauthorized', 401)
                ; (api.usersAPI.getCurrentUser as jest.Mock).mockRejectedValue(error)

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <AuthProvider>{children}</AuthProvider>
            )

            const { result } = renderHook(() => useAuth(), { wrapper })

            await waitFor(() => {
                expect(result.current.isLoggedIn).toBe(true)
            })

            await act(async () => {
                await result.current.refreshUserData()
            })

            expect(result.current.user).toBeNull()
            expect(result.current.isLoggedIn).toBe(false)
            expect(localStorage.getItem('authToken')).toBeNull()
        })

        it('should not logout on non-401 errors', async () => {
            const mockUser = {
                id: 'user-1',
                email: 'test@example.com',
                full_name: 'Test User',
                role: 'user' as const,
            }

            localStorage.setItem('currentUser', JSON.stringify(mockUser))
            localStorage.setItem('authToken', 'test-token')

            const error = new api.APIError('Server Error', 500)
                ; (api.usersAPI.getCurrentUser as jest.Mock).mockRejectedValue(error)

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <AuthProvider>{children}</AuthProvider>
            )

            const { result } = renderHook(() => useAuth(), { wrapper })

            await waitFor(() => {
                expect(result.current.isLoggedIn).toBe(true)
            })

            await act(async () => {
                await result.current.refreshUserData()
            })

            // Should still be logged in
            expect(result.current.user).not.toBeNull()
            expect(result.current.isLoggedIn).toBe(true)
        })

        it('should not attempt refresh without token', async () => {
            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <AuthProvider>{children}</AuthProvider>
            )

            const { result } = renderHook(() => useAuth(), { wrapper })

            await act(async () => {
                await result.current.refreshUserData()
            })

            expect(api.usersAPI.getCurrentUser).not.toHaveBeenCalled()
        })
    })

    describe('Legacy Fields Compatibility', () => {
        it('should map full_name to name for backward compatibility', async () => {
            const mockResponse = {
                access_token: 'token',
                user: {
                    id: 'user-1',
                    email: 'test@example.com',
                    full_name: 'Test User',
                    role: 'user' as const,
                },
            }

                ; (api.authAPI.login as jest.Mock).mockResolvedValue(mockResponse)

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <AuthProvider>{children}</AuthProvider>
            )

            const { result } = renderHook(() => useAuth(), { wrapper })

            await act(async () => {
                await result.current.login('test@example.com', 'password123')
            })

            expect(result.current.user?.name).toBe('Test User')
        })

        it('should map home_address to homeAddress for backward compatibility', async () => {
            const mockResponse = {
                access_token: 'token',
                user: {
                    id: 'user-1',
                    email: 'test@example.com',
                    full_name: 'Test User',
                    home_address: '123 Main St',
                    role: 'user' as const,
                },
            }

                ; (api.authAPI.login as jest.Mock).mockResolvedValue(mockResponse)

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <AuthProvider>{children}</AuthProvider>
            )

            const { result } = renderHook(() => useAuth(), { wrapper })

            await act(async () => {
                await result.current.login('test@example.com', 'password123')
            })

            expect(result.current.user?.homeAddress).toBe('123 Main St')
        })
    })
})
