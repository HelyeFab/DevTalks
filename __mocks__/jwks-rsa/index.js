// Mock for jwks-rsa module
module.exports = {
  JwksClient: jest.fn().mockImplementation(() => ({
    getSigningKey: jest.fn().mockImplementation(() =>
      Promise.resolve({
        getPublicKey: jest.fn().mockReturnValue('mock-public-key'),
        publicKey: 'mock-public-key',
        kid: 'mock-kid',
      })
    ),
  })),
  expressJwtSecret: jest.fn(),
  hapiJwt2Key: jest.fn(),
  koaJwtSecret: jest.fn(),
  expressJwtSecret: jest.fn(),
  getKeysInterceptor: jest.fn(),
};
