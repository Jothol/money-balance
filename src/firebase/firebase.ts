import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBASRUnvNMYAq_20CAL-TxDwCvOxcrMKFs",
  authDomain: "expenses-tracker-14519.firebaseapp.com",
  projectId: "expenses-tracker-14519",
  storageBucket: "expenses-tracker-14519.appspot.com",
  messagingSenderId: "580029298794",
  appId: "1:580029298794:web:85600322b0d19351ebf213",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
