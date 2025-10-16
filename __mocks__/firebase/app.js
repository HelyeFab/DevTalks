// Mock for Firebase App module

const app = {
  name: 'mock-app',
  options: {
    apiKey: 'mock-api-key',
    authDomain: 'mock-auth-domain',
    projectId: 'mock-project-id',
    storageBucket: 'mock-storage-bucket',
    messagingSenderId: 'mock-sender-id',
    appId: 'mock-app-id',
    measurementId: 'mock-measurement-id'
  }
};

const initializeApp = jest.fn(() => app);
const getApp = jest.fn(() => app);
const getApps = jest.fn(() => [app]);
const deleteApp = jest.fn(() => Promise.resolve());

class FirebaseApp {
  constructor(options) {
    this.name = 'mock-app';
    this.options = options;
  }
}

module.exports = {
  initializeApp,
  getApp,
  getApps,
  deleteApp,
  FirebaseApp
};
