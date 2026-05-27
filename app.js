import { auth, db } from './firebase-config.js';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { collection, query, where, getDocs, addDoc, orderBy, limit, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// DOM Elements
const loading = document.getElementById('loading');
const loginContainer = document.getElementById('loginContainer');
const dashboard = document.getElementById('dashboard');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userName = document.getElementById('userName');
const leadsList = document.getElementById('leadsList');
const leadsToday = document.getElementById('leadsToday');
const leadsMonth = document.getElementById('leadsMonth');
const conversionRate = document.getElementById('conversionRate');

let currentUser = null;

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
  loadLeads();
}

// Load Leads from Firestore
async function loadLeads() {
  if (!currentUser || !leadsList) return;
  leadsList.innerHTML = '<p>Carregando leads...</p>';
  try {
    const q = query(
      collection(db, 'leads'),
      where('uid', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const snapshot = await getDocs(q);
    const leads = [];
    snapshot.forEach(doc => leads.push({ id: doc.id, ...doc.data() }));

    // Stats
    const now = new Date();
    const todayStr = now.toDateString();
    const todayLeads = leads.filter(l => l.createdAt && new Date(l.createdAt.seconds * 1000).toDateString() === todayStr);
    const monthLeads = leads.filter(l => l.createdAt && new Date(l.createdAt.seconds * 1000).getMonth() === now.getMonth());
    if (leadsToday) leadsToday.textContent = todayLeads.length;
    if (leadsMonth) leadsMonth.textContent = monthLeads.length;
    const converted = leads.filter(l => l.status === 'convertido').length;
    const rate = leads.length > 0 ? Math.round((converted / leads.length) * 100) : 0;
    if (conversionRate) conversionRate.textContent = rate + '%';

    // Render
    if (leads.length === 0) {
      leadsList.innerHTML = '<p style="color:#888;text-align:center;padding:20px;">Nenhum lead cadastrado ainda.</p>';
      return;
    }
    leadsList.innerHTML = leads.map(lead => `
      <div class="lead-card">
        <div class="lead-info">
          <strong>${lead.nome || 'Sem nome'}</strong>
          <span>${lead.email || ''}</span>
          <span>${lead.telefone || ''}</span>
        </div>
        <span class="lead-status status-${lead.status || 'novo'}">${lead.status || 'novo'}</span>
      </div>
    `).join('');
  } catch (err) {
    console.error('Erro ao carregar leads:', err);
    leadsList.innerHTML = '<p style="color:red;">Erro ao carregar leads. Tente novamente.</p>';
  }
}

// Initialize
showLoading();

// Auth state observer
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    if (userName) userName.textContent = user.displayName || user.email;
    showDashboard();
  } else {
    currentUser = null;
    showLogin();
  }
});

// Google Login
if (googleLoginBtn) {
  googleLoginBtn.addEventListener('click', async () => {
    try {
      googleLoginBtn.disabled = true;
      googleLoginBtn.textContent = 'Entrando...';
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error('Erro no login:', err);
      googleLoginBtn.disabled = false;
      googleLoginBtn.textContent = 'Entrar com Google';
      alert('Erro ao fazer login: ' + err.message);
    }
  });
}

// Logout
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    signOut(auth).catch(err => console.error('Erro ao sair:', err));
  });
}
