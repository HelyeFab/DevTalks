// Mock for Firebase Admin SDK

const mockCollection = (name) => ({
  doc: (id) => mockDoc(name, id),
  add: jest.fn(() => Promise.resolve({ id: 'auto-id' })),
  where: jest.fn(() => mockCollection(name)),
  orderBy: jest.fn(() => mockCollection(name)),
  limit: jest.fn(() => mockCollection(name)),
  get: jest.fn(() => Promise.resolve({
    empty: false,
    docs: [],
    forEach: jest.fn()
  }))
});

const mockDoc = (collection, id) => ({
  id: id || 'mock-doc-id',
  collection: jest.fn((subcollName) => mockCollection(`${collection}/${id}/${subcollName}`)),
  get: jest.fn(() => Promise.resolve({
    exists: true,
    id: id || 'mock-doc-id',
    data: () => ({}),
    ref: { id: id || 'mock-doc-id' }
  })),
  set: jest.fn(() => Promise.resolve()),
  update: jest.fn(() => Promise.resolve()),
  delete: jest.fn(() => Promise.resolve())
});

// Firestore mock
const firestoreMock = {
  collection: jest.fn((name) => mockCollection(name)),
  doc: jest.fn((path) => mockDoc('root', path)),
  runTransaction: jest.fn(async (transactionHandler) => {
    const transaction = {
      get: jest.fn(async (docRef) => ({
        exists: true,
        data: () => ({}),
        id: docRef.id
      })),
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };
    return transactionHandler(transaction);
  }),
  batch: jest.fn(() => ({
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn(() => Promise.resolve())
  })),
  FieldValue: {
    serverTimestamp: jest.fn(() => new Date()),
    increment: jest.fn((num) => num),
    arrayUnion: jest.fn((...items) => items),
    arrayRemove: jest.fn((...items) => items)
  }
};

// Auth mock
const authMock = {
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
};

// Storage mock
const storageMock = {
  bucket: jest.fn(() => ({
    file: jest.fn(() => ({
      save: jest.fn(() => Promise.resolve()),
      getSignedUrl: jest.fn(() => Promise.resolve(['https://storage.example.com/file.jpg'])),
      delete: jest.fn(() => Promise.resolve())
    })),
    upload: jest.fn(() => Promise.resolve([{ name: 'file.jpg' }]))
  }))
};

// Mock initializeApp() and cert() functions
const mockInitializeApp = jest.fn(() => ({}));
const mockCert = jest.fn(() => ({}));

// Mock the initAdmin function
const initAdmin = jest.fn(() => {
  return {
    db: firestoreMock,
    auth: authMock,
    storage: storageMock
  };
});

module.exports = {
  initializeApp: mockInitializeApp,
  credential: {
    cert: mockCert
  },
  firestore: () => firestoreMock,
  auth: () => authMock,
  storage: () => storageMock,
  initAdmin
};
