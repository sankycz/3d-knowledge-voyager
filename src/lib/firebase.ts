import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut,
  onAuthStateChanged, User,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, deleteDoc, query, where, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | undefined;
let auth: any;
let db: any;
let googleProvider: any;

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
} else {
  // Placeholder objects for SSR or Build phase to avoid crashes
  app = undefined;
  auth = {} as any;
  db = {} as any;
  googleProvider = {} as any;
}

export const firebase = { app, auth, db, googleProvider };

export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google sign‑in failed", error);
    return null;
  }
};

export const signOutUser = async (): Promise<void> => {
  await signOut(auth);
};

export const onAuthStateChangedListener = (callback: (user: User | null) => void) => {
  if (auth && typeof auth.onAuthStateChanged === 'function') {
    return onAuthStateChanged(auth, callback);
  }
  return () => {}; // No-op unsubscribe for build/missing-keys
};

export const registerWithEmail = async (
  email: string,
  password: string,
  displayName?: string
): Promise<User | null> => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName && result.user) {
      await updateProfile(result.user, { displayName });
    }
    return result.user;
  } catch (error) {
    console.error("Email registration failed", error);
    throw error; // Re-throw so UI can show specific error
  }
};

export const loginWithEmail = async (
  email: string,
  password: string
): Promise<User | null> => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Email login failed", error);
    throw error; // Re-throw so UI can show specific error
  }
};

export const firestore = { db, collection, doc, setDoc, getDoc, addDoc, deleteDoc, query, where, getDocs };
