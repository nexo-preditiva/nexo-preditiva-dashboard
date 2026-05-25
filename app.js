import { auth, db } from './firebase-config.js';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Elementos DOM
const carregando = document.getElementById('carregando');
const loginContainer = document.getElementById('loginContainer');
const dashboard = document.getElementById('dashboard');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userName = document.getElementById('userName');

let currentUser = null;
let currentTenant = null;

// Inicializar: esconder carregando e mostrar login
if (carregando) carregando.style.display = 'none';
if (loginContainer) loginContainer.style.display = 'flex';
if (dashboard) dashboard.style.display = 'none';

console.log('App iniciado - Login visível');

// Botão de login do Google
if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', async () => {
        const provider = new GoogleAuthProvider();
        try {
            console.log('Iniciando login com Google...');
            const result = await signInWithPopup(auth, provider);
            console.log('Login realizado com sucesso!', result.user.email);
        } catch (error) {
            console.error('Erro ao fazer login:', error);
            alert('Erro ao fazer login: ' + error.code + ' - ' + error.message + '. Tente limpar o cache (Ctrl+Shift+Delete) e tente novamente.');
        }
    });
}

// Botão de logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Erro no logout:', error);
        }
    });
}

// Gerenciamento de estado de autenticação
onAuthStateChanged(auth, async (user) => {
    console.log('onAuthStateChanged chamado:', user ? user.email : 'sem usuário');
    
    if (user) {
        currentUser = user;
        
        try {
            // Buscar dados do usuário no Firestore
            const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
            
            if (!userDoc.exists()) {
                alert('Usuário não autorizado. Entre em contato com o administrador.');
                await signOut(auth);
                return;
            }
            
            const userData = userDoc.data();
            currentTenant = userData.tenantId;
            console.log('Tenant do usuário:', currentTenant);
            
            // Atualizar UI
            if (userName) userName.textContent = user.displayName || user.email;
            if (carregando) carregando.style.display = 'none';
            if (loginContainer) loginContainer.style.display = 'none';
            if (dashboard) dashboard.style.display = 'block';
            
            // Carregar leads
            await carregarLeads();
        } catch (error) {
            console.error('Erro ao buscar dados do usuário:', error);
            alert('Erro ao carregar dados: ' + error.message);
        }
    } else {
        console.log('Usuário não autenticado - mostrando login');
        currentUser = null;
        currentTenant = null;
        if (carregando) carregando.style.display = 'none';
        if (loginContainer) loginContainer.style.display = 'flex';
        if (dashboard) dashboard.style.display = 'none';
    }
});

// Função para carregar leads
async function carregarLeads() {
    const leadsTabela = document.getElementById('leadsTabela');
    const totalLeads = document.getElementById('totalLeads');
    const leadsHoje = document.getElementById('leadsHoje');
    const conversaoTaxa = document.getElementById('conversaoTaxa');
    
    if (!currentTenant) {
        console.error('Tenant não definido');
        return;
    }
    
    try {
        const q = query(
            collection(db, 'inquilinos', currentTenant, 'leads'),
            orderBy('data', 'desc'),
            limit(50)
        );
        
        const querySnapshot = await getDocs(q);
        const leads = [];
        
        querySnapshot.forEach((doc) => {
            leads.push({ id: doc.id, ...doc.data() });
        });
        
        console.log('Leads carregados:', leads.length);
        
        if (totalLeads) totalLeads.textContent = leads.length;
        
        const hoje = new Date().toISOString().split('T')[0];
        const leadsDeHoje = leads.filter(lead => {
            if (lead.data && lead.data.toDate) {
                const dataLead = lead.data.toDate().toISOString().split('T')[0];
                return dataLead === hoje;
            }
            return false;
        });
        
        if (leadsHoje) leadsHoje.textContent = leadsDeHoje.length;
        
        const taxa = leads.length > 0 ? ((leadsDeHoje.length / leads.length) * 100).toFixed(1) : 0;
        if (conversaoTaxa) conversaoTaxa.textContent = taxa + '%';
        
        if (leadsTabela) {
            leadsTabela.innerHTML = leads.map(lead => `
                <tr>
                    <td>${lead.nome || '-'}</td>
                    <td>${lead.email || '-'}</td>
                    <td>${lead.telefone || '-'}</td>
                    <td>${lead.origem || '-'}</td>
                    <td>${lead.data ? new Date(lead.data.toDate()).toLocaleDateString('pt-BR') : '-'}</td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Erro ao carregar leads:', error);
        alert('Erro ao carregar leads: ' + error.message);
    }
}
