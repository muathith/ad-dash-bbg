import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC4LIAb47mCRchGaqOLPe6mNXMZqo2Zrzs",
  authDomain: "zainb-68cfa.firebaseapp.com",
  databaseURL: "https://zainb-68cfa-default-rtdb.firebaseio.com",
  projectId: "zainb-68cfa",
  storageBucket: "zainb-68cfa.firebasestorage.app",
  messagingSenderId: "753461913184",
  appId: "1:753461913184:web:90252cc2436aaf7dd2c505",
  measurementId: "G-FYSRX4YJW4",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
