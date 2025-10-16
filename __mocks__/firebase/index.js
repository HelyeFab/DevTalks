// Mock for Firebase SDK
const auth = {
  currentUser: null,
  onAuthStateChanged: jest.fn(),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
  getAuth: jest.fn()
};

const firestore = {
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  setDoc: jest.fn(),
  runTransaction: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() })),
    fromDate: jest.fn(date => ({ toDate: () => date }))
  }
};

const app = {
  name: 'mock-app',
  options: {}
};

module.exports = {
  initializeApp: jest.fn(() => app),
  getApp: jest.fn(() => app),
  getAuth: jest.fn(() => auth),
  getFirestore: jest.fn(() => firestore),
  auth,
  firestore,
  app
};
