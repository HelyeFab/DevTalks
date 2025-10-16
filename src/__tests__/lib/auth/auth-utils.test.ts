/**
 * Tests for Authentication Utilities
 * Validates token verification, role checks, and user management
 */

import {
  verifyAuthToken,
  hasRole,
  extractBearerToken,
  isTokenValid,
  setUserClaims,
  promoteToModerator,
  promoteToAdmin,
  revokeUserTokens,
  disableUser,
  enableUser,
  getUserByUid,
  getUserByEmail,
} from '@/lib/auth/auth-utils';
import { getAdminAuth } from '@/lib/server/firebase-admin';
import { isUserAdmin } from '@/lib/server/admin-check';
import { AuthUserFactory } from '@/__tests__/utils/test-factories';

// Mock dependencies
jest.mock('@/lib/server/firebase-admin');
jest.mock('@/lib/server/admin-check');
jest.mock('@/lib/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('Authentication Utilities', () => {
  const mockAuth = {
    verifyIdToken: jest.fn(),
    getUser: jest.fn(),
    setCustomUserClaims: jest.fn(),
    revokeRefreshTokens: jest.fn(),
    updateUser: jest.fn(),
    getUserByEmail: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getAdminAuth as jest.Mock).mockReturnValue(mockAuth);
    (isUserAdmin as jest.Mock).mockResolvedValue(false);
  });

  describe('verifyAuthToken()', () => {
    it('should verify valid token successfully', async () => {
      const mockDecodedToken = {
        uid: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      const mockUserRecord = {
        uid: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: '/avatar.jpg',
        disabled: false,
      };

      mockAuth.verifyIdToken.mockResolvedValue(mockDecodedToken);
      mockAuth.getUser.mockResolvedValue(mockUserRecord);

      const result = await verifyAuthToken('valid-token');

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.uid).toBe('user-123');
      expect(result.user?.email).toBe('test@example.com');
      expect(result.error).toBeUndefined();
    });

    it('should fail with empty token', async () => {
      const result = await verifyAuthToken('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Token is required');
      expect(result.errorCode).toBe('TOKEN_INVALID');
    });

    it('should fail with expired token', async () => {
      mockAuth.verifyIdToken.mockRejectedValue({
        code: 'auth/id-token-expired',
        message: 'Token expired',
      });

      const result = await verifyAuthToken('expired-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Token has expired');
      expect(result.errorCode).toBe('TOKEN_EXPIRED');
    });

    it('should fail with revoked token', async () => {
      mockAuth.verifyIdToken.mockRejectedValue({
        code: 'auth/id-token-revoked',
        message: 'Token revoked',
      });

      const result = await verifyAuthToken('revoked-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Token has been revoked');
      expect(result.errorCode).toBe('TOKEN_REVOKED');
    });

    it('should fail with invalid token', async () => {
      mockAuth.verifyIdToken.mockRejectedValue({
        code: 'auth/invalid-id-token',
        message: 'Invalid token',
      });

      const result = await verifyAuthToken('invalid-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid token');
      expect(result.errorCode).toBe('TOKEN_INVALID');
    });

    it('should fail for disabled user', async () => {
      const mockDecodedToken = {
        uid: 'user-123',
        email: 'test@example.com',
      };

      const mockUserRecord = {
        uid: 'user-123',
        disabled: true,
      };

      mockAuth.verifyIdToken.mockResolvedValue(mockDecodedToken);
      mockAuth.getUser.mockResolvedValue(mockUserRecord);

      const result = await verifyAuthToken('valid-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User account is disabled');
      expect(result.errorCode).toBe('USER_DISABLED');
    });

    it('should detect admin role', async () => {
      const mockDecodedToken = {
        uid: 'admin-123',
        email: 'admin@example.com',
      };

      const mockUserRecord = {
        uid: 'admin-123',
        email: 'admin@example.com',
        disabled: false,
      };

      mockAuth.verifyIdToken.mockResolvedValue(mockDecodedToken);
      mockAuth.getUser.mockResolvedValue(mockUserRecord);
      (isUserAdmin as jest.Mock).mockResolvedValue(true);

      const result = await verifyAuthToken('admin-token');

      expect(result.success).toBe(true);
      expect(result.user?.isAdmin).toBe(true);
      expect(result.user?.role).toBe('admin');
    });

    it('should detect moderator role', async () => {
      const mockDecodedToken = {
        uid: 'mod-123',
        email: 'mod@example.com',
        moderator: true,
      };

      const mockUserRecord = {
        uid: 'mod-123',
        disabled: false,
      };

      mockAuth.verifyIdToken.mockResolvedValue(mockDecodedToken);
      mockAuth.getUser.mockResolvedValue(mockUserRecord);

      const result = await verifyAuthToken('mod-token');

      expect(result.success).toBe(true);
      expect(result.user?.isModerator).toBe(true);
      expect(result.user?.role).toBe('moderator');
    });
  });

  describe('hasRole()', () => {
    it('should allow user with exact role', () => {
      const user = AuthUserFactory.build({ role: 'moderator' });
      expect(hasRole(user, 'moderator')).toBe(true);
    });

    it('should allow admin for moderator role', () => {
      const user = AuthUserFactory.buildAdmin();
      expect(hasRole(user, 'moderator')).toBe(true);
    });

    it('should allow admin for user role', () => {
      const user = AuthUserFactory.buildAdmin();
      expect(hasRole(user, 'user')).toBe(true);
    });

    it('should not allow user for admin role', () => {
      const user = AuthUserFactory.build({ role: 'user' });
      expect(hasRole(user, 'admin')).toBe(false);
    });

    it('should not allow moderator for admin role', () => {
      const user = AuthUserFactory.buildModerator();
      expect(hasRole(user, 'admin')).toBe(false);
    });

    it('should handle role hierarchy correctly', () => {
      const regularUser = AuthUserFactory.build({ role: 'user' });
      const moderator = AuthUserFactory.buildModerator();
      const admin = AuthUserFactory.buildAdmin();

      // Regular user
      expect(hasRole(regularUser, 'user')).toBe(true);
      expect(hasRole(regularUser, 'moderator')).toBe(false);
      expect(hasRole(regularUser, 'admin')).toBe(false);

      // Moderator
      expect(hasRole(moderator, 'user')).toBe(true);
      expect(hasRole(moderator, 'moderator')).toBe(true);
      expect(hasRole(moderator, 'admin')).toBe(false);

      // Admin
      expect(hasRole(admin, 'user')).toBe(true);
      expect(hasRole(admin, 'moderator')).toBe(true);
      expect(hasRole(admin, 'admin')).toBe(true);
    });
  });

  describe('extractBearerToken()', () => {
    it('should extract token from valid Bearer header', () => {
      const token = extractBearerToken('Bearer abc123xyz');
      expect(token).toBe('abc123xyz');
    });

    it('should return null for missing header', () => {
      const token = extractBearerToken(null);
      expect(token).toBeNull();
    });

    it('should return null for invalid format', () => {
      const token = extractBearerToken('InvalidFormat abc123');
      expect(token).toBeNull();
    });

    it('should handle Bearer without space', () => {
      const token = extractBearerToken('Bearerabc123');
      expect(token).toBeNull();
    });

    it('should trim whitespace from token', () => {
      const token = extractBearerToken('Bearer   abc123   ');
      expect(token).toBe('abc123');
    });

    it('should return null for Bearer without token', () => {
      const token = extractBearerToken('Bearer ');
      expect(token).toBeNull();
    });
  });

  describe('isTokenValid()', () => {
    it('should return true for future expiration', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      expect(isTokenValid(futureTime)).toBe(true);
    });

    it('should return false for past expiration', () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      expect(isTokenValid(pastTime)).toBe(false);
    });

    it('should return false for current time (exactly expired)', () => {
      const currentTime = Math.floor(Date.now() / 1000);
      expect(isTokenValid(currentTime)).toBe(false);
    });
  });

  describe('setUserClaims()', () => {
    it('should set custom claims successfully', async () => {
      mockAuth.setCustomUserClaims.mockResolvedValue(undefined);

      await setUserClaims('user-123', { moderator: true });

      expect(mockAuth.setCustomUserClaims).toHaveBeenCalledWith('user-123', {
        moderator: true,
      });
    });

    it('should throw error on failure', async () => {
      mockAuth.setCustomUserClaims.mockRejectedValue(new Error('Failed'));

      await expect(setUserClaims('user-123', {})).rejects.toThrow(
        'Failed to set user claims'
      );
    });
  });

  describe('promoteToModerator()', () => {
    it('should set moderator claim', async () => {
      mockAuth.setCustomUserClaims.mockResolvedValue(undefined);

      await promoteToModerator('user-123');

      expect(mockAuth.setCustomUserClaims).toHaveBeenCalledWith('user-123', {
        moderator: true,
      });
    });
  });

  describe('promoteToAdmin()', () => {
    it('should set admin claim', async () => {
      mockAuth.setCustomUserClaims.mockResolvedValue(undefined);

      await promoteToAdmin('user-123');

      expect(mockAuth.setCustomUserClaims).toHaveBeenCalledWith('user-123', {
        admin: true,
      });
    });
  });

  describe('revokeUserTokens()', () => {
    it('should revoke refresh tokens', async () => {
      mockAuth.revokeRefreshTokens.mockResolvedValue(undefined);

      await revokeUserTokens('user-123');

      expect(mockAuth.revokeRefreshTokens).toHaveBeenCalledWith('user-123');
    });

    it('should throw error on failure', async () => {
      mockAuth.revokeRefreshTokens.mockRejectedValue(new Error('Failed'));

      await expect(revokeUserTokens('user-123')).rejects.toThrow(
        'Failed to revoke tokens'
      );
    });
  });

  describe('disableUser()', () => {
    it('should disable user account', async () => {
      mockAuth.updateUser.mockResolvedValue(undefined);

      await disableUser('user-123');

      expect(mockAuth.updateUser).toHaveBeenCalledWith('user-123', {
        disabled: true,
      });
    });

    it('should throw error on failure', async () => {
      mockAuth.updateUser.mockRejectedValue(new Error('Failed'));

      await expect(disableUser('user-123')).rejects.toThrow(
        'Failed to disable user account'
      );
    });
  });

  describe('enableUser()', () => {
    it('should enable user account', async () => {
      mockAuth.updateUser.mockResolvedValue(undefined);

      await enableUser('user-123');

      expect(mockAuth.updateUser).toHaveBeenCalledWith('user-123', {
        disabled: false,
      });
    });

    it('should throw error on failure', async () => {
      mockAuth.updateUser.mockRejectedValue(new Error('Failed'));

      await expect(enableUser('user-123')).rejects.toThrow(
        'Failed to enable user account'
      );
    });
  });

  describe('getUserByUid()', () => {
    it('should get user by UID', async () => {
      const mockUserRecord = {
        uid: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: '/avatar.jpg',
        customClaims: {},
      };

      mockAuth.getUser.mockResolvedValue(mockUserRecord);

      const user = await getUserByUid('user-123');

      expect(user).not.toBeNull();
      expect(user?.uid).toBe('user-123');
      expect(user?.email).toBe('test@example.com');
    });

    it('should return null on error', async () => {
      mockAuth.getUser.mockRejectedValue(new Error('User not found'));

      const user = await getUserByUid('nonexistent');

      expect(user).toBeNull();
    });

    it('should detect admin status', async () => {
      const mockUserRecord = {
        uid: 'admin-123',
        email: 'admin@example.com',
        customClaims: {},
      };

      mockAuth.getUser.mockResolvedValue(mockUserRecord);
      (isUserAdmin as jest.Mock).mockResolvedValue(true);

      const user = await getUserByUid('admin-123');

      expect(user?.isAdmin).toBe(true);
      expect(user?.role).toBe('admin');
    });
  });

  describe('getUserByEmail()', () => {
    it('should get user by email', async () => {
      const mockUserRecord = {
        uid: 'user-123',
        email: 'test@example.com',
      };

      mockAuth.getUserByEmail.mockResolvedValue(mockUserRecord);
      mockAuth.getUser.mockResolvedValue({
        ...mockUserRecord,
        customClaims: {},
      });

      const user = await getUserByEmail('test@example.com');

      expect(user).not.toBeNull();
      expect(user?.email).toBe('test@example.com');
    });

    it('should return null on error', async () => {
      mockAuth.getUserByEmail.mockRejectedValue(new Error('User not found'));

      const user = await getUserByEmail('nonexistent@example.com');

      expect(user).toBeNull();
    });
  });
});
