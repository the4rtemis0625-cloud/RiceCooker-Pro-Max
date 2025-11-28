'use client';
// This is a side-effect import that initializes the Firebase app.
// It is important to import this file before any other Firebase services.
import { initializeFirebaseApp } from './config';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { FirebaseApp } from 'firebase/app';

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

function getFirebase() {
  if (!app) {
    app = initializeFirebaseApp();
    auth = getAuth(app);
    firestore = getFirestore(app);
  }
  return { app, auth, firestore };
}

export { getFirebase };
