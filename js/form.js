// =================== JWL MARKETING — FORM v3 ===================

let counters = { strengths: 0, weaknesses: 0, comp: 0, tbl: 0, kw: 0, perf: 0, bugs: 0, opp: 0, actions: 0, tl: 0 };

const JWL_REPORTS_KEY = 'jwl_reports_v1';
const JWL_REPORT_SEQ_KEY = 'jwl_reports_seq_v1';

function getStoredReports() {
  try { return JSON.parse(localStorage.getItem(JWL_REPORTS_KEY) || '{}'); } catch { return {}; }
}
function saveStoredReports(map) { localStorage.setItem(JWL_REPORTS_KEY, JSON.stringify(map)); }

function createReportId() {
  const current = parseInt(localStorage.getItem(JWL_REPORT_SEQ_KEY) || '1000', 10);
  const next = Number.isFinite(current) ? current + 1 : 1001;
  localStorage.setItem(JWL_REPORT_SEQ_KEY, String(next));
  return String(next);
}

function persistReportData(data) {
  const id = createReportId();
  const session = getSession();
  const reports = getStoredReports();
  reports[id] = {
    ...data,
    _meta: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      id,
      adminId: session?.username || '',
      sharedWith: []
    }
  };
  saveStoredReports(reports);
  return id;
}

function updateReportData(id, data) {
  const reports = getStoredReports();
  if (!reports[id]) return false;
  const meta = reports[id]._meta || {};
  reports[id] = { ...data, _meta: { ...meta, updatedAt: new Date().toISOString() } };
  saveStoredReports(reports);
  return true;
}

// ——— REPORTS LIST ———
function renderReportsList() {
  const container = document.getElementById('reports-list'); if (!container) return;
  const reports = getStoredReports();
  const session = getSession();
  const entries = Object.entries(reports);

  const mine = entries.filter(([id, r]) => {
    if (isSuperAdmin()) return true;
    return r._meta?.adminId === session?.username || (r._meta?.sharedWith || []).includes(session?.username);
  });

  if (mine.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📊</div><div class="empty-state-text">Aucune analyse générée.</div></div>`;
    return;
  }

  const base = window.location.href.replace(/index\.html.*$/, '').replace(/\?.*$/, '');
  const cards = mine.map(([id, r]) => {
    const isShared = r._meta?.adminId !== session?.username;
    const link = base + 'view.html?page=' + id;
    const sharedWith = r._meta?.sharedWith || [];
    const sharedWithMe = sharedWith.includes(session?.username);
    return `
    <div class="report-card">
      ${isShared && sharedWithMe ? '<div class="report-shared-badge">Partagé avec moi</div>' : ''}
      ${!isShared && r._meta?.adminId ? `<div class="report-author-badge">@${escHtml(r._meta.adminId)}</div>` : ''}
      <div class="report-card-num">#${id}</div>
      <div class="report-card-client">${escHtml(r.client?.name || '—')}</div>
      <div class="report-card-meta">${escHtml(r.client?.date || '')} · ${escHtml(r.client?.sector || '')}</div>
      <div class="report-card-site">${escHtml((r.client?.site||'').replace(/^https?:\/\//,''))}</div>
      <div class="report-card-actions">
        <a class="rca" href="${link}" target="_blank">👁 Voir</a>
        ${!isShared || isSuperAdmin() ? `<button class="rca" onclick="openEditReport('${id}')">✏ Modifier</button>` : ''}
        <button class="rca share-btn" onclick="openShareReportModal('${id}')">👥 Partager</button>
        ${(!isShared || isSuperAdmin()) ? `<button class="rca danger" onclick="confirmDeleteReport('${id}')">✕</button>` : ''}
      </div>
    </div>`;
  }).join('');

  container.innerHTML = `<div class="reports-grid">${cards}</div>`;
}

function confirmDeleteReport(id) {
  if (!confirm(`Supprimer l'analyse #${id} ? Cette action est irréversible.`)) return;
  const reports = getStoredReports();
  delete reports[id];
  saveStoredReports(reports);
  renderReportsList();
  toast('Analyse supprimée.', 'success');
}

// ——— SHARE REPORT WITH OTHER ADMINS ———
function openShareReportModal(reportId) {
  const reports = getStoredReports();
  const r = reports[reportId]; if (!r) return;
  openModal('share-report-modal', 'md');
  document.getElementById('share-report-id').value = reportId;
  document.getElementById('share-report-modal-title').textContent = `Partager l'analyse #${reportId}`;

  const sharedWith = r._meta?.sharedWith || [];
  const admins = getAdmins().filter(a => a.username !== r._meta?.adminId && a.username !== 'Wyatt');
  const session = getSession();
  const myAdmins = admins.filter(a => a.username !== session?.username);

  if (myAdmins.length === 0) {
    document.getElementById('share-report-admins-list').innerHTML = '<div style="font-size:11px;color:var(--mid);padding:12px">Aucun autre admin disponible.</div>';
    return;
  }

  document.getElementById('share-report-admins-list').innerHTML = myAdmins.map(a => {
    const checked = sharedWith.includes(a.username);
    return `<div class="share-admin-row ${checked ? 'selected' : ''}" onclick="toggleShareReportAdmin('${reportId}','${a.username}',this)">
      <div>
        <div class="share-admin-row-name">${escHtml(a.displayName)}</div>
        <div class="share-admin-row-role">${a.role === 'superadmin' ? '★ Super Admin' : 'Admin'}</div>
      </div>
      <div class="share-check">${checked ? '✓' : ''}</div>
    </div>`;
  }).join('');
}

function toggleShareReportAdmin(reportId, adminUsername, el) {
  const reports = getStoredReports();
  const r = reports[reportId]; if (!r) return;
  let shared = [...(r._meta?.sharedWith || [])];
  if (shared.includes(adminUsername)) {
    shared = shared.filter(u => u !== adminUsername);
    el.classList.remove('selected');
    el.querySelector('.share-check').textContent = '';
    toast(`Partage retiré à @${adminUsername}`, 'info');
  } else {
    shared.push(adminUsername);
    el.classList.add('selected');
    el.querySelector('.share-check').textContent = '✓';
    toast(`Analyse partagée avec @${adminUsername}`, 'success');
  }
  r._meta = { ...r._meta, sharedWith: shared };
  saveStoredReports(reports);
}

// ——— EDIT REPORT ———
let _editingReportId = null;

function openEditReport(reportId) {
  const reports = getStoredReports();
  const r = reports[reportId]; if (!r) return;
  _editingReportId = reportId;
  // Switch to form tab and populate
  switchTab('analyse');
  populateForm(r);
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
  toast(`📝 Modification de l'analyse #${reportId}`, 'info');
  document.querySelector('.generate-btn').textContent = '✦ ENREGISTRER LES MODIFICATIONS';
}

function populateForm(data) {
  const s = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  const sd = data.sender || {};
  const cd = data.client || {};

  s('s_name', sd.name); s('s_role', sd.role); s('s_company', sd.company);
  s('s_city', sd.city); s('s_website', sd.website); s('s_phone', sd.phone);
  s('s_email', sd.email); s('s_tags', (sd.tags||[]).join(', '));
  if (sd.photo) { s('s_photo_url', sd.photo); const img = document.getElementById('s_photo_preview'); if (img) { img.src = sd.photo; img.style.display='block'; } }

  s('c_name', cd.name); s('c_job', cd.job); s('c_site', cd.site); s('c_city', cd.city);
  s('c_sector', cd.sector); s('c_ref', cd.ref); s('c_intro', cd.intro);
  s('c_diffpoint', cd.diffpoint); s('c_date', cd.date); s('c_badge', cd.badge);
  if (document.getElementById('c_confidentiality')) document.getElementById('c_confidentiality').value = cd.confidentiality || 'Confidentiel client';
  if (document.getElementById('c_priority')) document.getElementById('c_priority').value = cd.priority || 'Priorité haute';

  s('a_score', data.audit_score || 0);
  if (data.audit_score) updateScoreBar('a_score', 'a_score_bar');

  // Clear and repopulate repeatable rows
  document.getElementById('strengths-container').innerHTML = '';
  document.getElementById('weaknesses-container').innerHTML = '';
  document.getElementById('comp-container').innerHTML = '';
  document.getElementById('tbl-container').innerHTML = '';
  document.getElementById('kw-container').innerHTML = '';
  document.getElementById('perf-container').innerHTML = '';
  document.getElementById('bugs-container').innerHTML = '';
  document.getElementById('opp-container').innerHTML = '';
  document.getElementById('actions-container').innerHTML = '';
  document.getElementById('tl-container').innerHTML = '';

  (data.strengths||[]).forEach(p => { addAuditRow('strengths-container', p.type||'ok', p.title, p.desc); });
  (data.weaknesses||[]).forEach(p => { addAuditRow('weaknesses-container', p.type||'bad', p.title, p.desc); });

  s('comp_intro', data.comp_intro);
  (data.competitors||[]).forEach(c => { addCompRow(c.name, c.url, c.threat, c.desc, c.note); });

  s('tbl_comp1', data.tbl_comp1); s('tbl_comp2', data.tbl_comp2);
  (data.table_rows||[]).forEach(r => { addTblRow(r.criterion, r.client_val, r.client_cls, r.comp1_val, r.comp1_cls, r.comp2_val, r.comp2_cls); });

  s('kw_intro', data.kw_intro); s('kw_note', data.kw_note);
  (data.keywords||[]).forEach(k => { addKwRow(k.kw, k.vol, k.diff); });

  s('perf_comment', data.perf_comment);
  (data.perfs||[]).forEach(p => { addPerfRow(p.label, p.score, p.cls); });

  (data.bugs||[]).forEach(b => { addBugRow(b.title, b.desc); });
  (data.opps||[]).forEach(o => { addOppRow(o.icon, o.title, o.desc); });
  (data.actions||[]).forEach(a => { addActionRow(a.title, a.desc, a.impact, a.urgency); });
  (data.timeline||[]).forEach(t => { addTlRow(t.phase, t.title, t.desc); });

  s('v_title', data.verdict?.title); s('v_text', data.verdict?.text);
}

// ——— BLOCK TOGGLE ———
function toggleBlock(id) {
  const block = document.getElementById(id);
  block.classList.toggle('collapsed');
  block.querySelector('.form-block-toggle').textContent = block.classList.contains('collapsed') ? '▸' : '▾';
}

// ——— PHOTO UPLOAD ———
function handlePhotoUpload(inputId, previewId, hiddenId) {
  const file = document.getElementById(inputId).files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById(hiddenId).value = e.target.result;
    const img = document.getElementById(previewId);
    img.src = e.target.result; img.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

// ——— SCORE BAR ———
function updateScoreBar(inputId, barId) {
  const v = parseInt(document.getElementById(inputId).value) || 0;
  const bar = document.getElementById(barId);
  bar.style.width = Math.min(v, 100) + '%';
  bar.style.background = v < 40 ? '#9b2020' : v < 65 ? '#8c4a00' : '#1a5c35';
}

// ——— REPEATABLE ROWS ———
function addAuditRow(containerId, type, title, desc) {
  const key = containerId === 'strengths-container' ? 'strengths' : 'weaknesses';
  const i = counters[key]++;
  const div = document.createElement('div');
  div.className = 'rep-row audit-row-el';
  div.innerHTML = `
    <select>
      <option value="ok" ${type==='ok'?'selected':''}>✓ Vert (point fort)</option>
      <option value="warn" ${type==='warn'?'selected':''}>⚠ Orange (attention)</option>
      <option value="bad" ${type==='bad'?'selected':''}>✗ Rouge (critique)</option>
    </select>
    <div style="display:flex;flex-direction:column;gap:6px">
      <input type="text" placeholder="Titre du point" value="${escHtmlAttr(title||'')}">
      <textarea placeholder="Description détaillée...">${escHtml(desc||'')}</textarea>
    </div>
    <button class="rep-del" onclick="this.parentElement.remove()">×</button>`;
  document.getElementById(containerId).appendChild(div);
}

function addCompRow(name, url, threat, desc, note) {
  counters.comp++;
  const div = document.createElement('div');
  div.className = 'rep-row comp-row';
  div.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:6px">
      <input type="text" placeholder="Nom du concurrent" value="${escHtmlAttr(name||'')}">
      <input type="text" placeholder="URL" value="${escHtmlAttr(url||'')}">
      <select>
        <option value="h" ${threat==='h'?'selected':''}>🔴 Concurrent majeur</option>
        <option value="m" ${threat==='m'?'selected':''}>🟠 Concurrent établi</option>
        <option value="l" ${threat==='l'?'selected':''}>🟡 Concurrent local</option>
        <option value="p" ${threat==='p'?'selected':''}>🟢 Hors segment</option>
      </select>
    </div>
    <textarea placeholder="Description, forces, faiblesses...">${escHtml(desc||'')}</textarea>
    <textarea placeholder="Note stratégique...">${escHtml(note||'')}</textarea>
    <button class="rep-del" onclick="this.parentElement.remove()">×</button>`;
  document.getElementById('comp-container').appendChild(div);
}

function addTblRow(criterion, cv, cc, v1, c1, v2, c2) {
  counters.tbl++;
  const div = document.createElement('div');
  div.className = 'rep-row';
  div.style.gridTemplateColumns = '2fr 2fr 1fr 1fr auto';
  div.innerHTML = `
    <input type="text" placeholder="Critère SEO" value="${escHtmlAttr(criterion||'')}">
    <div style="display:flex;flex-direction:column;gap:4px">
      <input type="text" placeholder="Valeur client" value="${escHtmlAttr(cv||'')}">
      <select><option value="ok" ${cc==='ok'?'selected':''}>✓ Vert</option><option value="warn" ${cc==='warn'?'selected':''}>⚠ Orange</option><option value="bad" ${cc==='bad'?'selected':''}>✗ Rouge</option></select>
    </div>
    <div style="display:flex;flex-direction:column;gap:4px">
      <input type="text" placeholder="Concurrent A" value="${escHtmlAttr(v1||'')}">
      <select><option value="ok" ${c1==='ok'?'selected':''}>✓ Vert</option><option value="warn" ${c1==='warn'?'selected':''}>⚠ Orange</option><option value="bad" ${c1==='bad'?'selected':''}>✗ Rouge</option></select>
    </div>
    <div style="display:flex;flex-direction:column;gap:4px">
      <input type="text" placeholder="Concurrent B" value="${escHtmlAttr(v2||'')}">
      <select><option value="ok" ${c2==='ok'?'selected':''}>✓ Vert</option><option value="warn" ${c2==='warn'?'selected':''}>⚠ Orange</option><option value="bad" ${c2==='bad'?'selected':''}>✗ Rouge</option></select>
    </div>
    <button class="rep-del" onclick="this.parentElement.remove()">×</button>`;
  document.getElementById('tbl-container').appendChild(div);
}

function addKwRow(kw, vol, diff) {
  counters.kw++;
  const div = document.createElement('div');
  div.className = 'rep-row kw-row-el';
  div.innerHTML = `
    <input type="text" placeholder="Mot-clé" value="${escHtmlAttr(kw||'')}">
    <input type="text" placeholder="Volume/mois" value="${escHtmlAttr(vol||'')}">
    <select>
      <option value="low" ${diff==='low'?'selected':''}>🟢 Accessible</option>
      <option value="mid" ${diff==='mid'?'selected':''}>🟡 Moyen</option>
      <option value="high" ${diff==='high'?'selected':''}>🔴 Compétitif</option>
    </select>
    <button class="rep-del" onclick="this.parentElement.remove()">×</button>`;
  document.getElementById('kw-container').appendChild(div);
}

function addPerfRow(label, score, cls) {
  counters.perf++;
  const div = document.createElement('div');
  div.className = 'rep-row';
  div.style.gridTemplateColumns = '3fr 1fr 1fr auto';
  div.innerHTML = `
    <input type="text" placeholder="Libellé" value="${escHtmlAttr(label||'')}">
    <input type="number" placeholder="Score 0-100" min="0" max="100" value="${escHtmlAttr(String(score||''))}">
    <select>
      <option value="fill-low" ${cls==='fill-low'?'selected':''}>🔴 Bas</option>
      <option value="fill-mid" ${cls==='fill-mid'?'selected':''}>🟡 Moyen</option>
      <option value="fill-good" ${cls==='fill-good'?'selected':''}>🟢 Bon</option>
      <option value="fill-gold" ${cls==='fill-gold'?'selected':''}>🟤 Or</option>
    </select>
    <button class="rep-del" onclick="this.parentElement.remove()">×</button>`;
  document.getElementById('perf-container').appendChild(div);
}

function addBugRow(title, desc) {
  counters.bugs++;
  const div = document.createElement('div');
  div.className = 'rep-row';
  div.style.gridTemplateColumns = '3fr 2fr auto';
  div.innerHTML = `
    <input type="text" placeholder="Titre" value="${escHtmlAttr(title||'')}">
    <textarea placeholder="Description...">${escHtml(desc||'')}</textarea>
    <button class="rep-del" onclick="this.parentElement.remove()">×</button>`;
  document.getElementById('bugs-container').appendChild(div);
}

function addOppRow(icon, title, desc) {
  counters.opp++;
  const div = document.createElement('div');
  div.className = 'rep-row opp-row-el';
  div.innerHTML = `
    <input type="text" placeholder="Emoji" value="${escHtmlAttr(icon||'')}">
    <input type="text" placeholder="Titre" value="${escHtmlAttr(title||'')}">
    <textarea placeholder="Description...">${escHtml(desc||'')}</textarea>
    <button class="rep-del" onclick="this.parentElement.remove()">×</button>`;
  document.getElementById('opp-container').appendChild(div);
}

function addActionRow(title, desc, impact, urgency) {
  counters.actions++;
  const div = document.createElement('div');
  div.className = 'rep-row action-row-el';
  div.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:6px">
      <input type="text" placeholder="Titre de l'action" value="${escHtmlAttr(title||'')}">
      <textarea placeholder="Description détaillée...">${escHtml(desc||'')}</textarea>
    </div>
    <textarea placeholder="Impact / justification...">${escHtml(impact||'')}</textarea>
    <select>
      <option value="now" ${urgency==='now'?'selected':''}>🔴 Maintenant</option>
      <option value="week" ${urgency==='week'?'selected':''}>🟠 Cette semaine</option>
      <option value="month" ${urgency==='month'?'selected':''}>⚫ Ce mois-ci</option>
    </select>
    <button class="rep-del" onclick="this.parentElement.remove()">×</button>`;
  document.getElementById('actions-container').appendChild(div);
}

function addTlRow(phase, title, desc) {
  counters.tl++;
  const div = document.createElement('div');
  div.className = 'rep-row tl-row-el';
  div.innerHTML = `
    <input type="text" placeholder="Phase" value="${escHtmlAttr(phase||'')}">
    <input type="text" placeholder="Titre" value="${escHtmlAttr(title||'')}">
    <textarea placeholder="Description...">${escHtml(desc||'')}</textarea>
    <button class="rep-del" onclick="this.parentElement.remove()">×</button>`;
  document.getElementById('tl-container').appendChild(div);
}

// ——— PREFILL DEFAULTS ———
function prefillDefaults(admin) {
  const s = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  if (admin) {
    s('s_name', admin.displayName || admin.firstName + ' ' + admin.lastName);
    s('s_photo_url', admin.photo || '');
    if (admin.photo) { const prev = document.getElementById('s_photo_preview'); if (prev) { prev.src = admin.photo; prev.style.display = 'block'; } }
  }
  s('s_role', 'Directrice JWL Marketing — Consultante SEO & Marketing stratégique');
  s('s_company', 'JWL Marketing');
  s('s_city', 'Aix-en-Provence, PACA');
  s('s_website', 'https://jwl-marketing.fr');
  s('s_phone', '+33 7 83 79 28 14');
  s('s_email', 'contact@jwl-marketing.fr');
  s('s_tags', 'SEO Local, Stratégie digitale, GEO / IA, PACA');
  s('c_date', new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }));
  s('c_confidentiality', 'Confidentiel client');
  s('c_priority', 'Priorité haute');
  s('v_title', 'Verdict stratégique JWL Marketing');

  // Default rows
  addAuditRow('strengths-container', 'ok');
  addAuditRow('weaknesses-container', 'bad');
  addCompRow(); addTblRow(); addKwRow(); addPerfRow(); addBugRow(); addOppRow(); addActionRow(); addTlRow();
}

// ——— COLLECT DATA ———
function collectData() {
  const g = id => document.getElementById(id)?.value?.trim() || '';
  const b64Photo = g('s_photo_b64') || g('s_photo_url');

  const sender = {
    name: g('s_name'), role: g('s_role'), company: g('s_company'),
    city: g('s_city'), website: g('s_website'), phone: g('s_phone'),
    email: g('s_email'), tags: g('s_tags').split(',').map(t => t.trim()).filter(Boolean),
    photo: b64Photo
  };
  const client = {
    name: g('c_name'), job: g('c_job'), site: g('c_site'), city: g('c_city'),
    sector: g('c_sector'), ref: g('c_ref'), intro: g('c_intro'),
    diffpoint: g('c_diffpoint'), date: g('c_date'),
    confidentiality: g('c_confidentiality'), priority: g('c_priority'), badge: g('c_badge')
  };

  const audit_score = parseInt(g('a_score')) || 0;
  const strengths = [], weaknesses = [];
  document.querySelectorAll('#strengths-container .rep-row').forEach(row => {
    const inp = row.querySelectorAll('input,select,textarea');
    if (inp[1]?.value) strengths.push({ type: inp[0]?.value||'ok', title: inp[1]?.value, desc: inp[2]?.value });
  });
  document.querySelectorAll('#weaknesses-container .rep-row').forEach(row => {
    const inp = row.querySelectorAll('input,select,textarea');
    if (inp[1]?.value) weaknesses.push({ type: inp[0]?.value||'bad', title: inp[1]?.value, desc: inp[2]?.value });
  });

  const comp_intro = g('comp_intro');
  const competitors = [];
  document.querySelectorAll('#comp-container .rep-row').forEach(row => {
    const inp = row.querySelectorAll('input,select,textarea');
    if (inp[0]?.value) competitors.push({ name: inp[0]?.value, url: inp[1]?.value, threat: inp[2]?.value, desc: inp[3]?.value, note: inp[4]?.value });
  });

  const tbl_comp1 = g('tbl_comp1'), tbl_comp2 = g('tbl_comp2');
  const table_rows = [];
  document.querySelectorAll('#tbl-container .rep-row').forEach(row => {
    const inp = row.querySelectorAll('input,select');
    if (inp[0]?.value) table_rows.push({ criterion: inp[0]?.value, client_val: inp[1]?.value, client_cls: inp[2]?.value, comp1_val: inp[3]?.value, comp1_cls: inp[4]?.value, comp2_val: inp[5]?.value, comp2_cls: inp[6]?.value });
  });

  const kw_intro = g('kw_intro'), kw_note = g('kw_note');
  const keywords = [];
  document.querySelectorAll('#kw-container .rep-row').forEach(row => {
    const inp = row.querySelectorAll('input,select');
    if (inp[0]?.value) keywords.push({ kw: inp[0]?.value, vol: inp[1]?.value, diff: inp[2]?.value });
  });

  const perf_comment = g('perf_comment');
  const perfs = [];
  document.querySelectorAll('#perf-container .rep-row').forEach(row => {
    const inp = row.querySelectorAll('input,select');
    if (inp[0]?.value) perfs.push({ label: inp[0]?.value, score: parseInt(inp[1]?.value)||0, cls: inp[2]?.value });
  });

  const bugs = [];
  document.querySelectorAll('#bugs-container .rep-row').forEach(row => {
    const inp = row.querySelectorAll('input,textarea');
    if (inp[0]?.value) bugs.push({ title: inp[0]?.value, desc: inp[1]?.value });
  });

  const opps = [];
  document.querySelectorAll('#opp-container .rep-row').forEach(row => {
    const inp = row.querySelectorAll('input,textarea');
    if (inp[1]?.value) opps.push({ icon: inp[0]?.value, title: inp[1]?.value, desc: inp[2]?.value });
  });

  const actions = [];
  document.querySelectorAll('#actions-container .rep-row').forEach(row => {
    const inp = row.querySelectorAll('input,textarea,select');
    if (inp[0]?.value) actions.push({ title: inp[0]?.value, desc: inp[1]?.value, impact: inp[2]?.value, urgency: inp[3]?.value });
  });

  const timeline = [];
  document.querySelectorAll('#tl-container .rep-row').forEach(row => {
    const inp = row.querySelectorAll('input,textarea');
    if (inp[1]?.value) timeline.push({ phase: inp[0]?.value, title: inp[1]?.value, desc: inp[2]?.value });
  });

  return { sender, client, audit_score, strengths, weaknesses, comp_intro, competitors, tbl_comp1, tbl_comp2, table_rows, kw_intro, kw_note, keywords, perf_comment, perfs, bugs, opps, actions, timeline, verdict: { title: g('v_title'), text: g('v_text') } };
}

function utf8ToBase64(str) { return btoa(unescape(encodeURIComponent(str))); }

// ——— GENERATE / SAVE REPORT ———
async function generateReport() {
  const data = collectData();
  if (!data.client.name) { toast('⚠ Veuillez au moins renseigner le nom du client.', 'error'); return; }

  let reportId;
  if (_editingReportId) {
    updateReportData(_editingReportId, data);
    reportId = _editingReportId;
    _editingReportId = null;
    document.querySelector('.generate-btn').textContent = '✦ GÉNÉRER LE LIEN D\'ANALYSE';
    toast('✓ Analyse #' + reportId + ' mise à jour.', 'success');
  } else {
    reportId = persistReportData(data);
    toast('✓ Analyse #' + reportId + ' créée.', 'success');
  }

  const base = window.location.href.replace(/index\.html.*$/, '').replace(/\?.*$/, '');
  const pageUrl = base + 'view.html?page=' + reportId;

  document.getElementById('result-client-name').textContent = '📊 Analyse — ' + data.client.name;
  document.getElementById('result-link-page').textContent = pageUrl;
  document.getElementById('result-open-page').href = pageUrl;
  document.getElementById('result-page-label').textContent = `Dossier #${reportId}`;
  document.getElementById('result-area').style.display = 'block';
  document.getElementById('result-area').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function copyLink(targetId, btn) {
  const txt = document.getElementById(targetId)?.textContent || '';
  if (!txt) return;
  navigator.clipboard.writeText(txt).then(() => {
    const orig = btn.textContent; btn.textContent = '✓ COPIÉ';
    setTimeout(() => btn.textContent = orig, 2000);
  });
}

// ——— TABS ———
function switchTab(tab) {
  document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById('tab-' + tab);
  if (panel) panel.style.display = 'block';
  const btn = document.getElementById('tab-btn-' + tab) || document.getElementById('tab-' + tab + '-btn');
  if (btn) btn.classList.add('active');
  if (tab === 'admins') renderAdminList();
  if (tab === 'clients') renderClientList();
  if (tab === 'reports') renderReportsList();
}

// ——— HELPERS ———
function escHtmlAttr(s) { return (s||'').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
