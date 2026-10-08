import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import fallbackConfig from '../firebase-applet-config.json';

// Configuration with environment variable overrides and static fallback
const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || fallbackConfig.projectId || 'vibrant-psyche-7q6d2',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || fallbackConfig.appId || '1:148411958444:web:d83f5c1432248cc0e24b09',
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || fallbackConfig.apiKey || 'AIzaSyCzMUnqrV6sAjsqkvvTXzedlfPrWzQyHxw',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || fallbackConfig.authDomain || 'vibrant-psyche-7q6d2.firebaseapp.com',
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || fallbackConfig.firestoreDatabaseId || 'ai-studio-pitstoproastbake-658e4fc2-2a16-4781-b50c-48454babd745',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || fallbackConfig.storageBucket || 'vibrant-psyche-7q6d2.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || fallbackConfig.messagingSenderId || '148411958444',
};

let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  db = firebaseConfig.firestoreDatabaseId
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
  auth = getAuth(app);
} catch (error) {
  console.warn('[Firebase] Initialization notice:', error);
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
    },
    operationType,
    path,
  };
  console.warn('[Firestore] Notice: ', JSON.stringify(errInfo));
}

export { app, db, auth };
