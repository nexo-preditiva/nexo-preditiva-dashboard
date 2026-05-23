import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyD5yZXVW3lp1OnXZK7DqCFQ2pULPl-a-wo",
authDomain: "nexo-preditiva.github.io",  projectId: "studio-8906801948-ecb0a",
  storageBucket: "studio-8906801948-ecb0a.firebasestorage.app",
  messagingSenderId: "8906801948",
  appId: "1:8906801948:web:0a662f8c4e5b6e0a4f1b2c"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
