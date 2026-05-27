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

             // ================== LEADS MANAGEMENT ==================

// Load and display leads
async function loadLeads() {
  if (!currentUser) return;
  
  const leadsList = document.getElementById('leadsList');
  const leadsToday = document.getElementById('leadsToday');
  const leadsMonth = document.getElementById('leadsMonth');
  
  if (!leadsList) return;
  
  try {
    const leadsQuery = query(
      collection(db, 'leads'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    const snapshot = await getDocs(leadsQuery);
    const leads = [];
    
    snapshot.forEach((doc) => {
      leads.push({ id: doc.id, ...doc.data() });
    });
    
    // Update stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayLeads = leads.filter(l => {
      const leadDate = l.createdAt?.toDate();
      return leadDate >= today;
    });
    
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthLeads = leads.filter(l => {
      const leadDate = l.createdAt?.toDate();
      return leadDate >= monthStart;
    });
    
    if (leadsToday) leadsToday.textContent = todayLeads.length;
    if (leadsMonth) leadsMonth.textContent = monthLeads.length;
    
    // Render leads list
    if (leads.length === 0) {
      leadsList.innerHTML = '<p style="text-align:center;color:#999;">Nenhum lead cadastrado</p>';
    } else {
      leadsList.innerHTML = leads.map(lead => `
        <div class="lead-item" data-id="${lead.id}">
          <div class="lead-name">${lead.name || 'Sem nome'}</div>
          <div class="lead-info">${lead.email || ''} ${lead.phone || ''}</div>
          <div class="lead-status status-${lead.status || 'new'}">${lead.status || 'novo'}</div>
        </div>
      `).join('');
    }
    
    console.log('Leads loaded:', leads.length);
  } catch (error) {
    console.error('Error loading leads:', error);
    if (leadsList) {
      leadsList.innerHTML = '<p style="color:red;">Erro ao carregar leads</p>';
    }
  }
}

// Call loadLeads when dashboard is shown
const originalShowDashboard = showDashboard;
showDashboard = function() {
  originalShowDashboard();
  loadLeads();
};
  });
}
