import { auth, db } from './firebase-config.js';
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const loading = document.getElementById('loading');
const loginContainer = document.getElementById('loginContainer');
const dashboard = document.getElementById('dashboard');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userName = document.getElementById('userName');
let currentUser = null;
let currentTenant = null;

// Verificar resultado do redirect
getRedirectResult(auth).then((result) => {
  if (result) {
    console.log('Login realizado com sucesso!');
  }
}).catch((error) => {
  console.error('Erro no redirect:', error);
    alert('Erro ao fazer login: ' + error.code + ' - ' + error.message + '. Tente limpar o cache (Ctrl+Shift+Delete) e tentar novamente.');});

googleLoginBtn.addEventListener('click', async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithRedirect(auth, provider);
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao fazer login.');
  }
});

logoutBtn.addEventListener('click', async () => {
  try { await signOut(auth); } catch (error) { console.error('Erro:', error); }
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    try {
      const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
      if (!userDoc.exists()) { alert('Usuário não autorizado.'); await signOut(auth); return; }
      const userData = userDoc.data();
      currentTenant = userData.tenantId;
      const tenantDoc = await getDoc(doc(db, 'inquilinos', currentTenant));
      const tenantData = tenantDoc.data();
      userName.textContent = tenantData.nome || user.displayName;
      loading.style.display = 'none';
      loginContainer.style.display = 'none';
      dashboard.style.display = 'block';
      await loadLeads();
    } catch (error) { console.error('Erro:', error); alert('Erro ao carregar dados.'); await signOut(auth); }
  } else {
    currentUser = null; currentTenant = null;
    loading.style.display = 'none'; loginContainer.style.display = 'flex'; dashboard.style.display = 'none';
  }
});

async function loadLeads() {
  try {
    const leadsQuery = query(collection(db, 'leads'), where('tenantId', '==', currentTenant), orderBy('criadoEm', 'desc'), limit(50));
    const querySnapshot = await getDocs(leadsQuery);
    const leads = []; querySnapshot.forEach((doc) => { leads.push({ id: doc.id, ...doc.data() }); });
    displayLeads(leads); updateStats(leads);
  } catch (error) { console.error('Erro:', error); document.getElementById('leadsList').innerHTML = '<p>Erro ao carregar leads.</p>'; }
}

function displayLeads(leads) {
  const leadsList = document.getElementById('leadsList');
  if (leads.length === 0) { leadsList.innerHTML = '<p>Nenhum lead encontrado.</p>'; return; }
  leadsList.innerHTML = leads.map(lead => `<div class="lead-card"><h4>${lead.nome || 'Não informado'}</h4><p><strong>Email:</strong> ${lead.email || 'Não informado'}</p><p><strong>Telefone:</strong> ${lead.telefone || 'Não informado'}</p><p><strong>Recebido:</strong> ${formatDate(lead.criadoEm)}</p></div>`).join('');
}

function updateStats(leads) {
  const today = new Date(); today.setHours(0,0,0,0);
  const leadsToday = leads.filter(lead => { const leadDate = lead.criadoEm?.toDate() || new Date(0); return leadDate >= today; }).length;
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const leadsThisMonth = leads.filter(lead => { const leadDate = lead.criadoEm?.toDate() || new Date(0); return leadDate >= firstDayOfMonth; }).length;
  document.getElementById('leadsToday').textContent = leadsToday;
  document.getElementById('leadsMonth').textContent = leadsThisMonth;
  document.getElementById('conversionRate').textContent = '0%';
}

function formatDate(timestamp) {
  if (!timestamp) return 'Data não disponível';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
