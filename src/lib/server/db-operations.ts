'use server'

import { getAdminDb } from './firebase-admin'
import {
  DocumentData,
  // QueryDocumentSnapshot,
  // QuerySnapshot,
  Timestamp
} from 'firebase-admin/firestore'

/**
 * Server-side database operations
 * All Firestore operations should go through these functions
 */

/**
 * Gets a document by ID
 */
export async function getDocument(collection: string, docId: string) {
  try {
    const db = getAdminDb()
    const docRef = db.collection(collection).doc(docId)
    const doc = await docRef.get()

    if (!doc.exists) {
      return null
    }

    return {
      id: doc.id,
      ...doc.data()
    }
  } catch (error) {
    console.error(`Error getting document ${collection}/${docId}:`, error)
    throw error
  }
}

/**
 * Gets all documents from a collection
 */
export async function getCollection(
  collection: string,
  options?: {
    orderBy?: { field: string; direction: 'asc' | 'desc' }
    where?: { field: string; operator: FirebaseFirestore.WhereFilterOp; value: unknown }
    limit?: number
  }
) {
  try {
    const db = getAdminDb()
    let query: FirebaseFirestore.Query = db.collection(collection)

    if (options?.where) {
      query = query.where(options.where.field, options.where.operator, options.where.value)
    }

    if (options?.orderBy) {
      query = query.orderBy(options.orderBy.field, options.orderBy.direction)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const snapshot = await query.get()
    const documents: DocumentData[] = []

    snapshot.forEach((doc) => {
      documents.push({
        id: doc.id,
        ...doc.data()
      })
    })

    return documents
  } catch (error) {
    console.error(`Error getting collection ${collection}:`, error)
    throw error
  }
}

/**
 * Creates a document in a collection
 */
export async function createDocument(collection: string, data: DocumentData) {
  try {
    const db = getAdminDb()
    const docRef = await db.collection(collection).add({
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })

    return {
      id: docRef.id,
      ...data
    }
  } catch (error) {
    console.error(`Error creating document in ${collection}:`, error)
    throw error
  }
}

/**
 * Updates a document
 */
export async function updateDocument(
  collection: string,
  docId: string,
  data: Partial<DocumentData>
) {
  try {
    const db = getAdminDb()
    const docRef = db.collection(collection).doc(docId)

    await docRef.update({
      ...data,
      updatedAt: Timestamp.now()
    })

    return {
      id: docId,
      ...data
    }
  } catch (error) {
    console.error(`Error updating document ${collection}/${docId}:`, error)
    throw error
  }
}

/**
 * Deletes a document
 */
export async function deleteDocument(collection: string, docId: string) {
  try {
    const db = getAdminDb()
    await db.collection(collection).doc(docId).delete()
    return { success: true }
  } catch (error) {
    console.error(`Error deleting document ${collection}/${docId}:`, error)
    throw error
  }
}

/**
 * Sets a document (creates or overwrites)
 */
export async function setDocument(
  collection: string,
  docId: string,
  data: DocumentData
) {
  try {
    const db = getAdminDb()
    await db.collection(collection).doc(docId).set({
      ...data,
      updatedAt: Timestamp.now()
    })

    return {
      id: docId,
      ...data
    }
  } catch (error) {
    console.error(`Error setting document ${collection}/${docId}:`, error)
    throw error
  }
}

/**
 * Runs a transaction
 */
export async function runTransaction<T>(
  callback: (transaction: FirebaseFirestore.Transaction) => Promise<T>
): Promise<T> {
  try {
    const db = getAdminDb()
    return await db.runTransaction(callback)
  } catch (error) {
    console.error('Error running transaction:', error)
    throw error
  }
}

/**
 * Batch write operations
 */
export async function batchWrite(
  operations: Array<{
    type: 'create' | 'update' | 'delete'
    collection: string
    docId?: string
    data?: DocumentData
  }>
) {
  try {
    const db = getAdminDb()
    const batch = db.batch()

    for (const op of operations) {
      const collectionRef = db.collection(op.collection)

      switch (op.type) {
        case 'create':
          if (op.data) {
            const docRef = collectionRef.doc()
            batch.set(docRef, {
              ...op.data,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now()
            })
          }
          break
        case 'update':
          if (op.docId && op.data) {
            const docRef = collectionRef.doc(op.docId)
            batch.update(docRef, {
              ...op.data,
              updatedAt: Timestamp.now()
            })
          }
          break
        case 'delete':
          if (op.docId) {
            const docRef = collectionRef.doc(op.docId)
            batch.delete(docRef)
          }
          break
      }
    }

    await batch.commit()
    return { success: true }
  } catch (error) {
    console.error('Error in batch write:', error)
    throw error
  }
}
