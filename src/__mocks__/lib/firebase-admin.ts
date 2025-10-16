// Mock for src/lib/firebase-admin.ts
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Mock initAdmin function
export function initAdmin() {
  return {
    auth: getAuth(),
    db: getFirestore(),
    storage: getStorage()
  };
}
