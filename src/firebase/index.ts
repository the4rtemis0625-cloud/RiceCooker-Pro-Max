'use client';
import { initializeFirebaseApp } from './config';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { FirebaseApp } from 'firebase/app';

// These are used for the non-provider approach, which can be useful in some cases
let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

function initializeFirebase() {
  if (!app) {
    app = initializeFirebaseApp();
    auth = getAuth(app);
    firestore = getFirestore(app);
  }
  return { app, auth, firestore };
}

// Re-exporting for broader compatibility. 
// The provider pattern is preferred.
function getFirebase() {
  return initializeFirebase();
}

export { initializeFirebase, getFirebase };
export * from './provider';
