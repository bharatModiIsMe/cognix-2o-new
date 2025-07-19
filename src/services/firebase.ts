
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBm6JldgEPQUFbxxwbLPZIhKxuRpSkMO-c",
  authDomain: "cognix-auth-db.firebaseapp.com",
  databaseURL: "https://cognix-auth-db-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "cognix-auth-db",
  storageBucket: "cognix-auth-db.firebasestorage.app",
  messagingSenderId: "718990061567",
  appId: "1:718990061567:web:f874ba60d80476861041ca"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);

export default app;
