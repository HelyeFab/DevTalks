// Mock for Firebase Storage module

class StorageReference {
  constructor(path) {
    this.path = path;
    this._childRefs = new Map();
  }

  child(path) {
    if (!this._childRefs.has(path)) {
      this._childRefs.set(path, new StorageReference(`${this.path}/${path}`));
    }
    return this._childRefs.get(path);
  }

  put(file) {
    return Promise.resolve({
      ref: this,
      metadata: {
        name: file.name || 'mock-file',
        size: file.size || 1024,
        contentType: file.type || 'application/octet-stream'
      },
      state: 'success',
      task: {},
      snapshot: {}
    });
  }

  putString(content, format = 'raw') {
    return Promise.resolve({
      ref: this,
      metadata: {
        name: 'mock-string-upload',
        size: content.length,
        contentType: 'text/plain'
      },
      state: 'success',
      task: {},
      snapshot: {}
    });
  }

  getDownloadURL() {
    return Promise.resolve(`https://example.com/storage/${this.path}`);
  }

  delete() {
    return Promise.resolve();
  }
}

class StorageBucket {
  constructor(name) {
    this.name = name;
    this._refs = new Map();
  }

  ref(path) {
    if (!this._refs.has(path)) {
      this._refs.set(path, new StorageReference(path));
    }
    return this._refs.get(path);
  }
}

// Create a mock Storage instance
const storageBucket = new StorageBucket('default-bucket');

// Function to create new Storage instances
const getStorage = jest.fn(() => storageBucket);
const ref = jest.fn((storage, path) => storage.ref(path));
const uploadBytes = jest.fn((storageRef, file) => storageRef.put(file));
const uploadString = jest.fn((storageRef, content, format) => storageRef.putString(content, format));
const getDownloadURL = jest.fn(storageRef => storageRef.getDownloadURL());
const deleteObject = jest.fn(storageRef => storageRef.delete());

module.exports = {
  getStorage,
  ref,
  uploadBytes,
  uploadString,
  getDownloadURL,
  deleteObject,
  StorageReference
};
