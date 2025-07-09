// Firebase initialization for DigiWallet
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAO-waz-VBRtmJmJTDFyGdKVHMTZ-0j7ao",
  authDomain: "digiwallet-96db8.firebaseapp.com",
  projectId: "digiwallet-96db8",
  storageBucket: "digiwallet-96db8.firebasestorage.app",
  messagingSenderId: "848967058254",
  appId: "1:848967058254:web:924b2f651fe51c16d5541f",
  measurementId: "G-FR699SCHSQ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
