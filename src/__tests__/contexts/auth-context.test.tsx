import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Mock the Firebase modules
jest.mock('firebase/auth');
jest.mock('firebase/firestore');
jest.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: null
  },
  db: {}
}));

// Test component that uses the auth context
const TestComponent = () => {
  const { user, loading, isAdmin, signInWithGoogle, signOut } = useAuth();

  return (
    <div>
      <div data-testid="loading-state">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="user-state">{user ? `User: ${user.email}` : 'No User'}</div>
      <div data-testid="admin-state">{isAdmin ? 'Admin' : 'Not Admin'}</div>
      <button onClick={signInWithGoogle} data-testid="signin-button">Sign In</button>
      <button onClick={signOut} data-testid="signout-button">Sign Out</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default auth state implementation
    (onAuthStateChanged as jest.Mock).mockImplementation((_auth, callback) => {
      callback(null); // Initially no user
      return jest.fn(); // Return unsubscribe function
    });
  });

  it('should render with initial loading state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading-state')).toHaveTextContent('Loading');
    expect(screen.getByTestId('user-state')).toHaveTextContent('No User');
    expect(screen.getByTestId('admin-state')).toHaveTextContent('Not Admin');
  });

  it('should handle sign in with Google', async () => {
    // Mock the user response
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: 'https://example.com/photo.jpg'
    };

    // Mock successful sign in
    (signInWithPopup as jest.Mock).mockResolvedValue({
      user: mockUser
    });

    // Mock Firestore doc functions
    (doc as jest.Mock).mockReturnValue({ id: 'test-uid' });
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({ isAdmin: true }),
    });

    // Render the test component
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial load to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading');
    });

    // Click sign in button
    const user = userEvent.setup();
    const signinButton = screen.getByTestId('signin-button');

    await act(async () => {
      await user.click(signinButton);
    });

    // Verify sign in was called
    expect(signInWithPopup).toHaveBeenCalled();

    // Mock the auth state change after sign in
    const callback = (onAuthStateChanged as jest.Mock).mock.calls[0][1];
    act(() => {
      callback(mockUser);
    });

    // Check if user data is displayed
    await waitFor(() => {
      expect(screen.getByTestId('user-state')).toHaveTextContent('User: test@example.com');
    });
  });

  it('should handle sign out', async () => {
    // Mock initial signed in state
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com'
    };

    (onAuthStateChanged as jest.Mock).mockImplementation((_auth, callback) => {
      // Start with a user already signed in
      callback(mockUser);
      return jest.fn();
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for user to be loaded
    await waitFor(() => {
      expect(screen.getByTestId('user-state')).toHaveTextContent('User: test@example.com');
    });

    // Click sign out button
    const user = userEvent.setup();
    const signoutButton = screen.getByTestId('signout-button');

    await act(async () => {
      await user.click(signoutButton);
    });

    // Mock the auth state change after sign out
    const callback = (onAuthStateChanged as jest.Mock).mock.calls[0][1];
    act(() => {
      callback(null);
    });

    // Check if user is signed out
    await waitFor(() => {
      expect(screen.getByTestId('user-state')).toHaveTextContent('No User');
      expect(screen.getByTestId('admin-state')).toHaveTextContent('Not Admin');
    });
  });

  it('should identify admin users correctly', async () => {
    // Mock admin user
    const mockUser = {
      uid: 'admin-uid',
      email: 'admin@example.com'
    };

    // Make onAuthStateChanged identify the user as an admin
    (onAuthStateChanged as jest.Mock).mockImplementation((_auth, callback) => {
      callback(mockUser);
      return jest.fn();
    });

    // Set up Firestore mock to return admin data
    (doc as jest.Mock).mockReturnValue({ id: 'admin-uid' });
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        adminEmail: 'admin@example.com',
        isAdmin: true
      }),
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Check if admin status is displayed properly
    await waitFor(() => {
      expect(screen.getByTestId('admin-state')).toHaveTextContent('Admin');
    });
  });
});
