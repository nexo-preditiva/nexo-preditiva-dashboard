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
const leadForm = document.getElementById('leadForm');
const formFeedback = document.getElementById('formFeedback');
const btnRecarregar = document.getElementById('btnRecarregar');

let currentUser = null;

// Screen control
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

// Load Leads
async function loadLeads() {
  if (!currentUser || !leadsList) return;
  leadsList.innerHTML = '<p style="text-align:center;color:#888;padding:20px;">Carregando leads...</p>';
  try {
    const q = query(
      collection(db, 'leads'),
      where('uid', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    const snapshot = await getDocs(q);
    const leads = [];
    snapshot.forEach(doc => leads.push({ id: doc.id, ...doc.data() }));

    const now = new Date();
    const todayStr = now.toDateString();
    const todayCount = leads.filter(l => l.createdAt && new Date(l.createdAt.seconds * 1000).toDateString() === todayStr).length;
    const monthCount = leads.filter(l => l.createdAt && new Date(l.createdAt.seconds * 1000).getMonth() === now.getMonth() && new Date(l.createdAt.seconds * 1000).getFullYear() === now.getFullYear()).length;
    const converted = leads.filter(l => l.status === 'convertido').length;
    const rate = leads.length > 0 ? Math.round((converted / leads.length) * 100) : 0;

    if (leadsToday) leadsToday.textContent = todayCount;
    if (leadsMonth) leadsMonth.textContent = monthCount;
    if (conversionRate) conversionRate.textContent = rate + '%';

    if (leads.length === 0) {
      leadsList.innerHTML = '<p style="text-align:center;color:#888;padding:30px;">Nenhum lead cadastrado. Use o formulario acima para adicionar.</p>';
      return;
    }

    const statusLabels = { novo: 'Novo', contato: 'Em Contato', proposta: 'Proposta', negociacao: 'Negociacao', convertido: 'Convertido', perdido: 'Perdido' };
    leadsList.innerHTML = leads.map(lead => `
      <div class="lead-card">
        <div class="lead-info">
          <strong class="lead-nome">${lead.nome || 'Sem nome'}</strong>
          ${lead.empresa ? '<span class="lead-empresa">' + lead.empresa + '</span>' : ''}
          ${lead.email ? '<span class="lead-contact">' + lead.email + '</span>' : ''}
          ${lead.telefone ? '<span class="lead-contact">' + lead.telefone + '</span>' : ''}
          ${lead.origem ? '<span class="lead-origem">Origem: ' + lead.origem + '</span>' : ''}
          ${lead.observacao ? '<span class="lead-obs">' + lead.observacao + '</span>' : ''}
        </div>
        <span class="lead-status status-${lead.status || 'novo'}">${statusLabels[lead.status] || 'Novo'}</span>
      </div>
    `).join('');
  } catch (err) {
    console.error('Erro ao carregar leads:', err);
    leadsList.innerHTML = '<p style="color:red;padding:20px;">Erro ao carregar leads. Verifique o console.</p>';
  }
}

// Add Lead
async function addLead(e) {
  e.preventDefault();
  if (!currentUser) return;
  const nome = document.getElementById('leadNome')?.value.trim();
  if (!nome) return;
  const btn = document.getElementById('btnSalvarLead');
  if (btn) { btn.disabled = true; btn.textContent = 'Salvando...'; }
  if (formFeedback) { formFeedback.textContent = ''; formFeedback.className = 'form-feedback'; }
  try {
    await addDoc(collection(db, 'leads'), {
      uid: currentUser.uid,
      nome: nome,
      email: document.getElementById('leadEmail')?.value.trim() || '',
      telefone: document.getElementById('leadTelefone')?.value.trim() || '',
      empresa: document.getElementById('leadEmpresa')?.value.trim() || '',
      status: document.getElementById('leadStatus')?.value || 'novo',
      origem: document.getElementById('leadOrigem')?.value.trim() || '',
      observacao: document.getElementById('leadObservacao')?.value.trim() || '',
      createdAt: serverTimestamp()
    });
    if (leadForm) leadForm.reset();
    if (formFeedback) { formFeedback.textContent = 'Lead salvo com sucesso!'; formFeedback.className = 'form-feedback success'; }
    setTimeout(() => { if (formFeedback) formFeedback.textContent = ''; }, 3000);
    loadLeads();
  } catch (err) {
    console.error('Erro ao salvar lead:', err);
    if (formFeedback) { formFeedback.textContent = 'Erro ao salvar. Tente novamente.'; formFeedback.className = 'form-feedback error'; }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Salvar Lead'; }
  }
}

// Init
showLoading();

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

if (googleLoginBtn) {
  googleLoginBtn.addEventListener('click', async () => {
    try {
      googleLoginBtn.disabled = true;
      googleLoginBtn.textContent = 'Entrando...';
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      console.error('Erro no login:', err);
      googleLoginBtn.disabled = false;
      googleLoginBtn.textContent = 'Entrar com Google';
      alert('Erro: ' + err.message);
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => signOut(auth).catch(console.error));
}

if (leadForm) {
  leadForm.addEventListener('submit', addLead);
}

if (btnRecarregar) {
  btnRecarregar.addEventListener('click', loadLeads);
}
