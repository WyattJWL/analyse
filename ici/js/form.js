// =================== JWL MARKETING — FORM LOGIC ===================

let counters = { strengths: 0, weaknesses: 0, comp: 0, tbl: 0, kw: 0, perf: 0, bugs: 0, opp: 0, actions: 0, tl: 0 };

const JWL_REPORTS_KEY = 'jwl_reports_v1';
const JWL_REPORT_SEQ_KEY = 'jwl_reports_seq_v1';

function getStoredReports() {
  try {
    return JSON.parse(localStorage.getItem(JWL_REPORTS_KEY) || '{}');
  } catch (_) {
    return {};
  }
}

function saveStoredReports(map) {
  localStorage.setItem(JWL_REPORTS_KEY, JSON.stringify(map));
}

function createReportId() {
  const current = parseInt(localStorage.getItem(JWL_REPORT_SEQ_KEY) || '1000', 10);
  const next = Number.isFinite(current) ? current + 1 : 1001;
  localStorage.setItem(JWL_REPORT_SEQ_KEY, String(next));
  return String(next);
}

function persistReportData(data) {
  const id = createReportId();
  const reports = getStoredReports();
  reports[id] = { ...data, _meta: { createdAt: new Date().toISOString(), id } };
  saveStoredReports(reports);
  return id;
}

// ——— Block toggle ———
function toggleBlock(id) {
  const block = document.getElementById(id);
  block.classList.toggle('collapsed');
  const arrow = block.querySelector('.form-block-toggle');
  arrow.textContent = block.classList.contains('collapsed') ? '▸' : '▾';
}

// ——— Photo upload ———
function handlePhotoUpload(inputId, previewId, hiddenId) {
  const file = document.getElementById(inputId).files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const b64 = e.target.result;
    document.getElementById(hiddenId).value = b64;
    const img = document.getElementById(previewId);
    img.src = b64;
    img.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

// ——— Score bar ———
function updateScoreBar(inputId, barId) {
  const v = parseInt(document.getElementById(inputId).value) || 0;
  const bar = document.getElementById(barId);
  bar.style.width = Math.min(v, 100) + '%';
  bar.style.background = v < 40 ? '#9b2020' : v < 65 ? '#8c4a00' : '#1a5c35';
}

// ——— Repeatable rows ———
function addAuditRow(containerId, type) {
  const key = containerId === 'strengths-container' ? 'strengths' : 'weaknesses';
  const i = counters[key]++;
  const div = document.createElement('div');
  div.className = 'rep-row audit-row-el';
  div.id = containerId + '_row_' + i;
  div.innerHTML = `
    <select>
      <option value="ok" ${type === 'ok' ? 'selected' : ''}>✓ Vert (point fort)</option>
      <option value="warn" ${type === 'warn' ? 'selected' : ''}>⚠ Orange (attention)</option>
      <option value="bad" ${type === 'bad' ? 'selected' : ''}>✗ Rouge (critique)</option>
    </select>
    <div style="display:flex;flex-direction:column;gap:6px">
      <input type="text" placeholder="Titre du point (ex : Domaine SEO-optimisé)">
      <textarea placeholder="Description détaillée..." style="min-height:54px"></textarea>
    </div>
    <button class="rep-del" onclick="this.parentElement.remove()">×</button>
  `;
  document.getElementById(containerId).appendChild(div);
}

function addCompRow() {
  counters.comp++;
  const div = document.createElement('div');
  div.className = 'rep-row comp-row';
  div.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:6px">
      <input type="text" placeholder="Nom du concurrent">
      <input type="text" placeholder="URL (ex : site.fr/page)">
      <select>
        <option value="h">🔴 Concurrent majeur</option>
        <option value="m">🟠 Concurrent établi</option>
        <option value="l">🟡 Concurrent local</option>
        <option value="p">🟢 Hors segment</option>
      </select>
    </div>
    <textarea placeholder="Description, forces, faiblesses..." style="min-height:90px"></textarea>
    <textarea placeholder="Note stratégique..." style="min-height:90px"></textarea>
    <button class="rep-del" onclick="this.parentElement.remove()">×</button>
  `;
  document.getElementById('comp-container').appendChild(div);
}

function addTblRow() {
  counters.tbl++;
  const div = document.createElement('div');
  div.className = 'rep-row';
  div.style.gridTemplateColumns = '2fr 2fr 1fr 1fr auto';
  div.innerHTML = `
    <input type="text" placeholder="Critère SEO (ex : Domaine optimisé local)">
    <div style="display:flex;flex-direction:column;gap:4px">
      <input type="text" placeholder="Valeur client (ex : ✓ Excellent)">
      <select><option value="ok">✓ Vert</option><option value="warn">⚠ Orange</option><option value="bad">✗ Rouge</option></select>
    </div>
    <div style="display:flex;flex-direction:column;gap:4px">
      <input type="text" placeholder="Concurrent A">
      <select><option value="ok">✓ Vert</option><option value="warn">⚠ Orange</option><option value="bad">✗ Rouge</option></select>
    </div>
    <div style="display:flex;flex-direction:column;gap:4px">
      <input type="text" placeholder="Concurrent B">
      <select><option value="ok">✓ Vert</option><option value="warn">⚠ Orange</option><option value="bad">✗ Rouge</option></select>
    </div>
    <button class="rep-del" onclick="this.parentElement.remove()">×</button>
  `;
  document.getElementById('tbl-container').appendChild(div);
}

function addKwRow() {
  counters.kw++;
  const div = document.createElement('div');
  div.className = 'rep-row kw-row-el';
  div.innerHTML = `
    <input type="text" placeholder="Mot-clé (ex : gestion de patrimoine Aix-en-Provence)">
    <input type="text" placeholder="Volume/mois (ex : ~480/mois)">
    <select>
      <option value="low">🟢 Accessible</option>
      <option value="mid">🟡 Moyen</option>
      <option value="high">🔴 Compétitif</option>
    </select>
    <button class="rep-del" onclick="this.parentElement.remove()">×</button>
  `;
  document.getElementById('kw-container').appendChild(div);
}

function addPerfRow() {
  counters.perf++;
  const div = document.createElement('div');
  div.className = 'rep-row';
  div.style.gridTemplateColumns = '3fr 1fr 1fr auto';
  div.innerHTML = `
    <input type="text" placeholder="Libellé (ex : Score SEO global — site actuel)">
    <input type="number" placeholder="Score 0-100" min="0" max="100">
    <select>
      <option value="fill-low">🔴 Bas</option>
      <option value="fill-mid">🟡 Moyen</option>
      <option value="fill-good">🟢 Bon</option>
      <option value="fill-gold">🟤 Or</option>
    </select>
    <button class="rep-del" onclick="this.parentElement.remove()">×</button>
  `;
  document.getElementById('perf-container').appendChild(div);
}

function addBugRow() {
  counters.bugs++;
  const div = document.createElement('div');
  div.className = 'rep-row';
  div.style.gridTemplateColumns = '3fr 2fr auto';
  div.innerHTML = `
    <input type="text" placeholder="Titre (ex : 🚨 Fautes d'orthographe — CRÉDIBILITÉ)">
    <textarea placeholder="Description détaillée de la correction..." style="min-height:70px"></textarea>
    <button class="rep-del" onclick="this.parentElement.remove()">×</button>
  `;
  document.getElementById('bugs-container').appendChild(div);
}

function addOppRow() {
  counters.opp++;
  const div = document.createElement('div');
  div.className = 'rep-row opp-row-el';
  div.innerHTML = `
    <input type="text" placeholder="Emoji (ex : 👥)">
    <input type="text" placeholder="Titre (ex : Accessible à tous)">
    <textarea placeholder="Description courte de l'opportunité..." style="min-height:54px"></textarea>
    <button class="rep-del" onclick="this.parentElement.remove()">×</button>
  `;
  document.getElementById('opp-container').appendChild(div);
}

function addActionRow() {
  counters.actions++;
  const div = document.createElement('div');
  div.className = 'rep-row action-row-el';
  div.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:6px">
      <input type="text" placeholder="Titre de l'action">
      <textarea placeholder="Description détaillée..." style="min-height:60px"></textarea>
    </div>
    <textarea placeholder="Impact / justification..." style="min-height:60px"></textarea>
    <select>
      <option value="now">🔴 Maintenant</option>
      <option value="week">🟠 Cette semaine</option>
      <option value="month">⚫ Ce mois-ci</option>
    </select>
    <button class="rep-del" onclick="this.parentElement.remove()">×</button>
  `;
  document.getElementById('actions-container').appendChild(div);
}

function addTlRow() {
  counters.tl++;
  const div = document.createElement('div');
  div.className = 'rep-row tl-row-el';
  div.innerHTML = `
    <input type="text" placeholder="Phase (ex : Semaine 1–2 · Phase fondations)">
    <input type="text" placeholder="Titre (ex : Corriger et stabiliser les bases SEO)">
    <textarea placeholder="Description..." style="min-height:54px"></textarea>
    <button class="rep-del" onclick="this.parentElement.remove()">×</button>
  `;
  document.getElementById('tl-container').appendChild(div);
}

// ——— Prefill defaults (admin profile auto-injected) ———
function prefillDefaults(admin) {
  const s = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };

  // Sender — from admin profile
  if (admin) {
    s('s_name', admin.displayName || admin.firstName + ' ' + admin.lastName);
    s('s_photo_url', admin.photo || '');
    if (admin.photo) {
      const prev = document.getElementById('s_photo_preview');
      if (prev) { prev.src = admin.photo; prev.style.display = 'block'; }
    }
  }
  s('s_role', 'Directrice JWL Marketing — Consultante SEO & Marketing stratégique');
  s('s_company', 'JWL Marketing');
  s('s_city', 'Aix-en-Provence, PACA');
  s('s_website', 'https://jwl-marketing.fr');
  s('s_phone', '+33 7 83 79 28 14');
  s('s_email', 'contact@jwl-marketing.fr');
  s('s_tags', 'SEO Local, Stratégie digitale, GEO / IA, PACA');

  // Client
  s('c_date', new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }));
  s('c_confidentiality', 'Confidentiel client');
  s('c_priority', 'Priorité haute');
  s('v_title', 'Verdict stratégique JWL Marketing');

  // Default rows
  addAuditRow('strengths-container', 'ok');
  addAuditRow('weaknesses-container', 'bad');
  addCompRow();
  addTblRow();
  addKwRow();
  addPerfRow();
  addBugRow();
  addOppRow();
  addActionRow();
  addTlRow();
}

// ——— Collect data ———
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
    confidentiality: g('c_confidentiality'), priority: g('c_priority'),
    badge: g('c_badge')
  };

  const audit_score = parseInt(g('a_score')) || 0;
  const strengths = [], weaknesses = [];
  document.querySelectorAll('#strengths-container .rep-row').forEach(row => {
    const inputs = row.querySelectorAll('input,select,textarea');
    if (inputs[1]?.value) strengths.push({ type: inputs[0]?.value || 'ok', title: inputs[1]?.value, desc: inputs[2]?.value });
  });
  document.querySelectorAll('#weaknesses-container .rep-row').forEach(row => {
    const inputs = row.querySelectorAll('input,select,textarea');
    if (inputs[1]?.value) weaknesses.push({ type: inputs[0]?.value || 'bad', title: inputs[1]?.value, desc: inputs[2]?.value });
  });

  const comp_intro = g('comp_intro');
  const competitors = [];
  document.querySelectorAll('#comp-container .rep-row').forEach(row => {
    const inputs = row.querySelectorAll('input,select,textarea');
    if (inputs[0]?.value) competitors.push({
      name: inputs[0]?.value, url: inputs[1]?.value, threat: inputs[2]?.value,
      desc: inputs[3]?.value, note: inputs[4]?.value
    });
  });

  const tbl_comp1 = g('tbl_comp1'), tbl_comp2 = g('tbl_comp2');
  const table_rows = [];
  document.querySelectorAll('#tbl-container .rep-row').forEach(row => {
    const inputs = row.querySelectorAll('input,select');
    if (inputs[0]?.value) table_rows.push({
      criterion: inputs[0]?.value,
      client_val: inputs[1]?.value, client_cls: inputs[2]?.value,
      comp1_val: inputs[3]?.value, comp1_cls: inputs[4]?.value,
      comp2_val: inputs[5]?.value, comp2_cls: inputs[6]?.value
    });
  });

  const kw_intro = g('kw_intro'), kw_note = g('kw_note');
  const keywords = [];
  document.querySelectorAll('#kw-container .rep-row').forEach(row => {
    const inputs = row.querySelectorAll('input,select');
    if (inputs[0]?.value) keywords.push({ kw: inputs[0]?.value, vol: inputs[1]?.value, diff: inputs[2]?.value });
  });

  const perf_comment = g('perf_comment');
  const perfs = [];
  document.querySelectorAll('#perf-container .rep-row').forEach(row => {
    const inputs = row.querySelectorAll('input,select');
    if (inputs[0]?.value) perfs.push({ label: inputs[0]?.value, score: parseInt(inputs[1]?.value) || 0, cls: inputs[2]?.value });
  });

  const bugs = [];
  document.querySelectorAll('#bugs-container .rep-row').forEach(row => {
    const inputs = row.querySelectorAll('input,textarea');
    if (inputs[0]?.value) bugs.push({ title: inputs[0]?.value, desc: inputs[1]?.value });
  });

  const opps = [];
  document.querySelectorAll('#opp-container .rep-row').forEach(row => {
    const inputs = row.querySelectorAll('input,textarea');
    if (inputs[1]?.value) opps.push({ icon: inputs[0]?.value, title: inputs[1]?.value, desc: inputs[2]?.value });
  });

  const actions = [];
  document.querySelectorAll('#actions-container .rep-row').forEach(row => {
    const inputs = row.querySelectorAll('input,textarea,select');
    if (inputs[0]?.value) actions.push({ title: inputs[0]?.value, desc: inputs[1]?.value, impact: inputs[2]?.value, urgency: inputs[3]?.value });
  });

  const timeline = [];
  document.querySelectorAll('#tl-container .rep-row').forEach(row => {
    const inputs = row.querySelectorAll('input,textarea');
    if (inputs[1]?.value) timeline.push({ phase: inputs[0]?.value, title: inputs[1]?.value, desc: inputs[2]?.value });
  });

  const verdict = { title: g('v_title'), text: g('v_text') };

  return {
    sender, client, audit_score, strengths, weaknesses,
    comp_intro, competitors, tbl_comp1, tbl_comp2, table_rows,
    kw_intro, kw_note, keywords, perf_comment, perfs,
    bugs, opps, actions, timeline, verdict
  };
}

function utf8ToBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function bytesToBase64Url(bytes) {
  let bin = '';
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function compressJsonToToken(json) {
  if (typeof CompressionStream === 'undefined') return null;
  const stream = new CompressionStream('deflate-raw');
  const writer = stream.writable.getWriter();
  await writer.write(new TextEncoder().encode(json));
  await writer.close();
  const buffer = await new Response(stream.readable).arrayBuffer();
  return bytesToBase64Url(new Uint8Array(buffer));
}

// ——— Generate report ———
async function generateReport() {
  const data = collectData();
  if (!data.client.name) { alert('⚠ Veuillez au moins renseigner le nom du client.'); return; }

  const json = JSON.stringify(data);
  const encoded = utf8ToBase64(json);
  const base = window.location.href.replace(/index\.html.*$/, '').replace(/\?.*$/, '');
  const dossierId = persistReportData(data);
  const pageUrl = base + 'view.html?page=' + dossierId;
  const b64Url = base + 'view.html#b64:' + encoded;

  let shortUrl = b64Url;
  let ratioLabel = 'Compression non disponible sur ce navigateur';
  try {
    const token = await compressJsonToToken(json);
    if (token) {
      shortUrl = base + 'view.html#z:' + token;
      const ratio = Math.round((1 - (shortUrl.length / b64Url.length)) * 100);
      ratioLabel = `Lien court local (${Math.max(ratio, 0)}% plus court)`;
    }
  } catch (_) {
    ratioLabel = 'Compression indisponible, lien base64 conservé';
  }

  document.getElementById('result-client-name').textContent = '📊 Analyse — ' + data.client.name;
  document.getElementById('result-link-page').textContent = pageUrl;
  document.getElementById('result-link-short').textContent = shortUrl;
  document.getElementById('result-link').textContent = b64Url;
  document.getElementById('result-open-page').href = pageUrl;
  document.getElementById('result-open-short').href = shortUrl;
  document.getElementById('result-open').href = b64Url;
  document.getElementById('result-page-label').textContent = `Dossier #${dossierId} (lien ultra-court)`;
  document.getElementById('result-short-label').textContent = ratioLabel;
  document.getElementById('result-area').style.display = 'block';
  document.getElementById('result-area').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function copyLink(targetId, btn) {
  const txt = document.getElementById(targetId)?.textContent || '';
  if (!txt) return;
  navigator.clipboard.writeText(txt).then(() => {
    const orig = btn.textContent;
    btn.textContent = '✓ COPIÉ';
    setTimeout(() => btn.textContent = orig, 2000);
  });
}

// ——— Tabs ———
function switchTab(tab) {
  document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).style.display = 'block';
  document.getElementById('tab-btn-' + tab).classList.add('active');
  if (tab === 'admins') renderAdminList();
}
