// firebase.ts
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
 apiKey: "AIzaSyC4LIAb47mCRchGaqOLPe6mNXMZqo2Zrzs",
  authDomain: "zainb-68cfa.firebaseapp.com",
  databaseURL: "https://zainb-68cfa-default-rtdb.firebaseio.com",
  projectId: "zainb-68cfa",
  storageBucket: "zainb-68cfa.firebasestorage.app",
  messagingSenderId: "753461913184",
  appId: "1:753461913184:web:90252cc2436aaf7dd2c505",
  measurementId: "G-FYSRX4YJW4"
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const database = getDatabase(app);

export { auth, db, database };
