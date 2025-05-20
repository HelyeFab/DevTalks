// Script to add a test blog post to Firestore
const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Admin SDK
function initAdmin() {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  }
  return admin;
}

async function addTestPost() {
  try {
    const admin = initAdmin();
    const db = admin.firestore();

    // Create the test post document
    const postId = 'pDdGSv9wkeTbLqw6VHOD';

    await db.collection('blog_posts').doc(postId).set({
      title: 'Test Post',
      slug: 'test-post',
      published: true,
      content: 'This is a test post content for testing comments.',
      createdAt: admin.firestore.Timestamp.fromDate(new Date()),
      updatedAt: admin.firestore.Timestamp.fromDate(new Date()),
      author: {
        name: 'Test Author',
        email: 'test@example.com'
      }
    });

    console.log(`Successfully added test post with ID: ${postId}`);

    // Add a test comment to this post
    const commentRef = await db.collection('blog_posts').doc(postId)
      .collection('comments').add({
        content: 'This is a test comment',
        userId: 'test-user-id',
        author: {
          name: 'Test User',
          email: 'testuser@example.com',
          image: '/images/default-avatar.svg'
        },
        createdAt: admin.firestore.Timestamp.fromDate(new Date()),
        updatedAt: admin.firestore.Timestamp.fromDate(new Date()),
        postId: postId,
        parentId: null
      });

    console.log(`Successfully added test comment with ID: ${commentRef.id}`);

    process.exit(0);
  } catch (error) {
    console.error('Error adding test post:', error);
    process.exit(1);
  }
}

addTestPost();
