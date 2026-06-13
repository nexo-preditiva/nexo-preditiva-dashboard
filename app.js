import { auth, db } from './firebase-config.js?v=20260613';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, limit, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

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
const leadsConverted = document.getElementById('leadsConverted');
const conversionRate = document.getElementById('conversionRate');
const leadForm = document.getElementById('leadForm');
const formFeedback = document.getElementById('formFeedback');
const btnRecarregar = document.getElementById('btnRecarregar');
const searchInput = document.getElementById('searchInput');
const filterStatus = document.getElementById('filterStatus');
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const closeModal = document.getElementById('closeModal');
const btnCancelarEdit = document.getElementById('btnCancelarEdit');

let currentUser = null;
let allLeads = [];

const STATUS_LABELS = {
  novo: 'Novo',
  contato: 'Em Contato',
  proposta: 'Proposta Enviada',
  negociacao: 'Em Negociacao',
  convertido: 'Convertido',
  perdido: 'Perdido'
};

const STATUS_COLORS = {
  novo: '#4285f4',
  contato: '#ff9800',
  proposta: '#9c27b0',
  negociacao: '#00bcd4',
  convertido: '#4caf50',
  perdido: '#f44336'
};

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
  leadsList.innerHTML = '<p style="text-align:center;color:#888;">Carregando leads...</p>';
  try {
    const q = query(
      collection(db, 'leads'),
      where('uid', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(200)
    );
    const snapshot = await getDocs(q);
    allLeads = [];
    snapshot.forEach(d => allLeads.push({ id: d.id, ...d.data() }));
    updateStats();
    renderLeads();
  } catch (err) {
    console.error('Erro ao carregar leads:', err);
    leadsList.innerHTML = '<p style="text-align:center;color:red;">Erro ao carregar leads.</p>';
  }
}

function updateStats() {
  const now = new Date();
  const todayStr = now.toDateString();
  const todayCount = allLeads.filter(l => l.createdAt && new Date(l.createdAt.seconds * 1000).toDateString() === todayStr).length;
  const monthCount = allLeads.filter(l => l.createdAt && new Date(l.createdAt.seconds * 1000).getMonth() === now.getMonth() && new Date(l.createdAt.seconds * 1000).getFullYear() === now.getFullYear()).length;
  const converted = allLeads.filter(l => l.status === 'convertido').length;
  const rate = allLeads.length > 0 ? Math.round((converted / allLeads.length) * 100) : 0;
  if (leadsToday) leadsToday.textContent = todayCount;
  if (leadsMonth) leadsMonth.textContent = monthCount;
  if (leadsConverted) leadsConverted.textContent = converted;
  if (conversionRate) conversionRate.textContent = rate + '%';
}

function renderLeads() {
  const search = searchInput ? searchInput.value.toLowerCase() : '';
  const status = filterStatus ? filterStatus.value : '';
  let filtered = allLeads;
  if (status) filtered = filtered.filter(l => l.status === status);
  if (search) filtered = filtered.filter(l =>
    (l.nome || '').toLowerCase().includes(search) ||
    (l.email || '').toLowerCase().includes(search) ||
    (l.empresa || '').toLowerCase().includes(search) ||
    (l.telefone || '').toLowerCase().includes(search)
  );
  if (filtered.length === 0) {
    leadsList.innerHTML = '<p style="text-align:center;color:#888;">Nenhum lead encontrado.</p>';
    return;
  }
  leadsList.innerHTML = filtered.map(lead => {
    const color = STATUS_COLORS[lead.status] || '#4285f4';
    const label = STATUS_LABELS[lead.status] || 'Novo';
    const date = lead.createdAt ? new Date(lead.createdAt.seconds * 1000).toLocaleDateString('pt-BR') : '';
    return `
      <div class="lead-card">
        <div class="lead-header">
          <strong class="lead-name">${lead.nome || 'Sem nome'}</strong>
          <span class="lead-status" style="background:${color}">${label}</span>
        </div>
        <div class="lead-details">
          ${lead.empresa ? `<span>&#127970; ${lead.empresa}</span>` : ''}
          ${lead.email ? `<span>&#9993; ${lead.email}</span>` : ''}
          ${lead.telefone ? `<span>&#128222; ${lead.telefone}</span>` : ''}
          ${lead.origem ? `<span>&#128205; ${lead.origem}</span>` : ''}
          ${date ? `<span>&#128197; ${date}</span>` : ''}
        </div>
        ${lead.observacao ? `<div class="lead-obs">${lead.observacao}</div>` : ''}
        <div class="lead-actions">
          <button onclick="openEditModal('${lead.id}')" class="btn-edit">Editar</button>
          <button onclick="deleteLead('${lead.id}')" class="btn-delete">Excluir</button>
        </div>
      </div>
    `;
  }).join('');
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
      nome,
      email: document.getElementById('leadEmail')?.value.trim() || '',
      telefone: document.getElementById('leadTelefone')?.value.trim() || '',
      empresa: document.getElementById('leadEmpresa')?.value.trim() || '',
      status: document.getElementById('leadStatus')?.value || 'novo',
      origem: document.getElementById('leadOrigem')?.value.trim() || '',
      observacao: document.getElementById('leadObservacao')?.value.trim() || '',
      createdAt: serverTimestamp()
    });
    if (leadForm) leadForm.reset();
    if (formFeedback) {
      formFeedback.textContent = 'Lead salvo com sucesso!';
      formFeedback.className = 'form-feedback success';
    }
    setTimeout(() => { if (formFeedback) formFeedback.textContent = ''; }, 3000);
    loadLeads();
  } catch (err) {
    console.error('Erro ao salvar lead:', err);
    if (formFeedback) {
      formFeedback.textContent = 'Erro ao salvar. Tente novamente.';
      formFeedback.className = 'form-feedback error';
    }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Salvar Lead'; }
  }
}

// Edit Lead
window.openEditModal = function(id) {
  const lead = allLeads.find(l => l.id === id);
  if (!lead) return;
  document.getElementById('editLeadId').value = id;
  document.getElementById('editNome').value = lead.nome || '';
  document.getElementById('editEmail').value = lead.email || '';
  document.getElementById('editTelefone').value = lead.telefone || '';
  document.getElementById('editEmpresa').value = lead.empresa || '';
  document.getElementById('editStatus').value = lead.status || 'novo';
  document.getElementById('editOrigem').value = lead.origem || '';
  document.getElementById('editObservacao').value = lead.observacao || '';
  if (editModal) editModal.style.display = 'flex';
};

async function saveEdit(e) {
  e.preventDefault();
  const id = document.getElementById('editLeadId').value;
  if (!id) return;
  const btn = e.target.querySelector('button[type="submit"]');
  if (btn) { btn.disabled = true; btn.textContent = 'Salvando...'; }
  try {
    await updateDoc(doc(db, 'leads', id), {
      nome: document.getElementById('editNome').value.trim(),
      email: document.getElementById('editEmail').value.trim(),
      telefone: document.getElementById('editTelefone').value.trim(),
      empresa: document.getElementById('editEmpresa').value.trim(),
      status: document.getElementById('editStatus').value,
      origem: document.getElementById('editOrigem').value.trim(),
      observacao: document.getElementById('editObservacao').value.trim()
    });
    closeEditModal();
    loadLeads();
  } catch (err) {
    console.error('Erro ao editar lead:', err);
    alert('Erro ao salvar alteracoes.');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Salvar Alteracoes'; }
  }
}

function closeEditModal() {
  if (editModal) editModal.style.display = 'none';
  if (editForm) editForm.reset();
}

// Delete Lead
window.deleteLead = async function(id) {
  if (!confirm('Tem certeza que deseja excluir este lead?')) return;
  try {
    await deleteDoc(doc(db, 'leads', id));
    loadLeads();
  } catch (err) {
    console.error('Erro ao excluir:', err);
    alert('Erro ao excluir lead.');
  }
};

// Init
showLoading();

// Timeout de seguranca: se onAuthStateChanged nao disparar em 8s, mostra login
const authTimeout = setTimeout(() => {
  console.warn('Auth timeout - forcando showLogin()');
  showLogin();
}, 15000);

// Handle redirect result first (mobile/Safari login)
getRedirectResult(auth).then(result => {
  if (result && result.user) {
    // Login via redirect bem-sucedido - onAuthStateChanged ira lidar
    console.log('Login via redirect bem-sucedido:', result.user.displayName);
  }
  // Se result e null (sem redirect pendente), nao faz nada - aguarda onAuthStateChanged
}).catch(err => {
  console.error('Erro no redirect result:', err);
  clearTimeout(authTimeout);
  showLogin();
});

onAuthStateChanged(auth, (user) => {
    clearTimeout(authTimeout); // Cancela o timeout de seguranca
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
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);         if (isMobile) {           await signInWithRedirect(auth, new GoogleAuthProvider());         } else {           await signInWithPopup(auth, new GoogleAuthProvider());         }
    } catch (err) {
      console.error('Erro no login:', err);
      googleLoginBtn.disabled = false;
      googleLoginBtn.textContent = 'Entrar com Google';
      alert('Erro: ' + err.message);
    }
  });
}

if (logoutBtn) logoutBtn.addEventListener('click', () => signOut(auth).catch(console.error));
if (leadForm) leadForm.addEventListener('submit', addLead);
if (btnRecarregar) btnRecarregar.addEventListener('click', loadLeads);
if (editForm) editForm.addEventListener('submit', saveEdit);
if (closeModal) closeModal.addEventListener('click', closeEditModal);
if (btnCancelarEdit) btnCancelarEdit.addEventListener('click', closeEditModal);
if (editModal) editModal.addEventListener('click', (e) => { if (e.target === editModal) closeEditModal(); });
if (searchInput) searchInput.addEventListener('input', renderLeads);
if (filterStatus) filterStatus.addEventListener('change', renderLeads);
