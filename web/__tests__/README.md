# Frontend Testing Documentation

## Overview

This directory contains comprehensive test suites for the BoardGames application frontend. The tests use Jest and React Testing Library to ensure all components and contexts work correctly.

## Test Structure

```
__tests__/
├── components/          # Component tests
│   ├── EventsList.test.tsx
│   ├── Navbar.test.tsx
│   └── AddGame.test.tsx
├── context/            # Context/Provider tests
│   └── AuthContext.test.tsx
└── utils/              # Test utilities and helpers
    └── test-utils.tsx
```

## Technologies

- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **@testing-library/jest-dom**: Custom matchers for DOM elements
- **@testing-library/user-event**: User interaction simulation

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test EventsList.test
```

## Test Coverage

### EventsList Component (`EventsList.test.tsx`)
Tests cover:
- ✅ Rendering of event details (date, location, organizer, duration)
- ✅ Event games display and game time calculations
- ✅ Event management buttons (Edit, Delete) for organizers
- ✅ Registration buttons and functionality
- ✅ Player count display
- ✅ User interactions (clicking buttons, event handlers)
- ✅ Edge cases (missing data, invalid dates, empty lists)

**Test Count**: 15 tests

### Navbar Component (`Navbar.test.tsx`)
Tests cover:
- ✅ Logo and brand rendering
- ✅ Authenticated vs unauthenticated state
- ✅ Navigation links for different user roles
- ✅ Admin-specific navigation (head-admin only)
- ✅ User dropdown functionality
- ✅ Logout functionality
- ✅ Visual elements and styling
- ✅ Edge cases (missing user data)

**Test Count**: 22 tests

### AuthContext (`AuthContext.test.tsx`)
Tests cover:
- ✅ Hook usage validation
- ✅ Initial state and localStorage loading
- ✅ Login functionality
- ✅ Registration functionality
- ✅ Logout functionality
- ✅ User data refresh
- ✅ Token management
- ✅ Error handling (401, 500, etc.)
- ✅ Legacy field compatibility
- ✅ Loading states

**Test Count**: 21 tests

### AddGame Component (`AddGame.test.tsx`)
Tests cover:
- ✅ Initial rendering and form toggle
- ✅ Form input handling (name, player counts, duration)
- ✅ Player count type switching (exact, min-max, min-only)
- ✅ Form validation (all input types)
- ✅ Successful game creation
- ✅ API integration
- ✅ Error handling
- ✅ Form reset after submission
- ✅ Message timeouts

**Test Count**: 20 tests

**Total Tests**: 78 comprehensive tests

## Test Utilities

### `test-utils.tsx`

Provides helper functions and mock data for testing:

#### `renderWithAuth()`
Renders components wrapped with a mock AuthContext provider.

```typescript
renderWithAuth(<YourComponent />, {
  user: mockUsers.regularUser,
  isLoggedIn: true,
  token: 'test-token'
})
```

#### Mock Users
Pre-defined user objects for testing:
- `mockUsers.regularUser` - Standard user
- `mockUsers.admin` - Admin user
- `mockUsers.headAdmin` - Head admin user

#### Mock Events
Sample event data for testing event-related components.

#### Mock API
Jest mock functions for API calls.

## Writing New Tests

### Basic Component Test Example

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import YourComponent from '@/components/YourComponent'

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })

  it('should handle user interaction', () => {
    render(<YourComponent />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(/* your assertion */).toBeTruthy()
  })
})
```

### Testing with Auth Context

```typescript
import { renderWithAuth, mockUsers } from '../utils/test-utils'
import YourComponent from '@/components/YourComponent'

describe('YourComponent with Auth', () => {
  it('should show admin features for admin users', () => {
    renderWithAuth(<YourComponent />, {
      user: mockUsers.admin,
      isLoggedIn: true,
      token: 'test-token'
    })
    expect(screen.getByText('Admin Panel')).toBeInTheDocument()
  })
})
```

### Async Testing

```typescript
import { waitFor } from '@testing-library/react'

it('should handle async operations', async () => {
  render(<YourComponent />)
  
  fireEvent.click(screen.getByText('Load Data'))
  
  await waitFor(() => {
    expect(screen.getByText('Data Loaded')).toBeInTheDocument()
  })
})
```

## Mocking

### Next.js Router
Already mocked in `jest.setup.js`:
```typescript
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    }
  },
}))
```

### API Calls
Mock API modules in your test file:
```typescript
jest.mock('@/utils/api', () => ({
  gamesAPI: {
    createCustomGame: jest.fn(),
  },
}))
```

## Best Practices

1. **Test Behavior, Not Implementation**: Focus on what users see and do, not internal component details.

2. **Use Semantic Queries**: Prefer `getByRole`, `getByLabelText`, `getByText` over `getByTestId`.

3. **Async Testing**: Always use `waitFor` when testing async operations.

4. **Clean Up**: Use `beforeEach` and `afterEach` to reset mocks and state.

5. **Descriptive Test Names**: Use clear, descriptive test names that explain what is being tested.

6. **Arrange-Act-Assert**: Structure tests with clear setup, action, and assertion phases.

## Common Patterns

### Testing Form Submission
```typescript
it('should submit form with valid data', async () => {
  render(<MyForm />)
  
  fireEvent.change(screen.getByLabelText('Name'), {
    target: { value: 'Test Name' }
  })
  
  fireEvent.click(screen.getByText('Submit'))
  
  await waitFor(() => {
    expect(mockSubmitHandler).toHaveBeenCalledWith({ name: 'Test Name' })
  })
})
```

### Testing Conditional Rendering
```typescript
it('should show admin panel for admin users only', () => {
  const { rerender } = renderWithAuth(<Component />, {
    user: mockUsers.regularUser,
    isLoggedIn: true
  })
  
  expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument()
  
  rerender(<Component />)
  renderWithAuth(<Component />, {
    user: mockUsers.admin,
    isLoggedIn: true
  })
  
  expect(screen.getByText('Admin Panel')).toBeInTheDocument()
})
```

## Debugging Tests

### View Rendered Output
```typescript
import { screen } from '@testing-library/react'

// Print the entire DOM
screen.debug()

// Print specific element
screen.debug(screen.getByRole('button'))
```

### Check Queries
```typescript
// Shows all available queries for current state
screen.logTestingPlaygroundURL()
```

## Troubleshooting

### "Unable to find an element with text..."
- Check if text is split across multiple elements
- Use regex: `screen.getByText(/partial text/i)`
- Verify the component actually renders the text

### "Not wrapped in act(...)"
- Use `waitFor()` for async operations
- Ensure all state updates are awaited

### "Cannot find module '@/...'"
- Check that path aliases are configured in `jest.config.js`
- Verify `moduleNameMapper` matches your `tsconfig.json`

## CI/CD Integration

Add to your CI pipeline:
```yaml
- name: Run Tests
  run: npm test -- --coverage --watchAll=false

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
