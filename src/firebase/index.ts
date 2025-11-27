'use client';
// This is a side-effect import that initializes the Firebase app.
// It is important to import this file before any other Firebase services.
import { initializeFirebaseApp } from './config';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

function getFirebase() {
  const app = initializeFirebaseApp();
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  return { app, auth, firestore };
}

export { getFirebase };
