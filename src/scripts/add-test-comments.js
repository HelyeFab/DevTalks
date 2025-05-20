// Script to add a test blog post and comments in top-level comments collection
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

async function addTestCommentsData() {
  try {
    const admin = initAdmin();
    const db = admin.firestore();

    // First, create a test blog post
    const postId = 'test-post';

    console.log(`Adding test post with ID ${postId}...`);
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

    console.log('Test post added successfully.');

    // Create a comment in the top-level comments collection
    console.log('Adding comment to top-level comments collection...');
    const commentRef = await db.collection('comments').add({
      content: 'This is a test comment in the top-level comments collection',
      postId: postId,
      userId: 'test-user-id',
      author: {
        name: 'Test User',
        email: 'testuser@example.com',
        image: '/images/default-avatar.svg'
      },
      createdAt: admin.firestore.Timestamp.fromDate(new Date()),
      updatedAt: admin.firestore.Timestamp.fromDate(new Date()),
      parentId: null
    });

    console.log(`Comment added with ID: ${commentRef.id}`);

    // Add a reply to the comment
    console.log('Adding reply to the comment...');
    const replyRef = await db.collection('comments').add({
      content: 'This is a reply to the test comment',
      postId: postId,
      userId: 'another-test-user-id',
      author: {
        name: 'Another Test User',
        email: 'anothertestuser@example.com',
        image: '/images/default-avatar.svg'
      },
      createdAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 60000)), // 1 minute later
      updatedAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 60000)),
      parentId: commentRef.id
    });

    console.log(`Reply added with ID: ${replyRef.id}`);
    console.log('Done adding test comments data.');

    process.exit(0);
  } catch (error) {
    console.error('Error adding test data:', error);
    process.exit(1);
  }
}

addTestCommentsData();
