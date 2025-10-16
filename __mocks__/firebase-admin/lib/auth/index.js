// Mock for firebase-admin/auth
module.exports = {
  getAuth: jest.fn(() => ({
    verifyIdToken: jest.fn(() => Promise.resolve({
      uid: 'test-uid',
      email: 'test@example.com'
    })),
    getUser: jest.fn(() => Promise.resolve({
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: 'https://example.com/photo.jpg',
      customClaims: { admin: false }
    })),
    setCustomUserClaims: jest.fn(() => Promise.resolve())
  }))
};
