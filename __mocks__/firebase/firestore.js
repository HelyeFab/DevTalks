// Mock for Firebase Firestore module

// Mock document snapshot
class DocumentSnapshot {
  constructor(id, data) {
    this.id = id;
    this._data = data;
  }

  exists() {
    return !!this._data;
  }

  data() {
    return this._data;
  }

  get(field) {
    return this._data ? this._data[field] : undefined;
  }
}

// Mock query snapshot
class QuerySnapshot {
  constructor(docs) {
    this.docs = docs || [];
    this.empty = this.docs.length === 0;
    this.size = this.docs.length;
  }

  forEach(callback) {
    this.docs.forEach(callback);
  }
}

// Mock for doc reference
class DocumentReference {
  constructor(id, data) {
    this.id = id;
    this._data = data;
    this._collections = new Map();
  }

  collection(name) {
    if (!this._collections.has(name)) {
      this._collections.set(name, new CollectionReference(name));
    }
    return this._collections.get(name);
  }

  get() {
    return Promise.resolve(new DocumentSnapshot(this.id, this._data));
  }

  set(data) {
    this._data = { ...this._data, ...data };
    return Promise.resolve();
  }

  update(data) {
    this._data = { ...this._data, ...data };
    return Promise.resolve();
  }

  delete() {
    this._data = null;
    return Promise.resolve();
  }
}

// Mock for collection reference
class CollectionReference {
  constructor(name) {
    this.id = name;
    this._docs = new Map();
  }

  doc(id) {
    if (!this._docs.has(id)) {
      this._docs.set(id, new DocumentReference(id, null));
    }
    return this._docs.get(id);
  }

  add(data) {
    const id = `auto-id-${Date.now()}`;
    const docRef = new DocumentReference(id, data);
    this._docs.set(id, docRef);
    return Promise.resolve(docRef);
  }

  get() {
    const docs = Array.from(this._docs.values())
      .map(docRef => new DocumentSnapshot(docRef.id, docRef._data));
    return Promise.resolve(new QuerySnapshot(docs));
  }

  where() {
    // Return this to allow chaining
    return this;
  }

  orderBy() {
    // Return this to allow chaining
    return this;
  }

  limit() {
    // Return this to allow chaining
    return this;
  }
}

// Firestore database mock
class FirestoreDatabase {
  constructor() {
    this._collections = new Map();
  }

  collection(path) {
    if (!this._collections.has(path)) {
      this._collections.set(path, new CollectionReference(path));
    }
    return this._collections.get(path);
  }

  doc(path) {
    const parts = path.split('/');
    const docId = parts.pop();
    const collPath = parts.join('/');

    return this.collection(collPath).doc(docId);
  }
}

// Main firestore functions
const collection = jest.fn((db, path) => db.collection(path));
const doc = jest.fn((dbOrCollection, path) => {
  if (typeof dbOrCollection.doc === 'function') {
    return dbOrCollection.doc(path);
  }
  return new DocumentReference(path, null);
});
const getDoc = jest.fn(docRef => docRef.get());
const getDocs = jest.fn(collectionRef => collectionRef.get());
const setDoc = jest.fn((docRef, data) => docRef.set(data));
const updateDoc = jest.fn((docRef, data) => docRef.update(data));
const deleteDoc = jest.fn(docRef => docRef.delete());
const addDoc = jest.fn((collectionRef, data) => collectionRef.add(data));

const query = jest.fn((collectionRef) => collectionRef);
const where = jest.fn(() => ({}));
const orderBy = jest.fn(() => ({}));
const limit = jest.fn(() => ({}));
const Timestamp = {
  now: jest.fn(() => ({ toDate: () => new Date() })),
  fromDate: jest.fn(date => ({ toDate: () => date }))
};
const increment = jest.fn(num => ({ type: 'increment', value: num }));
const runTransaction = jest.fn(async (db, callback) => {
  const transaction = {
    get: jest.fn(async (docRef) => docRef.get()),
    set: jest.fn(async (docRef, data) => docRef.set(data)),
    update: jest.fn(async (docRef, data) => docRef.update(data)),
    delete: jest.fn(async (docRef) => docRef.delete()),
  };
  return callback(transaction);
});

// Create a mock Firestore instance
const firestoreInstance = new FirestoreDatabase();

// Mock DocumentReference factory
const createDocumentReference = (id, initialData = null) => {
  return new DocumentReference(id, initialData);
};

// Function to create new Firestore instances
const getFirestore = jest.fn(() => firestoreInstance);

// Make sure doc returns a proper DocumentReference
doc.mockImplementation((dbOrCollection, path) => {
  if (typeof dbOrCollection.doc === 'function') {
    return dbOrCollection.doc(path);
  }
  return createDocumentReference(path, null);
});

// Make setDoc implementation
setDoc.mockImplementation((docRef, data) => {
  if (typeof docRef.set === 'function') {
    return docRef.set(data);
  }
  // If docRef has no set method, we use a simple implementation
  return Promise.resolve();
});

// Export all mocked Firestore functionality
module.exports = {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getFirestore,
  Timestamp,
  increment,
  runTransaction,
  DocumentData: jest.fn(),
  FirestoreError: jest.fn(),
  DocumentReference,
  CollectionReference,
  QuerySnapshot,
  DocumentSnapshot
};
