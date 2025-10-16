// Mock for Firebase Auth module
const GoogleAuthProvider = jest.fn(() => ({
  addScope: jest.fn()
}));

// Create a reusable auth instance
const mockAuthInstance = {
  currentUser: null,
  onAuthStateChanged: jest.fn(),
  signInWithPopup: jest.fn(),
  signOut: jest.fn()
};

const getAuth = jest.fn(() => mockAuthInstance);

const onAuthStateChanged = jest.fn((auth, callback) => {
  // You can call the callback with a mock user or null here to simulate auth events
  callback(null);
  return jest.fn(); // Return unsubscribe function mock
});

const signInWithPopup = jest.fn(() => Promise.resolve({
  user: {
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'https://example.com/photo.jpg',
    getIdToken: jest.fn(() => Promise.resolve('mock-id-token'))
  }
}));

const signOut = jest.fn(() => Promise.resolve());

module.exports = {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User: jest.fn()
};
