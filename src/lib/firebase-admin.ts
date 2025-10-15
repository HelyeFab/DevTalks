import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

// Declare global types for our state tracking variables
declare global {
  var mockWarningLogged: boolean;
  var mockServicesLogged: boolean;
  var _inMemoryStore: {
    collections: Map<string, Map<string, any>>;
    userSessions: Map<string, string>; // Map user email to session ID
  };
  var _memoryDumpIntervalSet: boolean;
}

// Flag to track if Firebase Admin is available
let isFirebaseAdminAvailable = true;

// Validate environment variables
if (!process.env.FIREBASE_PROJECT_ID) {
  console.error('FIREBASE_PROJECT_ID is not set in environment variables');
  isFirebaseAdminAvailable = false;
}
if (!process.env.FIREBASE_CLIENT_EMAIL) {
  console.error('FIREBASE_CLIENT_EMAIL is not set in environment variables');
  isFirebaseAdminAvailable = false;
}
if (!process.env.FIREBASE_PRIVATE_KEY) {
  console.error('FIREBASE_PRIVATE_KEY is not set in environment variables');
  isFirebaseAdminAvailable = false;
}

// Check if private key looks like a placeholder
if (process.env.FIREBASE_PRIVATE_KEY?.includes('placeholder-for-new-key')) {
  // Only log details in production, use a more concise message in development
  if (process.env.NODE_ENV === 'production') {
    console.error('FIREBASE_PRIVATE_KEY appears to be a placeholder. Please replace with actual key.');
  }
  isFirebaseAdminAvailable = false;
}

const serviceAccount = isFirebaseAdminAvailable ? {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
} : null;

// Flag to indicate if we're in a development environment
const isDevelopment = process.env.NODE_ENV === 'development';

function getFirebaseAdminApp() {
  // If Firebase Admin is not properly configured
  if (!isFirebaseAdminAvailable) {
    if (isDevelopment) {
      // Use a simpler message in development - this may appear during HMR but is expected
      if (process.env.NODE_ENV === 'development') {
        // We don't try to deduplicate logs since HMR will reset module state anyway
        // Just make it clear this is normal in development mode
        console.log('[DEV MODE] Using Firebase Admin mock implementation (safe to ignore in development)');
      } else {
        console.warn('Firebase Admin is not properly configured. Check environment variables.');
      }
      // Return a mock app for development
      return null;
    } else {
      throw new Error('Firebase Admin is not properly configured. Check environment variables.');
    }
  }

  if (getApps().length === 0) {
    console.log('No Firebase Admin apps found, initializing...');
    try {
      if (!serviceAccount) {
        throw new Error('Service account is not properly configured');
      }

      const app = initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
      });
      console.log('Firebase Admin app initialized successfully');
      return app;
    } catch (error) {
      console.error('Error initializing Firebase Admin:', error);
      isFirebaseAdminAvailable = false;

      if (isDevelopment) {
        console.warn('Continuing with mock implementation for development.');
        return null;
      }

      throw error;
    }
  }
  console.log('Firebase Admin already initialized');
  return getApps()[0];
}

// Initialize the global store if it doesn't exist
if (!global._inMemoryStore) {
  global._inMemoryStore = {
    collections: new Map<string, Map<string, any>>(),
    userSessions: new Map<string, string>()
  };
}

// Use the global store reference
const inMemoryStore = global._inMemoryStore;

// Initialize in-memory store with some default data only if not already initialized
function initializeInMemoryStore() {
  // Only initialize if the collections are empty (first run)
  if (isDevelopment && inMemoryStore.collections.size === 0) {
    console.log('Initializing in-memory store with test data...');
    // Create test blog post in memory to avoid "post not found" errors
    const blogPostsCollection = new Map<string, any>();

    // Add a test post
    blogPostsCollection.set('test', {
      id: 'test',
      title: 'Test Post',
      content: 'This is a test post for development',
      published: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Set the blog_posts collection
    inMemoryStore.collections.set('blog_posts', blogPostsCollection);

    // Create top-level comments collection
    if (!inMemoryStore.collections.has('comments')) {
      inMemoryStore.collections.set('comments', new Map());

      // Add a sample comment for demonstration purposes
      const commentsCollection = inMemoryStore.collections.get('comments')!;
      commentsCollection.set('sample-comment-1', {
        id: 'sample-comment-1',
        content: 'This is a sample comment visible to all users',
        postId: 'test',
        userId: 'system',
        author: {
          name: 'System',
          email: 'system@example.com',
          image: '/images/default-avatar.svg'
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        parentId: null,
      });

      // Add a sample reply
      commentsCollection.set('sample-reply-1', {
        id: 'sample-reply-1',
        content: 'This is a sample reply to the first comment',
        postId: 'test',
        userId: 'system',
        author: {
          name: 'System',
          email: 'system@example.com',
          image: '/images/default-avatar.svg'
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        parentId: 'sample-comment-1',
      });
    }

    console.log('In-memory store initialized successfully');
  }
}

// Initialize the store
initializeInMemoryStore();

// Dump memory store content to console (for debugging)
function dumpMemoryStore() {
  if (isDevelopment) {
    console.log('===== IN-MEMORY STORE DUMP =====');
    console.log('Collections:');
    inMemoryStore.collections.forEach((value, key) => {
      console.log(`Collection: ${key}, Items: ${value.size}`);
      if (key.includes('comments')) {
        console.log('Comments:');
        value.forEach((comment, id) => {
          console.log(`- ${id}: ${comment.content} by ${comment.author?.name || 'Unknown'}`);
        });
      }
    });
    console.log('===============================');
  }
}

// Ensure the memory dump happens periodically in dev mode
if (isDevelopment && typeof setInterval !== 'undefined') {
  // Only run this in environments where setInterval is available
  // and only log this once per server instance
  if (!global._memoryDumpIntervalSet) {
    global._memoryDumpIntervalSet = true;
    // Dump memory store every 30 seconds
    setInterval(dumpMemoryStore, 30000);
    // Initial dump
    dumpMemoryStore();
  }
}

// Mock implementations for development
const mockDb = {
  collection: (collectionName: string) => {
    // Ensure collection exists in our store
    if (!inMemoryStore.collections.has(collectionName)) {
      inMemoryStore.collections.set(collectionName, new Map());
    }

      const collectionData = inMemoryStore.collections.get(collectionName)!;

      return {
        add: async (data: any) => {
          const uniqueId = `mock-id-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
          collectionData.set(uniqueId, data);
          console.log(`[DEV] Added document to ${collectionName} with ID ${uniqueId}:`, data);
          dumpMemoryStore();

          return {
            id: uniqueId,
            get: async () => ({
              data: () => data,
              exists: true
            })
          };
        },
        orderBy: (field: string, direction: 'asc' | 'desc' = 'asc') => ({
          get: async () => {
            const docs = Array.from(collectionData.entries())
              .map(([id, data]) => ({
                id,
                data: () => data,
                exists: true
              }))
              .sort((a, b) => {
                const aVal = a.data()[field];
                const bVal = b.data()[field];
                if (direction === 'asc') {
                  return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
                } else {
                  return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
                }
              });

            return {
              empty: docs.length === 0,
              size: docs.length,
              docs,
              forEach: (callback: (doc: any) => void) => docs.forEach(callback)
            };
          }
        }),
        where: (field: string, op: string, value: any) => {
          return {
            orderBy: () => ({
              get: async () => {
                const filteredDocs = Array.from(collectionData.entries())
                  .filter(([_, data]) => {
                    try {
                      // Check if data has the field we're filtering on
                      if (!data || !Object.prototype.hasOwnProperty.call(data, field)) {
                        return false;
                      }

                      // Simple operations support
                      switch (op) {
                        case '==': return data[field] === value;
                        case '>': return data[field] > value;
                        case '>=': return data[field] >= value;
                        case '<': return data[field] < value;
                        case '<=': return data[field] <= value;
                        case '!=': return data[field] !== value;
                        default: return false;
                      }
                    } catch (error) {
                      console.error('Error in where filter:', error);
                      return false;
                    }
                  })
                  .map(([id, data]) => ({
                    id,
                    data: () => data,
                    exists: true
                  }));

                return {
                  empty: filteredDocs.length === 0,
                  size: filteredDocs.length,
                  docs: filteredDocs,
                  forEach: (callback: (doc: any) => void) => filteredDocs.forEach(callback)
                };
              }
            })
          };
        },
        doc: (docId: string) => {
        const collectionData = inMemoryStore.collections.get(collectionName)!;

        return {
          collection: (subCollectionName: string) => {
            const fullSubCollectionName = `${collectionName}/${docId}/${subCollectionName}`;

            if (!inMemoryStore.collections.has(fullSubCollectionName)) {
              inMemoryStore.collections.set(fullSubCollectionName, new Map());
            }

            return {
              orderBy: () => ({
                get: async () => {
                  const subCollectionData = inMemoryStore.collections.get(fullSubCollectionName)!;
                  const docs = Array.from(subCollectionData.entries()).map(([id, data]) => ({
                    id,
                    data: () => data,
                    exists: true
                  }));

                  return {
                    empty: docs.length === 0,
                    size: docs.length,
                    docs,
                    forEach: (callback: (doc: any) => void) => docs.forEach(callback)
                  };
                }
              }),
              doc: (subDocId: string) => {
                const subCollectionData = inMemoryStore.collections.get(fullSubCollectionName)!;

                return {
                  get: async () => {
                    const data = subCollectionData.get(subDocId);
                    return {
                      exists: !!data,
                      data: () => data || null,
                      id: subDocId
                    };
                  },
                  set: async (data: any) => {
                    subCollectionData.set(subDocId, data);
                    console.log(`[DEV] Saved document to ${fullSubCollectionName}/${subDocId}:`, data);
                    dumpMemoryStore();
                  },
                  update: async (data: any) => {
                    const existing = subCollectionData.get(subDocId) || {};
                    const updated = { ...existing, ...data };
                    subCollectionData.set(subDocId, updated);
                    console.log(`[DEV] Updated document in ${fullSubCollectionName}/${subDocId}:`, updated);
                    dumpMemoryStore();
                  },
                  delete: async () => {
                    subCollectionData.delete(subDocId);
                    console.log(`[DEV] Deleted document from ${fullSubCollectionName}/${subDocId}`);
                    dumpMemoryStore();
                  }
                };
              },
              add: async (data: any) => {
                const subCollectionData = inMemoryStore.collections.get(fullSubCollectionName)!;
                const uniqueId = `mock-id-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
                subCollectionData.set(uniqueId, data);
                console.log(`[DEV] Added document to ${fullSubCollectionName} with ID ${uniqueId}:`, data);
                dumpMemoryStore();

                return {
                  id: uniqueId,
                  get: async () => ({
                    data: () => data,
                    exists: true
                  })
                };
              }
            };
          },
          get: async () => {
            const data = collectionData.get(docId);
            return {
              exists: !!data,
              data: () => data || null,
              id: docId
            };
          },
          set: async (data: any) => {
            collectionData.set(docId, data);
            console.log(`[DEV] Saved document to ${collectionName}/${docId}:`, data);
            dumpMemoryStore();
          },
          update: async (data: any) => {
            const existing = collectionData.get(docId) || {};
            const updated = { ...existing, ...data };
            collectionData.set(docId, updated);
            console.log(`[DEV] Updated document in ${collectionName}/${docId}:`, updated);
            dumpMemoryStore();
          },
          delete: async () => {
            collectionData.delete(docId);
            console.log(`[DEV] Deleted document from ${collectionName}/${docId}`);
            dumpMemoryStore();
          }
        };
      }
    };
  },
  // Mock transaction support
  runTransaction: async (callback: (transaction: any) => Promise<any>) => {
    // Simple mock transaction object
    const transaction = {
      get: async () => {
        // Generate a unique mock ID for transaction refs too
        const uniqueRefId = `mock-ref-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
        return {
          exists: false,
          data: () => null,
          ref: { id: uniqueRefId }
        };
      },
      set: async () => { },
      update: async () => { },
      delete: async () => { }
    };
    return await callback(transaction);
  }
};

// Enhanced mock auth with support for multiple users
const mockAuth = {
  verifyIdToken: async (token: string) => {
    // In dev mode, for testing multiple users, parse the token as a user email
    if (token && token.includes('@') && isDevelopment) {
      const email = token;

      // Get or create user session ID
      let userId = inMemoryStore.userSessions.get(email);
      if (!userId) {
        userId = `mock-user-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        inMemoryStore.userSessions.set(email, userId);
        console.log(`[DEV] Created mock user session for ${email}: ${userId}`);
      }

      const name = email.split('@')[0].split('.').map(part =>
        part.charAt(0).toUpperCase() + part.slice(1)
      ).join(' ');

      return {
        uid: userId,
        email: email,
        name: name,
        admin: email === process.env.ADMIN_EMAIL
      };
    }

    // Default mock user if token isn't an email
    return {
      uid: 'mock-user-id',
      email: 'mock@example.com',
      name: 'Mock User',
      admin: false
    };
  }
};

export function initAdmin() {
  const app = getFirebaseAdminApp();

  if (!app && isDevelopment) {
    // Development mode message has already been shown above, no need to log again
    return {
      app: null,
      auth: mockAuth,
      db: mockDb,
      isAvailable: false
    };
  }

  if (!app) {
    throw new Error('Firebase Admin app initialization failed');
  }

  const auth = getAuth(app);
  const db = getFirestore(app);
  console.log('Firebase Admin services initialized successfully');
  return {
    app,
    auth,
    db,
    isAvailable: true
  };
}

// Export auth and db for direct use
export { getAuth, getFirestore }
export { isFirebaseAdminAvailable }
