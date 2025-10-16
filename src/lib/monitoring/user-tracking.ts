/**
 * User action tracking
 * Track user interactions and behaviors
 */

import * as logger from '@/lib/logger';

export interface UserAction {
  action: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  page?: string;
  userAgent?: string;
}

/**
 * Track a user action
 */
export function trackUserAction(
  action: string,
  userId?: string,
  metadata?: Record<string, unknown>
): void {
  const userAction: UserAction = {
    action,
    userId,
    metadata,
    timestamp: new Date().toISOString(),
    page: typeof window !== 'undefined' ? window.location.pathname : undefined,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
  };

  logUserAction(userAction);

  // Send to analytics service in production
  if (process.env.NODE_ENV === 'production') {
    sendToAnalytics(userAction);
  }
}

/**
 * Log user action
 */
function logUserAction(action: UserAction): void {
  logger.info(`User action: ${action.action}`, {
    userId: action.userId,
    page: action.page,
    metadata: action.metadata,
  });
}

/**
 * Send to external analytics service
 */
function sendToAnalytics(action: UserAction): void {
  // Placeholder for analytics integration
  // Examples:
  // - Google Analytics
  // - Mixpanel
  // - Amplitude
  // - Custom analytics service

  /*
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action.action, {
      user_id: action.userId,
      page_path: action.page,
      ...action.metadata,
    });
  }
  */
}

/**
 * Common user actions
 */
export const UserActions = {
  // Authentication
  login: (userId: string, method: string) =>
    trackUserAction('user_login', userId, { method }),

  logout: (userId: string) => trackUserAction('user_logout', userId),

  signup: (userId: string, method: string) =>
    trackUserAction('user_signup', userId, { method }),

  // Content interaction
  viewPost: (userId: string | undefined, postId: string) =>
    trackUserAction('view_post', userId, { postId }),

  createPost: (userId: string, postId: string) =>
    trackUserAction('create_post', userId, { postId }),

  editPost: (userId: string, postId: string) =>
    trackUserAction('edit_post', userId, { postId }),

  deletePost: (userId: string, postId: string) =>
    trackUserAction('delete_post', userId, { postId }),

  upvotePost: (userId: string, postId: string) =>
    trackUserAction('upvote_post', userId, { postId }),

  // Comments
  createComment: (userId: string, postId: string, commentId: string) =>
    trackUserAction('create_comment', userId, { postId, commentId }),

  editComment: (userId: string, commentId: string) =>
    trackUserAction('edit_comment', userId, { commentId }),

  deleteComment: (userId: string, commentId: string) =>
    trackUserAction('delete_comment', userId, { commentId }),

  // Profile
  viewProfile: (viewerId: string | undefined, profileUserId: string) =>
    trackUserAction('view_profile', viewerId, { profileUserId }),

  editProfile: (userId: string) => trackUserAction('edit_profile', userId),

  // Search
  search: (userId: string | undefined, query: string, resultsCount: number) =>
    trackUserAction('search', userId, { query, resultsCount }),

  // Navigation
  pageView: (userId: string | undefined, page: string) =>
    trackUserAction('page_view', userId, { page }),

  // Errors
  error: (userId: string | undefined, errorType: string, message: string) =>
    trackUserAction('error', userId, { errorType, message }),

  // Feature usage
  featureUsed: (userId: string | undefined, feature: string) =>
    trackUserAction('feature_used', userId, { feature }),
};

/**
 * Track page view (client-side)
 */
export function trackPageView(page?: string): void {
  if (typeof window === 'undefined') return;

  const pathname = page || window.location.pathname;
  trackUserAction('page_view', undefined, {
    page: pathname,
    referrer: document.referrer,
    title: document.title,
  });
}

/**
 * Initialize analytics tracking
 */
export function initializeTracking(): void {
  if (typeof window === 'undefined') return;

  // Track initial page view
  trackPageView();

  // Track page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      trackUserAction('page_hidden');
    } else {
      trackUserAction('page_visible');
    }
  });

  // Track beforeunload (user leaving page)
  window.addEventListener('beforeunload', () => {
    trackUserAction('page_exit');
  });
}

/**
 * Create a session tracker
 */
export class SessionTracker {
  private sessionId: string;
  private startTime: number;
  private userId?: string;

  constructor(userId?: string) {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.userId = userId;

    trackUserAction('session_start', userId, {
      sessionId: this.sessionId,
    });
  }

  /**
   * End the session
   */
  end(): void {
    const duration = Date.now() - this.startTime;
    trackUserAction('session_end', this.userId, {
      sessionId: this.sessionId,
      duration,
    });
  }

  /**
   * Track action within session
   */
  trackAction(action: string, metadata?: Record<string, unknown>): void {
    trackUserAction(action, this.userId, {
      ...metadata,
      sessionId: this.sessionId,
    });
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}
