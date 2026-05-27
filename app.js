import { auth, db } from './firebase-config.js';
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// DOM Elements
const loading = document.getElementById('loading');
const loginContainer = document.getElementById('loginContainer');
const dashboard = document.getElementById('dashboard');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userName = document.getElementById('userName');

let currentUser = null;
let currentTenant = null;

// Show/Hide screens
function showLoading() {
  if (loading) loading.style.display = 'flex';
  if (loginContainer) loginContainer.style.display = 'none';
  if (dashboard) dashboard.style.display = 'none';
}

function showLogin() {
  if (loading) loading.style.display = 'none';
  if (loginContainer) loginContainer.style.display = 'flex';
  if (dashboard) dashboard.style.display = 'none';
}

function showDashboard() {
  if (loading) loading.style.display = 'none';
  if (loginContainer) loginContainer.style.display = 'none';
  if (dashboard) dashboard.style.display = 'flex';
}

// Initialize - show loading
showLoading();

// Check for redirect result
getRedirectResult(auth)
  .then((result) => {
    if (result) {
      console.log('Login successful!', result.user.email);
    }
  })
  .catch((error) => {
    console.error('Redirect error:', error);
    showLogin();
  });

// Auth state observer
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    if (userName) userName.textContent = user.displayName || user.email;
    showDashboard();
    console.log('User logged in:', user.email);
  } else {
    currentUser = null;
    showLogin();
    console.log('No user logged in');
  }
});

// Google login button
if (googleLoginBtn) {
  googleLoginBtn.addEventListener('click', () => {
    const provider = new GoogleAuthProvider();
    signInWithRedirect(auth, provider);
  });
}

// Logout button
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
      console.log('User logged out');
    }).catch((error) => {
      console.error('Logout error:', error);
    });
  });
}
