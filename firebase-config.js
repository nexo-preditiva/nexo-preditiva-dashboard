import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyClvg8UCpPlJUQt-bqZbLCXOlOE_7zrP-w",
  authDomain: "nexo-preditiva-mvp.firebaseapp.com",
  projectId: "nexo-preditiva-mvp",
  storageBucket: "nexo-preditiva-mvp.firebasestorage.app",
  messagingSenderId: "579302029637",
  appId: "1:579302029637:web:867153b39b21343605262c"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
