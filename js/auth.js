// =================== JWL MARKETING — AUTH & ADMIN MANAGEMENT ===================
// Stockage local des admins (simulé JSON dans localStorage, remplace admins.json côté serveur)

const JWL_STORAGE_KEY = 'jwl_admins_v2';
const JWL_SESSION_KEY = 'jwl_session_v2';

// Admins par défaut (chargés si aucune donnée en localStorage)
const DEFAULT_ADMINS = [
  {
    username: 'Wyatt',
    password: '100124',
    role: 'superadmin',
    displayName: 'Wyatt LAPAILLERIE-ENGONE',
    firstName: 'Wyatt',
    lastName: 'LAPAILLERIE-ENGONE',
    photo: '',
    firstLogin: false,
    lastLogin: null,
    createdAt: '2026-04-13T00:00:00.000Z'
  },
  {
    username: 'Jodie',
    password: 'Watson2011@',
    role: 'admin',
    displayName: 'Jodie LAPAILLERIE',
    firstName: 'Jodie',
    lastName: 'LAPAILLERIE',
    photo: 'https://media.licdn.com/dms/image/v2/D4E03AQGFTsA94wq_kg/profile-displayphoto-scale_200_200/B4EZ1QBOA.JUAc-/0/1775163994302?e=2147483647&v=beta&t=b2fOzdX-3prMS8XioJutvVWz2A4liWuEdh4UOjlsC80',
    firstLogin: false,
    lastLogin: null,
    createdAt: '2026-04-13T00:00:00.000Z'
  }
];

// ——— Getters / Setters admins ———
function getAdmins() {
  const raw = localStorage.getItem(JWL_STORAGE_KEY);
  if (!raw) {
    saveAdmins(DEFAULT_ADMINS);
    return DEFAULT_ADMINS;
  }
  try { return JSON.parse(raw); } catch { return DEFAULT_ADMINS; }
}

function saveAdmins(admins) {
  localStorage.setItem(JWL_STORAGE_KEY, JSON.stringify(admins));
}

function getAdmin(username) {
  return getAdmins().find(a => a.username === username) || null;
}

function updateAdmin(username, fields) {
  const admins = getAdmins();
  const idx = admins.findIndex(a => a.username === username);
  if (idx === -1) return false;
  admins[idx] = { ...admins[idx], ...fields };
  saveAdmins(admins);
  return true;
}

// ——— Session ———
function getSession() {
  const raw = sessionStorage.getItem(JWL_SESSION_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function setSession(username) {
  const admin = getAdmin(username);
  if (!admin) return;
  sessionStorage.setItem(JWL_SESSION_KEY, JSON.stringify({ username, role: admin.role, ts: Date.now() }));
}

function clearSession() {
  sessionStorage.removeItem(JWL_SESSION_KEY);
}

function isSuperAdmin() {
  const s = getSession();
  return s && s.role === 'superadmin';
}

// ——— Login ———
function doLogin() {
  const u = document.getElementById('login-user').value.trim();
  const p = document.getElementById('login-pass').value.trim();
  const admin = getAdmin(u);

  if (admin && admin.password === p) {
    // Mettre à jour lastLogin
    updateAdmin(u, { lastLogin: new Date().toISOString() });
    setSession(u);

    document.getElementById('login-error').style.display = 'none';

    if (admin.firstLogin) {
      showFirstStep(u);
    } else {
      enterAdmin(u);
    }
  } else {
    const err = document.getElementById('login-error');
    err.style.display = 'block';
    err.textContent = '⚠ Identifiants incorrects.';
    const box = document.querySelector('.login-box');
    box.style.animation = 'none';
    box.offsetHeight;
    box.style.animation = 'shake 0.4s ease';
  }
}

function doLogout() {
  clearSession();
  location.reload();
}

// ——— Enter admin panel ———
function enterAdmin(username) {
  const admin = getAdmin(username);
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('first-step-screen').style.display = 'none';
  document.getElementById('admin-screen').style.display = 'block';

  const label = document.getElementById('admin-user-label');
  const photo = admin.photo || '';
  label.innerHTML = photo
    ? `<img src="${photo}" class="topbar-avatar" alt="${admin.displayName}"><span>${admin.displayName}</span>`
    : `<span class="topbar-avatar-placeholder">${(admin.firstName||admin.username)[0]}</span><span>${admin.displayName}</span>`;

  // Afficher onglet gestion admins uniquement pour Wyatt (superadmin)
  const adminTabBtn = document.getElementById('tab-admins-btn');
  if (adminTabBtn) adminTabBtn.style.display = isSuperAdmin() ? 'flex' : 'none';

  prefillDefaults(admin);
}

// ——— First-step onboarding ———
function showFirstStep(username) {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('first-step-screen').style.display = 'flex';

  document.getElementById('fs-welcome-name').textContent = username;

  // Setup photo upload
  const fileInput = document.getElementById('fs-photo-file');
  if (fileInput) {
    fileInput.addEventListener('change', function() {
      const file = this.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        document.getElementById('fs-photo-preview').src = e.target.result;
        document.getElementById('fs-photo-preview').style.display = 'block';
        document.getElementById('fs-photo-b64').value = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }
}

function completeFirstStep() {
  const session = getSession();
  if (!session) return;

  const firstName = document.getElementById('fs-firstname').value.trim();
  const lastName = document.getElementById('fs-lastname').value.trim();
  const photo = document.getElementById('fs-photo-b64').value || document.getElementById('fs-photo-url').value.trim();

  if (!firstName || !lastName) {
    showFSError('Veuillez renseigner votre prénom et nom.');
    return;
  }

  updateAdmin(session.username, {
    firstName,
    lastName,
    displayName: firstName + ' ' + lastName,
    photo,
    firstLogin: false
  });

  enterAdmin(session.username);
}

function showFSError(msg) {
  const el = document.getElementById('fs-error');
  el.textContent = '⚠ ' + msg;
  el.style.display = 'block';
}

// ——— Admin CRUD (superadmin only) ———
function renderAdminList() {
  if (!isSuperAdmin()) return;
  const admins = getAdmins();
  const container = document.getElementById('admin-list');
  if (!container) return;

  container.innerHTML = admins.map(a => {
    const isWyatt = a.username === 'Wyatt';
    const lastLogin = a.lastLogin ? new Date(a.lastLogin).toLocaleString('fr-FR') : 'Jamais connecté';
    const photoHTML = a.photo
      ? `<img src="${a.photo}" class="admin-avatar-sm" alt="${a.displayName}">`
      : `<div class="admin-avatar-sm-placeholder">${(a.firstName||a.username)[0]}</div>`;

    return `<div class="admin-card">
      <div class="admin-card-left">
        ${photoHTML}
        <div>
          <div class="admin-card-name">${a.displayName || a.username}</div>
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
  document.getElementById('admin-modal-title').textContent = 'Créer un admin';
  document.getElementById('modal-username').value = '';
  document.getElementById('modal-username').disabled = false;
  document.getElementById('modal-password').value = '';
  document.getElementById('modal-firstname').value = '';
  document.getElementById('modal-lastname').value = '';
  document.getElementById('modal-role').value = 'admin';
  document.getElementById('modal-photo-url').value = '';
  document.getElementById('modal-photo-b64').value = '';
  document.getElementById('modal-preview').style.display = 'none';
  document.getElementById('modal-mode').value = 'create';
  document.getElementById('admin-modal-overlay').style.display = 'flex';
}

function openEditAdmin(username) {
  const admin = getAdmin(username);
  if (!admin) return;
  document.getElementById('admin-modal-title').textContent = 'Modifier l\'admin';
  document.getElementById('modal-username').value = admin.username;
  document.getElementById('modal-username').disabled = true;
  document.getElementById('modal-password').value = admin.password;
  document.getElementById('modal-firstname').value = admin.firstName || '';
  document.getElementById('modal-lastname').value = admin.lastName || '';
  document.getElementById('modal-role').value = admin.role;
  document.getElementById('modal-photo-url').value = admin.photo || '';
  document.getElementById('modal-photo-b64').value = '';
  if (admin.photo) {
    document.getElementById('modal-preview').src = admin.photo;
    document.getElementById('modal-preview').style.display = 'block';
  } else {
    document.getElementById('modal-preview').style.display = 'none';
  }
  document.getElementById('modal-mode').value = 'edit';
  document.getElementById('admin-modal-overlay').style.display = 'flex';
}

function closeAdminModal() {
  document.getElementById('admin-modal-overlay').style.display = 'none';
}

function saveAdminModal() {
  const mode = document.getElementById('modal-mode').value;
  const username = document.getElementById('modal-username').value.trim();
  const password = document.getElementById('modal-password').value.trim();
  const firstName = document.getElementById('modal-firstname').value.trim();
  const lastName = document.getElementById('modal-lastname').value.trim();
  const role = document.getElementById('modal-role').value;
  const photo = document.getElementById('modal-photo-b64').value || document.getElementById('modal-photo-url').value.trim();

  if (!username || !password || !firstName || !lastName) {
    alert('⚠ Tous les champs obligatoires doivent être remplis.');
    return;
  }

  if (mode === 'create') {
    const admins = getAdmins();
    if (admins.find(a => a.username === username)) {
      alert('⚠ Cet identifiant existe déjà.');
      return;
    }
    admins.push({
      username, password, role,
      displayName: firstName + ' ' + lastName,
      firstName, lastName, photo,
      firstLogin: true,
      lastLogin: null,
      createdAt: new Date().toISOString()
    });
    saveAdmins(admins);
  } else {
    updateAdmin(username, {
      password, role,
      displayName: firstName + ' ' + lastName,
      firstName, lastName,
      photo: photo || getAdmin(username)?.photo || ''
    });
  }

  closeAdminModal();
  renderAdminList();
}

function confirmDeleteAdmin(username) {
  if (username === 'Wyatt') return;
  if (confirm(`Supprimer l'admin "${username}" ? Cette action est irréversible.`)) {
    const admins = getAdmins().filter(a => a.username !== username);
    saveAdmins(admins);
    renderAdminList();
  }
}

function handleModalPhotoUpload() {
  const file = document.getElementById('modal-photo-file').files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('modal-photo-b64').value = e.target.result;
    document.getElementById('modal-preview').src = e.target.result;
    document.getElementById('modal-preview').style.display = 'block';
  };
  reader.readAsDataURL(file);
}

// ——— Auto-session restore ———
document.addEventListener('DOMContentLoaded', () => {
  const session = getSession();
  if (session) {
    const admin = getAdmin(session.username);
    if (admin) {
      if (admin.firstLogin) {
        showFirstStep(session.username);
      } else {
        enterAdmin(session.username);
      }
    }
  }

  // Enter key on login
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && document.getElementById('login-screen').style.display !== 'none') {
      doLogin();
    }
  });
});
