import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyBjZmY3fL-Jyl9CJ5w-pNv06e4sTqmO5RE",
  authDomain: "studio-8906801948-ecb0a.firebaseapp.com",
  projectId: "studio-8906801948-ecb0a",
  storageBucket: "studio-8906801948-ecb0a.firebasestorage.app",
  messagingSenderId: "195954628052",
  appId: "1:195954628052:web:8bb933952efd108e13b241"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
