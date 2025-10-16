// Mock for Firebase Analytics module

const getAnalytics = jest.fn(() => ({
  logEvent: jest.fn(),
  setUserId: jest.fn(),
  setUserProperties: jest.fn(),
  setCurrentScreen: jest.fn(),
  setAnalyticsCollectionEnabled: jest.fn()
}));

const isSupported = jest.fn(() => Promise.resolve(true));
const logEvent = jest.fn();
const setUserId = jest.fn();
const setUserProperties = jest.fn();
const setCurrentScreen = jest.fn();
const setAnalyticsCollectionEnabled = jest.fn();

module.exports = {
  getAnalytics,
  isSupported,
  logEvent,
  setUserId,
  setUserProperties,
  setCurrentScreen,
  setAnalyticsCollectionEnabled
};
