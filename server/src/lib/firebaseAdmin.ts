import admin from 'firebase-admin';

// Initialize only if not already initialized
if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('Firebase Admin SDK initialized successfully.');
    } else {
      console.warn('Firebase Admin credentials missing. Phone auth will not work.');
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

export const firebaseAdmin = admin;
