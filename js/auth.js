// =================== JWL MARKETING — AUTH v3 ===================

const JWL_ADMINS_KEY = 'jwl_admins_v2';
const JWL_SESSION_KEY = 'jwl_session_v2';
const JWL_CLIENTS_KEY = 'jwl_clients_v1';
const JWL_CLIENT_SESSION_KEY = 'jwl_client_session_v1';

const DEFAULT_ADMINS = [
  {
    username: 'Wyatt', password: '100124', role: 'superadmin',
    displayName: 'Wyatt LAPAILLERIE-ENGONE', firstName: 'Wyatt', lastName: 'LAPAILLERIE-ENGONE',
    photo: '', firstLogin: false, lastLogin: null, createdAt: '2026-04-13T00:00:00.000Z'
  },
  {
    username: 'Jodie', password: 'Watson2011@', role: 'admin',
    displayName: 'Jodie LAPAILLERIE', firstName: 'Jodie', lastName: 'LAPAILLERIE',
    photo: 'https://media.licdn.com/dms/image/v2/D4E03AQGFTsA94wq_kg/profile-displayphoto-scale_200_200/B4EZ1QBOA.JUAc-/0/1775163994302?e=2147483647&v=beta&t=b2fOzdX-3prMS8XioJutvVWz2A4liWuEdh4UOjlsC80',
    firstLogin: false, lastLogin: null, createdAt: '2026-04-13T00:00:00.000Z'
  }
];

// ——— ADMINS ———
function getAdmins() {
  const raw = localStorage.getItem(JWL_ADMINS_KEY);
  if (!raw) { saveAdmins(DEFAULT_ADMINS); return DEFAULT_ADMINS; }
  try { return JSON.parse(raw); } catch { return DEFAULT_ADMINS; }
}
function saveAdmins(admins) { localStorage.setItem(JWL_ADMINS_KEY, JSON.stringify(admins)); }
function getAdmin(u) { return getAdmins().find(a => a.username === u) || null; }
function updateAdmin(u, fields) {
  const admins = getAdmins();
  const i = admins.findIndex(a => a.username === u);
  if (i === -1) return false;
  admins[i] = { ...admins[i], ...fields };
  saveAdmins(admins);
  return true;
}

// ——— CLIENTS ———
function getClients() {
  try { return JSON.parse(localStorage.getItem(JWL_CLIENTS_KEY) || '[]'); } catch { return []; }
}
function saveClients(c) { localStorage.setItem(JWL_CLIENTS_KEY, JSON.stringify(c)); }
function getClient(id) { return getClients().find(c => c.id === id) || null; }
function updateClient(id, fields) {
  const clients = getClients();
  const i = clients.findIndex(c => c.id === id);
  if (i === -1) return false;
  clients[i] = { ...clients[i], ...fields };
  saveClients(clients);
  return true;
}
function deleteClient(id) {
  saveClients(getClients().filter(c => c.id !== id));
}
function createClient(data) {
  const id = 'cli_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  const client = {
    id, username: data.username, password: data.password,
    displayName: data.displayName || data.username,
    createdAt: new Date().toISOString(), lastLogin: null,
    suspended: false, notifications: [],
    allowedReports: data.allowedReports || [],
    createdBy: data.createdBy || ''
  };
  const clients = getClients();
  clients.push(client);
  saveClients(clients);
  return client;
}

// ——— SESSIONS ———
function getSession() {
  try { return JSON.parse(sessionStorage.getItem(JWL_SESSION_KEY) || 'null'); } catch { return null; }
}
function setSession(username) {
  const admin = getAdmin(username);
  if (!admin) return;
  sessionStorage.setItem(JWL_SESSION_KEY, JSON.stringify({ username, role: admin.role, ts: Date.now() }));
}
function clearSession() { sessionStorage.removeItem(JWL_SESSION_KEY); }
function isSuperAdmin() { const s = getSession(); return s && s.role === 'superadmin'; }

function getClientSession() {
  try { return JSON.parse(sessionStorage.getItem(JWL_CLIENT_SESSION_KEY) || 'null'); } catch { return null; }
}
function setClientSession(clientId) {
  sessionStorage.setItem(JWL_CLIENT_SESSION_KEY, JSON.stringify({ clientId, ts: Date.now() }));
}
function clearClientSession() { sessionStorage.removeItem(JWL_CLIENT_SESSION_KEY); }

// ——— LOGIN ———
function doLogin() {
  const u = document.getElementById('login-user').value.trim();
  const p = document.getElementById('login-pass').value.trim();
  const admin = getAdmin(u);

  if (admin && admin.password === p) {
    updateAdmin(u, { lastLogin: new Date().toISOString() });
    setSession(u);
    document.getElementById('login-error').style.display = 'none';
    if (admin.firstLogin) showFirstStep(u);
    else enterAdmin(u);
  } else {
    const err = document.getElementById('login-error');
    err.style.display = 'block';
    err.textContent = '⚠ Identifiants incorrects.';
    const box = document.querySelector('.login-box');
    box.style.animation = 'none'; box.offsetHeight;
    box.style.animation = 'shake 0.4s ease';
  }
}

function doClientLogin() {
  const u = document.getElementById('client-login-user').value.trim();
  const p = document.getElementById('client-login-pass').value.trim();
  const clients = getClients();
  const client = clients.find(c => c.username === u && c.password === p);

  if (client) {
    if (client.suspended) {
      document.getElementById('client-login-error').textContent = '⚠ Votre compte est suspendu. Contactez votre consultant JWL.';
      document.getElementById('client-login-error').style.display = 'block';
      return;
    }
    updateClient(client.id, { lastLogin: new Date().toISOString() });
    setClientSession(client.id);
    enterClientPortal(client.id);
  } else {
    document.getElementById('client-login-error').textContent = '⚠ Identifiants incorrects.';
    document.getElementById('client-login-error').style.display = 'block';
  }
}

function doLogout() { clearSession(); clearClientSession(); location.reload(); }
function doClientLogout() { clearClientSession(); location.reload(); }

// ——— ENTER ADMIN ———
function enterAdmin(username) {
  const admin = getAdmin(username);
  ['login-screen','first-step-screen'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  document.getElementById('admin-screen').style.display = 'block';

  const label = document.getElementById('admin-user-label');
  const photo = admin.photo || '';
  label.innerHTML = photo
    ? `<img src="${photo}" class="topbar-avatar" alt="${admin.displayName}"><span>${admin.displayName}</span>`
    : `<span class="topbar-avatar-placeholder">${(admin.firstName||admin.username)[0]}</span><span>${admin.displayName}</span>`;

  document.getElementById('tab-admins-btn').style.display = isSuperAdmin() ? 'flex' : 'none';
  document.getElementById('tab-clients-btn').style.display = 'flex';
  document.getElementById('tab-reports-btn').style.display = 'flex';

  prefillDefaults(admin);
}

// ——— ENTER CLIENT PORTAL ———
function enterClientPortal(clientId) {
  const client = getClient(clientId);
  ['login-screen','client-login-screen'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  document.getElementById('client-screen').style.display = 'block';
  document.getElementById('client-topbar-name').textContent = client.displayName;
  renderClientPortal(client);
}

// ——— CLIENT PORTAL RENDER ———
function renderClientPortal(client) {
  const reports = getStoredReports();
  const myReports = client.allowedReports || [];
  const container = document.getElementById('client-reports-list');
  const notifContainer = document.getElementById('client-notifs');

  // Notifications
  if (notifContainer) {
    const unread = (client.notifications || []).filter(n => !n.read);
    notifContainer.innerHTML = unread.map(n => `
      <div class="notif-banner">
        <div class="notif-banner-icon">📢</div>
        <div class="notif-banner-text">
          <strong>${escHtml(n.subject || 'Message de votre consultant')}</strong><br>
          ${escHtml(n.message)}
          <div class="notif-banner-date">${new Date(n.date).toLocaleString('fr-FR')}</div>
        </div>
        <button class="notif-banner-close" onclick="markNotifRead('${client.id}','${n.id}',this.parentElement)">✕</button>
      </div>`).join('');
    // Mark as read after 3s
    if (unread.length > 0) {
      setTimeout(() => {
        const notifs = client.notifications.map(n => ({ ...n, read: true }));
        updateClient(client.id, { notifications: notifs });
      }, 3000);
    }
  }

  if (!container) return;
  if (myReports.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📂</div><div class="empty-state-text">Aucune analyse disponible pour le moment.</div><p style="font-size:11px;color:var(--mid);margin-top:8px">Votre consultant JWL Marketing vous partagera bientôt vos analyses.</p></div>`;
    return;
  }

  const cards = myReports.map(rid => {
    const r = reports[rid];
    if (!r) return '';
    const base = window.location.href.replace(/index\.html.*$/, '').replace(/\?.*$/, '');
    const link = base + 'view.html?page=' + rid;
    return `
    <div class="report-card" style="cursor:default">
      <div class="report-card-num">#${rid}</div>
      <div class="report-card-client">${escHtml(r.client?.name || '—')}</div>
      <div class="report-card-meta">${escHtml(r.client?.date || '')} · ${escHtml(r.client?.sector || '')}</div>
      <div class="report-card-site">${escHtml((r.client?.site || '').replace(/^https?:\/\//,''))}</div>
      <div class="report-card-actions">
        <a class="rca" href="${link}" target="_blank">📄 Voir l'analyse</a>
      </div>
    </div>`;
  }).join('');
  container.innerHTML = `<div class="reports-grid">${cards}</div>`;
}

function markNotifRead(clientId, notifId, el) {
  const client = getClient(clientId);
  if (!client) return;
  const notifs = (client.notifications || []).map(n => n.id === notifId ? { ...n, read: true } : n);
  updateClient(clientId, { notifications: notifs });
  el.remove();
}

// ——— FIRST STEP ONBOARDING ———
function showFirstStep(username) {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('first-step-screen').style.display = 'flex';
  document.getElementById('fs-welcome-name').textContent = username;
  const fi = document.getElementById('fs-photo-file');
  if (fi) fi.addEventListener('change', function() {
    const f = this.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = e => {
      document.getElementById('fs-photo-preview').src = e.target.result;
      document.getElementById('fs-photo-preview').style.display = 'block';
      document.getElementById('fs-photo-b64').value = e.target.result;
    };
    r.readAsDataURL(f);
  });
}

function completeFirstStep() {
  const session = getSession(); if (!session) return;
  const firstName = document.getElementById('fs-firstname').value.trim();
  const lastName = document.getElementById('fs-lastname').value.trim();
  const photo = document.getElementById('fs-photo-b64').value || document.getElementById('fs-photo-url').value.trim();
  if (!firstName || !lastName) { showFSError('Veuillez renseigner votre prénom et nom.'); return; }
  updateAdmin(session.username, { firstName, lastName, displayName: firstName + ' ' + lastName, photo, firstLogin: false });
  enterAdmin(session.username);
}
function showFSError(msg) { const el = document.getElementById('fs-error'); el.textContent = '⚠ ' + msg; el.style.display = 'block'; }

// ——— ADMIN CRUD ———
function renderAdminList() {
  if (!isSuperAdmin()) return;
  const container = document.getElementById('admin-list'); if (!container) return;
  container.innerHTML = getAdmins().map(a => {
    const isWyatt = a.username === 'Wyatt';
    const lastLogin = a.lastLogin ? new Date(a.lastLogin).toLocaleString('fr-FR') : 'Jamais';
    const photoHTML = a.photo ? `<img src="${a.photo}" class="admin-avatar-sm" alt="${a.displayName}">` : `<div class="admin-avatar-sm-placeholder">${(a.firstName||a.username)[0]}</div>`;
    return `<div class="admin-card">
      <div class="admin-card-left">
        ${photoHTML}
        <div>
          <div class="admin-card-name">${escHtml(a.displayName || a.username)}</div>
          <div class="admin-card-meta">
            <span class="admin-role-badge ${a.role}">${a.role === 'superadmin' ? '★ Super Admin' : 'Admin'}</span>
            <span class="admin-card-login">Dernière connexion : ${lastLogin}</span>
          </div>
          <div class="admin-card-user">@${a.username}</div>
        </div>
      </div>
      <div class="admin-card-actions">
        ${!isWyatt ? `
          <button class="admin-action-btn edit-btn" onclick="openEditAdmin('${a.username}')">✏ Modifier</button>
          <button class="admin-action-btn del-btn" onclick="confirmDeleteAdmin('${a.username}')">✕ Supprimer</button>
        ` : `<span class="admin-card-protected">Compte protégé</span>`}
      </div>
    </div>`;
  }).join('');
}

function openCreateAdmin() {
  openModal('admin-modal', 'md');
  document.getElementById('admin-modal-title').textContent = 'Créer un admin';
  document.getElementById('modal-admin-username').value = '';
  document.getElementById('modal-admin-username').disabled = false;
  document.getElementById('modal-admin-password').value = '';
  document.getElementById('modal-admin-firstname').value = '';
  document.getElementById('modal-admin-lastname').value = '';
  document.getElementById('modal-admin-role').value = 'admin';
  document.getElementById('modal-admin-photo-url').value = '';
  document.getElementById('modal-admin-photo-b64').value = '';
  document.getElementById('modal-admin-preview').style.display = 'none';
  document.getElementById('admin-modal-mode').value = 'create';
}

function openEditAdmin(username) {
  const admin = getAdmin(username); if (!admin) return;
  openModal('admin-modal', 'md');
  document.getElementById('admin-modal-title').textContent = 'Modifier l\'admin';
  document.getElementById('modal-admin-username').value = admin.username;
  document.getElementById('modal-admin-username').disabled = true;
  document.getElementById('modal-admin-password').value = admin.password;
  document.getElementById('modal-admin-firstname').value = admin.firstName || '';
  document.getElementById('modal-admin-lastname').value = admin.lastName || '';
  document.getElementById('modal-admin-role').value = admin.role;
  document.getElementById('modal-admin-photo-url').value = admin.photo || '';
  document.getElementById('modal-admin-photo-b64').value = '';
  if (admin.photo) { document.getElementById('modal-admin-preview').src = admin.photo; document.getElementById('modal-admin-preview').style.display = 'block'; }
  else document.getElementById('modal-admin-preview').style.display = 'none';
  document.getElementById('admin-modal-mode').value = 'edit';
}

function saveAdminModal() {
  const mode = document.getElementById('admin-modal-mode').value;
  const username = document.getElementById('modal-admin-username').value.trim();
  const password = document.getElementById('modal-admin-password').value.trim();
  const firstName = document.getElementById('modal-admin-firstname').value.trim();
  const lastName = document.getElementById('modal-admin-lastname').value.trim();
  const role = document.getElementById('modal-admin-role').value;
  const photo = document.getElementById('modal-admin-photo-b64').value || document.getElementById('modal-admin-photo-url').value.trim();

  if (!username || !password || !firstName || !lastName) { toast('⚠ Tous les champs obligatoires doivent être remplis.', 'error'); return; }

  if (mode === 'create') {
    const admins = getAdmins();
    if (admins.find(a => a.username === username)) { toast('⚠ Cet identifiant existe déjà.', 'error'); return; }
    admins.push({ username, password, role, displayName: firstName + ' ' + lastName, firstName, lastName, photo, firstLogin: true, lastLogin: null, createdAt: new Date().toISOString() });
    saveAdmins(admins);
    toast('Admin créé avec succès.', 'success');
  } else {
    updateAdmin(username, { password, role, displayName: firstName + ' ' + lastName, firstName, lastName, photo: photo || getAdmin(username)?.photo || '' });
    toast('Admin modifié avec succès.', 'success');
  }
  closeModal();
  renderAdminList();
}

function confirmDeleteAdmin(username) {
  if (username === 'Wyatt') return;
  if (confirm(`Supprimer l'admin "${username}" ? Cette action est irréversible.`)) {
    saveAdmins(getAdmins().filter(a => a.username !== username));
    renderAdminList();
    toast('Admin supprimé.', 'success');
  }
}

function handleModalAdminPhotoUpload() {
  const file = document.getElementById('modal-admin-photo-file').files[0]; if (!file) return;
  const r = new FileReader();
  r.onload = e => {
    document.getElementById('modal-admin-photo-b64').value = e.target.result;
    document.getElementById('modal-admin-preview').src = e.target.result;
    document.getElementById('modal-admin-preview').style.display = 'block';
  };
  r.readAsDataURL(file);
}

// ——— CLIENTS CRUD ———
function renderClientList() {
  const container = document.getElementById('client-list'); if (!container) return;
  const clients = getClients();
  const session = getSession();

  const filtered = isSuperAdmin() ? clients : clients.filter(c => c.createdBy === session.username);

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">👤</div><div class="empty-state-text">Aucun espace client créé.</div></div>`;
    return;
  }

  const reports = getStoredReports();
  container.innerHTML = filtered.map(c => {
    const reportCount = (c.allowedReports || []).filter(r => reports[r]).length;
    const lastLogin = c.lastLogin ? new Date(c.lastLogin).toLocaleString('fr-FR') : 'Jamais connecté';
    return `<div class="client-card ${c.suspended ? 'client-suspended' : ''}">
      <div class="client-card-header">
        <div class="client-avatar">${c.displayName[0]}</div>
        <div>
          <div class="client-card-name">
            ${escHtml(c.displayName)}
            ${c.suspended ? '<span class="client-suspended-badge">Suspendu</span>' : ''}
          </div>
          <div class="client-card-login">@${escHtml(c.username)} · Dernière connexion : ${lastLogin}</div>
          <div class="client-card-reports">📊 ${reportCount} analyse(s) partagée(s)</div>
        </div>
      </div>
      <div class="client-card-actions">
        <button class="client-action-btn" onclick="openEditClient('${c.id}')">✏ Modifier</button>
        <button class="client-action-btn" onclick="openShareClientModal('${c.id}')">📊 Analyses</button>
        <button class="client-action-btn client-notif-btn" onclick="openAnnouncementModal('${c.id}')">📢 Annonce</button>
        <button class="client-action-btn ${c.suspended ? '' : 'danger'}" onclick="toggleClientSuspend('${c.id}')">
          ${c.suspended ? '✓ Réactiver' : '⛔ Suspendre'}
        </button>
        <button class="client-action-btn danger" onclick="confirmDeleteClient('${c.id}')">✕ Supprimer</button>
      </div>
    </div>`;
  }).join('');
}

function openCreateClient() {
  openModal('client-modal', 'md');
  document.getElementById('client-modal-title').textContent = 'Créer un espace client';
  document.getElementById('modal-client-id').value = '';
  document.getElementById('modal-client-username').value = '';
  document.getElementById('modal-client-username').disabled = false;
  document.getElementById('modal-client-password').value = '';
  document.getElementById('modal-client-name').value = '';
}

function openEditClient(clientId) {
  const c = getClient(clientId); if (!c) return;
  openModal('client-modal', 'md');
  document.getElementById('client-modal-title').textContent = 'Modifier l\'espace client';
  document.getElementById('modal-client-id').value = c.id;
  document.getElementById('modal-client-username').value = c.username;
  document.getElementById('modal-client-username').disabled = true;
  document.getElementById('modal-client-password').value = c.password;
  document.getElementById('modal-client-name').value = c.displayName;
}

function saveClientModal() {
  const id = document.getElementById('modal-client-id').value;
  const username = document.getElementById('modal-client-username').value.trim();
  const password = document.getElementById('modal-client-password').value.trim();
  const displayName = document.getElementById('modal-client-name').value.trim();
  const session = getSession();

  if (!username || !password || !displayName) { toast('⚠ Tous les champs sont obligatoires.', 'error'); return; }

  if (!id) {
    // Check duplicate
    if (getClients().find(c => c.username === username)) { toast('⚠ Cet identifiant existe déjà.', 'error'); return; }
    createClient({ username, password, displayName, createdBy: session?.username || '' });
    toast('Espace client créé.', 'success');
  } else {
    updateClient(id, { password, displayName });
    toast('Espace client modifié.', 'success');
  }
  closeModal();
  renderClientList();
}

function toggleClientSuspend(clientId) {
  const c = getClient(clientId); if (!c) return;
  updateClient(clientId, { suspended: !c.suspended });
  toast(c.suspended ? 'Compte réactivé.' : 'Compte suspendu.', 'success');
  renderClientList();
}

function confirmDeleteClient(clientId) {
  const c = getClient(clientId); if (!c) return;
  if (confirm(`Supprimer l'espace client de "${c.displayName}" ? Cette action est irréversible.`)) {
    deleteClient(clientId);
    renderClientList();
    toast('Espace client supprimé.', 'success');
  }
}

function openShareClientModal(clientId) {
  const c = getClient(clientId); if (!c) return;
  const reports = getStoredReports();
  const session = getSession();

  openModal('share-client-modal', 'md');
  document.getElementById('share-client-modal-title').textContent = `Analyses de ${c.displayName}`;
  document.getElementById('share-client-id').value = clientId;

  const allowed = c.allowedReports || [];
  // Only show reports this admin has access to
  const myReports = Object.entries(reports).filter(([id, r]) => {
    if (isSuperAdmin()) return true;
    return r._meta?.adminId === session?.username || (r._meta?.sharedWith || []).includes(session?.username);
  });

  if (myReports.length === 0) {
    document.getElementById('share-client-reports-list').innerHTML = '<div style="font-size:11px;color:var(--mid);padding:12px">Aucune analyse disponible.</div>';
    return;
  }

  document.getElementById('share-client-reports-list').innerHTML = myReports.map(([id, r]) => {
    const checked = allowed.includes(id);
    return `<div class="share-admin-row ${checked ? 'selected' : ''}" onclick="toggleShareClientReport('${clientId}','${id}',this)">
      <div>
        <div class="share-admin-row-name">#${id} — ${escHtml(r.client?.name || '—')}</div>
        <div class="share-admin-row-role">${escHtml(r.client?.date || '')} · ${escHtml((r.client?.site||'').replace(/^https?:\/\//,''))}</div>
      </div>
      <div class="share-check">${checked ? '✓' : ''}</div>
    </div>`;
  }).join('');
}

function toggleShareClientReport(clientId, reportId, el) {
  const c = getClient(clientId); if (!c) return;
  let allowed = [...(c.allowedReports || [])];
  if (allowed.includes(reportId)) {
    allowed = allowed.filter(r => r !== reportId);
    el.classList.remove('selected');
    el.querySelector('.share-check').textContent = '';
  } else {
    allowed.push(reportId);
    el.classList.add('selected');
    el.querySelector('.share-check').textContent = '✓';
  }
  updateClient(clientId, { allowedReports: allowed });
  toast('Accès mis à jour.', 'success');
}

function openAnnouncementModal(clientId) {
  const c = getClient(clientId); if (!c) return;
  openModal('announcement-modal', 'md');
  document.getElementById('announcement-client-id').value = clientId;
  document.getElementById('announcement-client-name').textContent = c.displayName;
  document.getElementById('modal-annonce-subject').value = '';
  document.getElementById('modal-annonce-message').value = '';
}

function sendAnnouncement() {
  const clientId = document.getElementById('announcement-client-id').value;
  const subject = document.getElementById('modal-annonce-subject').value.trim();
  const message = document.getElementById('modal-annonce-message').value.trim();
  if (!message) { toast('⚠ Le message ne peut pas être vide.', 'error'); return; }

  const c = getClient(clientId); if (!c) return;
  const notif = { id: 'n_' + Date.now(), subject, message, date: new Date().toISOString(), read: false };
  const notifs = [...(c.notifications || []), notif];
  updateClient(clientId, { notifications: notifs });
  closeModal();
  toast('📢 Annonce envoyée à ' + c.displayName, 'success');
}

function useAnnouncementTemplate(text) {
  document.getElementById('modal-annonce-message').value = text;
}

// ——— MODAL SYSTEM ———
let _currentModal = null;
function openModal(id, size) {
  const overlay = document.getElementById('modal-overlay');
  overlay.style.display = 'flex';
  document.querySelectorAll('.modal-box').forEach(b => b.style.display = 'none');
  const box = document.getElementById(id);
  if (box) { box.style.display = 'block'; box.className = 'modal-box ' + (size||'md'); }
  _currentModal = id;
}
function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
  _currentModal = null;
}
// Close on overlay click
document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
});

// ——— TOAST ———
function toast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ——— ESCAPE HTML ———
function escHtml(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ——— BOOT ———
document.addEventListener('DOMContentLoaded', () => {
  // Check if client portal mode (?client=1)
  const params = new URLSearchParams(window.location.search);
  if (params.get('client') === '1') {
    // Show client login
    const clientSession = getClientSession();
    if (clientSession) {
      const client = getClient(clientSession.clientId);
      if (client) { enterClientPortal(client.id); return; }
    }
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('client-login-screen').style.display = 'flex';
    document.addEventListener('keydown', e => {
      if (e.key === 'Enter') doClientLogin();
    });
    return;
  }

  // Admin session restore
  const session = getSession();
  if (session) {
    const admin = getAdmin(session.username);
    if (admin) {
      if (admin.firstLogin) showFirstStep(session.username);
      else enterAdmin(session.username);
      return;
    }
  }

  // Enter key on login
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && document.getElementById('login-screen').style.display !== 'none') doLogin();
  });
});
