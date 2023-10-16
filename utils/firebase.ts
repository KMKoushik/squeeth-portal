/**
 * File to initialize Firebase client SDK
 */

// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { CHAIN_ID } from '../constants/numbers'
import { Firestore } from "firebase/firestore"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig =
  CHAIN_ID === 1
    ? {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: 'crab-v2-mainnet.firebaseapp.com',
        projectId: 'crab-v2-mainnet',
        storageBucket: 'crab-v2-mainnet.appspot.com',
        messagingSenderId: '1059693712092',
        appId: '1:1059693712092:web:af420f0f65b1d87ac51a19',
        measurementId: 'G-EWNE553DPB',
      }
    : {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: 'crab-v2-testnet.firebaseapp.com',
        projectId: 'crab-v2-testnet',
        storageBucket: 'crab-v2-testnet.appspot.com',
        messagingSenderId: '694791446319',
        appId: '1:694791446319:web:6fc69622a67b9866e64bda',
        measurementId: 'G-WTFZNVKRCM',
      }

// Initialize Firebase
export const app = initializeApp(firebaseConfig)
let db: Firestore;

try {
  db = getFirestore(app);
} catch (error) {
  console.error("Error initializing Firestore: ", error);
}

export { db };
