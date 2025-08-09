const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Helper function to generate test JWT token
export const generateTestToken = (payload: any, secret = 'test-secret', expiresIn = '1h') => {
  return jwt.sign(payload, secret, { expiresIn });
};

// Helper function to hash password for testing
export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 10);
};

// Helper function to create test user data
export const createTestUser = (overrides = {}) => {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    accountType: 'learner',
    isEmailVerified: true,
    isPhoneVerified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
};

// Helper function to create test test center data
export const createTestCenter = (overrides = {}) => {
  return {
    id: 'test-center-id',
    name: 'Test Driving Center',
    address: '123 Test Street',
    postcode: 'TE5T 1NG',
    latitude: 51.5074,
    longitude: -0.1278,
    region: 'London',
    testTypes: ['car'],
    isActive: true,
    ...overrides
  };
};

// Helper function to create test slot data
export const createTestSlot = (overrides = {}) => {
  return {
    id: 'test-slot-id',
    testCenterId: 'test-center-id',
    testType: 'car',
    dateTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    isAvailable: true,
    price: 62.00,
    lastChecked: new Date().toISOString(),
    ...overrides
  };
};

// Helper function to create test alert subscription
export const createTestAlertSubscription = (overrides = {}) => {
  return {
    id: 'test-subscription-id',
    userId: 'test-user-id',
    testCenterIds: ['test-center-id'],
    testType: 'car',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0], // 30 days from now
    earliestTime: '09:00',
    latestTime: '17:00',
    weekdaysOnly: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
};

// Helper function to create test request with auth header
export const createAuthenticatedRequest = (request: any, token: string) => {
  return request.set('Authorization', `Bearer ${token}`);
};

// Helper function to wait for async operations
export const waitFor = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Helper function to create mock Express request
export const createMockRequest = (overrides = {}) => {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    ...overrides
  };
};

// Helper function to create mock Express response
export const createMockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

// Helper function to create mock next function
export const createMockNext = () => {
  return jest.fn();
};

// Date helpers for testing
export const getDateString = (daysFromNow = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
};

export const getDateTimeString = (hoursFromNow = 0) => {
  const date = new Date();
  date.setHours(date.getHours() + hoursFromNow);
  return date.toISOString();
};
