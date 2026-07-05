import { initializeApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId
);

let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.error("Failed to initialize Firebase:", error);
  }
} else {
  console.warn(
    "Firebase is not configured. Falling back to LocalStorage and mock operations. " +
    "To enable live database storage and photo uploading, provide the Firebase configuration " +
    "keys in your .env file."
  );
}

export { db, storage };

/**
 * Uploads a complaint photo to Firebase Storage (or returns base64 fallback if not configured).
 */
export async function uploadComplaintPhoto(file: File): Promise<string> {
  if (!isFirebaseConfigured || !storage) {
    console.log("Firebase not configured: converting photo to base64 data URL");
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) resolve(reader.result as string);
        else reject(new Error("Failed to convert file to base64"));
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const fileExtension = file.name.split(".").pop() || "jpg";
  const filename = `complaint_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExtension}`;
  const storageRef = ref(storage, `complaints/${filename}`);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
}

/**
 * Uploads a citizen display picture (DP) to Firebase Storage (or returns base64 fallback).
 */
export async function uploadCitizenDP(file: File): Promise<string> {
  if (!isFirebaseConfigured || !storage) {
    console.log("Firebase not configured: converting DP to base64 data URL");
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) resolve(reader.result as string);
        else reject(new Error("Failed to convert file to base64"));
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const fileExtension = file.name.split(".").pop() || "jpg";
  const filename = `dp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExtension}`;
  const storageRef = ref(storage, `profiles/${filename}`);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
}
