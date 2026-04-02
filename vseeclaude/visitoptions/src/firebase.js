import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD3B6nIYrRG1wHkmDZ6jcZRfPqCedBskGo",
  authDomain: "vsee-annotations-7e7d2.firebaseapp.com",
  projectId: "vsee-annotations-7e7d2",
  storageBucket: "vsee-annotations-7e7d2.firebasestorage.app",
  messagingSenderId: "1029636296125",
  appId: "1:1029636296125:web:c932518841acd19d6016d4",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const pinsCollection = collection(db, 'annotations');
const isConfigured = true;

export { db, pinsCollection, doc, onSnapshot, setDoc, deleteDoc, isConfigured };
