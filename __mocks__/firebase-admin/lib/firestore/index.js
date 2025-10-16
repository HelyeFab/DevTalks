// Mock for firebase-admin/firestore
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

module.exports = {
  getFirestore: jest.fn(() => firestoreMock),
  FieldValue: {
    serverTimestamp: jest.fn(() => new Date()),
    increment: jest.fn((num) => num),
    arrayUnion: jest.fn((...items) => items),
    arrayRemove: jest.fn((...items) => items)
  },
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() })),
    fromDate: jest.fn(date => ({ toDate: () => date }))
  }
};
