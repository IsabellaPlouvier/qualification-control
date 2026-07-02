// ─── HELPERS ──────────────────────────────────────────────────────────────────
const TODAY = new Date(); TODAY.setHours(0,0,0,0);

function parseDate(str) {
  if (!str) return null;
  const d = new Date(str + 'T00:00:00');
  return isNaN(d) ? null : d;
}
function formatDate(str) {
  const d = parseDate(str);
  if (!d) return '';
  return d.toLocaleDateString('en-GB');
}
function daysUntil(str) {
  const d = parseDate(str);
  if (!d) return null;
  return Math.floor((d - TODAY) / 86400000);
}
function computeStatus(reqDef, empReq) {
  if (!empReq) return 'na';
  if (empReq.status === 'na' || empReq.status === 'not_applicable') return 'na';
  if (reqDef && reqDef.hasExpiry && empReq.expiry) {
    const days = daysUntil(empReq.expiry);
    const alertDays = reqDef.alertDays || DATA.alertWindowDays;
    if (days < 0) return 'expired';
    if (days <= alertDays) return 'expiring';
    return 'ok';
  }
  return empReq.status || 'na';
}
function statusLabel(s) {
  return { ok:'OK', expiring:'Expiring', expired:'Expired', partial:'Partially Compliant',
    missing:'Missing', na:'N/A', not_applicable:'N/A' }[s] || s;
}
function renewalShort(id) {
  const map = { not_requested:'', requested_hr:'Requested',
    scheduled:'Scheduled', waiting_certificate:'Awaiting Cert.', renewed:'Renewed' };
  return map[id] || '';
}
function getInitials(name) {
  return name.split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();
}
function groupLabel(id) {
  const g = DATA.groups.find(x=>x.id===id);
  return g ? g.name : id;
}
function regimeLabel(r) {
  return { offshore:'Offshore', onshore:'Onshore', mixed:'Onshore' }[r] || r;
}
function getEmp(id) { return DATA.employees.find(e=>e.id===id); }
function getReq(id) { return DATA.requirements.find(r=>r.id===id); }
function clientBadgeClass(client) {
  const cl = (client||'').toLowerCase();
  if (cl.includes('constellation')) return 'client-constellation';
  if (cl.includes('foresea')) return 'client-foresea';
  return 'client-default';
}
function sispatBadge(val) {
  const sv = DATA.sispatValues.find(s=>s.id===val);
  const label = sv ? sv.label : val;
  const colorMap = { purple:'sispat-constellation', blue:'sispat-foresea', teal:'sispat-hmh', gray:'sispat-inactive', orange:'sispat-orange', green:'sispat-green' };
  const cls = sv ? (colorMap[sv.color] || 'sispat-default') : 'sispat-default';
  return `<span class="sispat-badge ${cls}">${label||''}</span>`;
}
function genId() { return DATA.nextId ? DATA.nextId++ : Date.now(); }

// ─── MODAL HELPERS ─────────────────────────────────────────────────────────────
window.openModal = function(html, wide, fullscreen) {
  const ov = document.getElementById('modal-overlay');
  const mc = document.getElementById('modal-container');
  mc.className = 'modal-container open' + (wide?' modal-wide':'') + (fullscreen?' modal-fullscreen':'');
  mc.innerHTML = html;
  ov.className = 'modal-overlay open';
  document.addEventListener('keydown', escListener);
};
window.closeModal = function() {
  document.getElementById('modal-overlay').className = 'modal-overlay';
  document.getElementById('modal-container').className = 'modal-container';
  document.removeEventListener('keydown', escListener);
};
function escListener(e) { if (e.key==='Escape') window.closeModal(); }

// ─── CELL POPUP ────────────────────────────────────────────────────────────────
window.closeCellPopup = function() {
  document.getElementById('cell-popup').style.display = 'none';
};
document.addEventListener('click', function(e) {
  const popup = document.getElementById('cell-popup');
  if (popup.style.display !== 'none' && !popup.contains(e.target) && !e.target.closest('.overview-table td')) {
    window.closeCellPopup();
  }
});

window.openCellPopup = function(empId, reqId, cellEl) {
  const emp = getEmp(parseInt(empId));
  const req = getReq(reqId);
  if (!emp || !req) return;
  const empReq = emp.requirements[reqId] || {};
  const popup = document.getElementById('cell-popup');
  const rect = cellEl.getBoundingClientRect();

  let html = `<button class="popup-close" onclick="window.closeCellPopup()">×</button>`;
  html += `<h4>${req.name}</h4>`;

  if (req.hasExpiry) {
    const cur = empReq.expiry || '';
    html += `<input type="date" id="pp-date" value="${cur}" style="margin-bottom:6px">`;
    html += `<input type="text" id="pp-text" placeholder="dd/mm/aaaa" value="${formatDate(cur)}">`;
    html += `<div class="cell-popup-actions">`;
    html += `<button class="btn btn-primary btn-sm" onclick="window.saveCellDate(${empId},'${reqId}')">Save</button>`;
    html += `<button class="btn btn-ghost btn-sm" onclick="window.closeCellPopup()">Cancel</button></div>`;
  } else {
    const cur = empReq.status || 'ok';
    html += `<select id="pp-sel">
      <option value="ok" ${cur==='ok'?'selected':''}>✅ Compliant</option>
      <option value="partial" ${cur==='partial'?'selected':''}>⚠️ Partially Compliant</option>
      <option value="missing" ${cur==='missing'?'selected':''}>❌ Missing</option>
      <option value="na" ${cur==='na'?'selected':''}>— Not Applicable</option>
    </select>`;
    html += `<div class="cell-popup-actions">`;
    html += `<button class="btn btn-primary btn-sm" onclick="window.saveCellStatus(${empId},'${reqId}')">Save</button>`;
    html += `<button class="btn btn-ghost btn-sm" onclick="window.closeCellPopup()">Cancel</button></div>`;
  }

  popup.innerHTML = html;
  popup.style.display = 'block';

  const dateInput = popup.querySelector('#pp-date');
  const textInput = popup.querySelector('#pp-text');
  if (dateInput && textInput) {
    dateInput.addEventListener('change', () => { textInput.value = formatDate(dateInput.value); });
    textInput.addEventListener('blur', () => {
      const parts = textInput.value.split('/');
      if (parts.length===3) {
        const iso = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
        if (!isNaN(new Date(iso))) dateInput.value = iso;
      }
    });
  }

  let top = rect.bottom + window.scrollY + 4;
  let left = rect.left + window.scrollX;
  if (left + 240 > window.innerWidth) left = window.innerWidth - 250;
  if (top + 220 > window.scrollY + window.innerHeight) top = rect.top + window.scrollY - 230;
  popup.style.top = top + 'px';
  popup.style.left = left + 'px';
};

window.saveCellDate = function(empId, reqId) {
  const emp = getEmp(parseInt(empId));
  if (!emp) return;
  const dateInput = document.getElementById('pp-date');
  const val = dateInput ? dateInput.value : '';
  if (!emp.requirements[reqId]) emp.requirements[reqId] = {};
  const prev = emp.requirements[reqId].expiry;
  emp.requirements[reqId].expiry = val;
  emp.requirements[reqId].status = 'ok';
  // If previously had renewal=renewed or any renewal, keep it; new doc means reset to renewed
  if (prev && val && val !== prev) {
    emp.requirements[reqId].renewal = 'renewed';
  }
  window.closeCellPopup();
  checkDrakeAutoUpdate(parseInt(empId), reqId, prev, val);
  const { view } = getView();
  if (view === 'overview') renderAndMount();
  else if (view === 'alerts') document.getElementById('app-main').innerHTML = renderAlerts();
};

window.saveCellStatus = function(empId, reqId) {
  const emp = getEmp(parseInt(empId));
  if (!emp) return;
  const sel = document.getElementById('pp-sel');
  const val = sel ? sel.value : 'ok';
  if (!emp.requirements[reqId]) emp.requirements[reqId] = {};
  emp.requirements[reqId].status = val;
  window.closeCellPopup();
  const { view } = getView();
  if (view === 'overview') renderAndMount();
  else if (view === 'alerts') document.getElementById('app-main').innerHTML = renderAlerts();
};

// When a date is updated in the overview, mark drake items as "renewed" instead of adding a new pending
function checkDrakeAutoUpdate(empId, reqId, prevExpiry, newExpiry) {
  DATA.drakeRequisitions.forEach(req => {
    if (!req.employees.includes(empId) || !req.requiredDocs.includes(reqId)) return;
    // Update existing pending or add with renewed marker
    const existing = req.pendingUpdates.find(p => p.empId === empId && p.reqId === reqId);
    if (existing) {
      existing.newExpiry = newExpiry;
    }
    // No new pending needed — getDrakeAlertItems will pick it up automatically via status
  });
}

// ─── ROUTING ──────────────────────────────────────────────────────────────────
function getView() {
  const hash = location.hash.replace('#','');
  if (hash.startsWith('employee/')) return { view:'employee', id:parseInt(hash.split('/')[1]) };
  if (hash.startsWith('drake/')) return { view:'drake-detail', id: hash.split('/')[1] };
  if (hash==='alerts') return { view:'alerts' };
  if (hash==='hmh') return { view:'hmh' };
  if (hash==='personnel') return { view:'personnel' };
  if (hash==='drake') return { view:'drake' };
  return { view:'overview' };
}
window.navigate = function(hash) { location.hash = hash; };

window.addEventListener('hashchange', renderAndMount);

function updateNav(view) {
  document.querySelectorAll('nav a').forEach(a => {
    const h = a.dataset.hash;
    const active = h === view || (h==='drake' && view==='drake-detail') || (h==='overview' && view==='employee');
    a.classList.toggle('active', active);
  });
}

function renderAndMount() {
  const { view, id } = getView();
  updateNav(view);
  const main = document.getElementById('app-main');
  window.closeCellPopup();
  if (view==='overview')      main.innerHTML = renderOverview();
  else if (view==='alerts')   main.innerHTML = renderAlerts();
  else if (view==='hmh')      main.innerHTML = renderHMH();
  else if (view==='drake')    main.innerHTML = renderDrake();
  else if (view==='drake-detail') main.innerHTML = renderDrakeDetail(id);
  else if (view==='employee') main.innerHTML = renderEmployee(id);
  else if (view==='personnel') main.innerHTML = renderPersonnel();
}

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────
function renderOverview() {
  const discFilter  = document.getElementById('filter-disc')?.value  || 'all';
  const groupFilter = document.getElementById('filter-group')?.value || 'all';

  let html = `<div class="page-title">
    <span>📋</span> Area Overview
    <div class="page-title-actions">
      <button class="btn btn-ghost" onclick="window.openInactiveModal()">👁 View Inactive</button>
      <button class="btn btn-ghost" onclick="window.openManageReqs()">⚙️ Manage Requirements</button>
    </div>
  </div>`;

  html += `<div class="filters-bar">
    <label>Discipline</label>
    <select id="filter-disc" onchange="window.applyOverviewFilters()">
      <option value="all" ${discFilter==='all'?'selected':''}>All</option>
      <option value="mec" ${discFilter==='mec'?'selected':''}>Mechanical</option>
      <option value="ele" ${discFilter==='ele'?'selected':''}>Electrical</option>
    </select>
    <label style="margin-left:8px">Group</label>
    <select id="filter-group" onchange="window.applyOverviewFilters()">
      <option value="all" ${groupFilter==='all'?'selected':''}>All</option>
      ${DATA.groups.map(g=>`<option value="${g.id}" ${groupFilter===g.id?'selected':''}>${g.name}</option>`).join('')}
    </select>
  </div>`;

  const groups = DATA.groups.filter(g => groupFilter==='all' || g.id===groupFilter);
  for (const group of groups) {
    let emps = DATA.employees.filter(e => e.group===group.id && e.active !== false);
    if (discFilter!=='all') emps = emps.filter(e => e.discipline===discFilter);
    emps.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    if (emps.length===0) continue;

    // ── Dynamic columns: only reqs where at least one emp has status != na ──
    const allReqIds = [];
    for (const emp of emps) {
      for (const rid of Object.keys(emp.requirements)) {
        if (!allReqIds.includes(rid)) allReqIds.push(rid);
      }
    }
    const visibleReqs = allReqIds
      .map(id => getReq(id))
      .filter(req => {
        if (!req) return false;
        return emps.some(emp => {
          const er = emp.requirements[req.id];
          if (!er) return false;
          return er.status !== 'na' && er.status !== 'not_applicable';
        });
      });

    const expanded = (window._expandedGroups||{})[group.id] !== false;

    html += `<div class="group-section${expanded?' expanded':''}" id="grp-${group.id}">`;
    html += `<div class="group-header" onclick="window.toggleGroup('${group.id}')">
      <span class="group-arrow">▶</span>
      <span class="group-name">${group.name}</span>
      <span class="group-badge">${regimeLabel(group.regime)}</span>
      <span class="group-count">${emps.length} employee${emps.length!==1?'s':''}</span>
      <button class="btn-ampliar" onclick="event.stopPropagation();window.openFullscreen('${group.id}',this)">⛶ Fullscreen</button>
    </div>`;
    html += `<div class="group-body">`;
    html += renderGroupTable(emps, visibleReqs, group.id);
    html += `</div></div>`;
  }
  return html;
}

function renderGroupTable(emps, reqs, groupId) {
  let html = `<div class="table-wrapper"><table class="overview-table">`;
  html += `<thead><tr><th class="col-name">Employee</th>`;
  for (const req of reqs) html += `<th title="${req.name}">${req.shortName}</th>`;
  html += `<th>Actions</th></tr></thead><tbody>`;

  for (const emp of emps) {
    html += `<tr>`;
    html += `<td class="col-name"><a class="employee-link" href="#employee/${emp.id}">${emp.name}
      <span class="disc-badge disc-${emp.discipline}">${emp.discipline.toUpperCase()}</span></a></td>`;
    for (const req of reqs) {
      const empReq = emp.requirements[req.id];
      if (!empReq) {
        html += `<td class="cell-na" onclick="window.openCellPopup(${emp.id},'${req.id}',this)"><div class="cell-content"><span class="cell-text">N/A</span></div></td>`;
        continue;
      }
      const status = computeStatus(req, empReq);
      let inner = '';
      if (req.hasExpiry && empReq.expiry) {
        inner = `<span class="cell-date">${formatDate(empReq.expiry)}</span>`;
      } else {
        inner = `<span class="cell-text">${statusLabel(status)}</span>`;
      }
      if (empReq.renewal && empReq.renewal !== 'not_requested') {
        inner += `<span class="cell-renewal">${renewalShort(empReq.renewal)}</span>`;
      }
      html += `<td class="cell-${status}" onclick="window.openCellPopup(${emp.id},'${req.id}',this)"><div class="cell-content">${inner}</div></td>`;
    }
    html += `<td style="white-space:nowrap">
      <button class="btn-icon" title="Delete employee" onclick="window.deleteEmp(${emp.id})">🗑</button>
    </td>`;
    html += `</tr>`;
  }
  html += `</tbody></table></div>`;
  return html;
}

window.toggleGroup = function(groupId) {
  if (!window._expandedGroups) window._expandedGroups = {};
  const el = document.getElementById('grp-' + groupId);
  if (!el) return;
  const isExp = el.classList.contains('expanded');
  window._expandedGroups[groupId] = !isExp;
  el.classList.toggle('expanded', !isExp);
};

window.openFullscreen = function(groupId) {
  const group = DATA.groups.find(g=>g.id===groupId);
  let emps = DATA.employees.filter(e=>e.group===groupId && e.active !== false);

  const allReqIds = [];
  for (const emp of emps) for (const rid of Object.keys(emp.requirements)) if (!allReqIds.includes(rid)) allReqIds.push(rid);
  const visibleReqs = allReqIds
    .map(id => getReq(id))
    .filter(req => {
      if (!req) return false;
      return emps.some(emp => {
        const er = emp.requirements[req.id];
        if (!er) return false;
        return er.status !== 'na' && er.status !== 'not_applicable';
      });
    });

  const tableHtml = renderGroupTable(emps, visibleReqs, groupId);
  const html = `<div class="modal-header">
    <h3>⛶ ${group?.name || groupId}</h3>
    <button class="modal-close" onclick="window.closeModal()">×</button>
  </div>
  <div class="modal-body fullscreen-table-body">${tableHtml}</div>`;
  window.openModal(html, false, true);
};

window.applyOverviewFilters = function() { renderAndMount(); };

window.deleteEmp = function(empId) {
  const emp = getEmp(empId);
  if (!emp) return;
  if (!confirm(`Are you sure you want to delete "${emp.name}"? This action cannot be undone.`)) return;
  DATA.employees = DATA.employees.filter(e=>e.id!==empId);
  renderAndMount();
};

window.toggleEmployeeActive = function(empId, isActive) {
  const emp = getEmp(empId);
  if (!emp) return;
  emp.active = !!isActive;
  const { view } = getView();
  if (view === 'alerts') {
    document.getElementById('app-main').innerHTML = renderAlerts();
    return;
  }
  renderAndMount();
};

window.openAddEmpModal = function() {
  const html = `<div class="modal-header"><h3>➕ Add Employee</h3>
    <button class="modal-close" onclick="window.closeModal()">×</button></div>
  <div class="modal-body">
    <div class="form-group"><label>Full name *</label><input type="text" id="ae-name" placeholder="Employee name"></div>
    <div class="form-row">
      <div class="form-group"><label>Group *</label><select id="ae-group">
        ${DATA.groups.map(g=>`<option value="${g.id}">${g.name}</option>`).join('')}
      </select></div>
      <div class="form-group"><label>Discipline *</label><select id="ae-disc">
        <option value="ele">Electrical</option><option value="mec">Mechanical</option>
      </select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Regime</label><select id="ae-regime">
        <option value="offshore">Offshore</option><option value="onshore">Onshore</option>
      </select></div>
      <div class="form-group"><label>Country</label><input type="text" id="ae-country" value="BR" placeholder="BR"></div>
    </div>
    <div class="form-group"><label>Email</label><input type="text" id="ae-email" placeholder="name@company.com"></div>
    <div class="form-group"><label>Position</label><input type="text" id="ae-funcao" placeholder="Role"></div>
    <div class="form-group"><label>CPF / Passport</label><input type="text" id="ae-cpfPassport" placeholder="000.000.000-00 or passport"></div>
    <div class="form-group"><label>Sispat Status</label><select id="ae-sispat">
      ${DATA.sispatValues.map(s=>`<option value="${s.id}">${s.label}</option>`).join('')}
    </select></div>
  </div>
  <div class="modal-footer">
    <button class="btn btn-ghost" onclick="window.closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="window.saveNewEmp()">Add Employee</button>
  </div>`;
  window.openModal(html);
};

window.saveNewEmp = function() {
  const name = document.getElementById('ae-name').value.trim();
  if (!name) { alert('Please enter a name.'); return; }
  const newEmp = {
    id: genId(), name,
    group: document.getElementById('ae-group').value,
    discipline: document.getElementById('ae-disc').value,
    regime: document.getElementById('ae-regime').value,
    country: document.getElementById('ae-country').value || 'BR',
    email: document.getElementById('ae-email').value,
    funcao: document.getElementById('ae-funcao').value,
    cpfPassport: document.getElementById('ae-cpfPassport').value,
    sispat: document.getElementById('ae-sispat').value,
    active: true,
    idSispat: '', birthDate: '', hiringDate: '', rg: '',
    requirements: {}
  };
  DATA.employees.push(newEmp);
  window.closeModal();
  renderAndMount();
};

window.openManageReqs = function() {
  let html = `<div class="modal-header"><h3>⚙️ Manage Requirements</h3>
    <button class="modal-close" onclick="window.closeModal()">×</button></div>
  <div class="modal-body">
    <table class="alerts-table" style="margin-bottom:20px">
      <thead><tr><th>Name</th><th>Short Name</th><th>Category</th><th>Type</th><th></th></tr></thead><tbody>`;
  for (const req of DATA.requirements) {
    html += `<tr><td>${req.name}</td><td>${req.shortName}</td>
      <td>${DATA.categoryLabels[req.category]||req.category}</td>
        <td>${req.hasExpiry?'With Expiry':'Checklist'}</td>
      <td><button class="btn btn-danger btn-sm" onclick="window.deleteReq('${req.id}')">Delete</button></td></tr>`;
  }
  html += `</tbody></table>
    <h4 style="margin-bottom:12px;color:var(--navy)">➕ Add Requirement</h4>
    <div class="form-row">
      <div class="form-group"><label>Name *</label><input type="text" id="nr-name" placeholder="Full name"></div>
      <div class="form-group"><label>Short Name *</label><input type="text" id="nr-short" placeholder="e.g. NR-35"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Category</label><select id="nr-cat">
        ${Object.entries(DATA.categoryLabels).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}
      </select></div>
      <div class="form-group"><label>Has Expiry?</label><select id="nr-expiry">
        <option value="yes">Yes</option><option value="no">No</option>
      </select></div>
    </div>
    <div class="form-group"><label>Alert window (days)</label><input type="number" id="nr-alert" value="90" min="0"></div>
  </div>
  <div class="modal-footer">
    <button class="btn btn-ghost" onclick="window.closeModal()">Close</button>
    <button class="btn btn-primary" onclick="window.saveNewReq()">Add Requirement</button>
  </div>`;
  window.openModal(html, true);
};

window.deleteReq = function(reqId) {
  if (!confirm('Are you sure you want to delete this requirement? It will be removed from all employees.')) return;
  DATA.requirements = DATA.requirements.filter(r=>r.id!==reqId);
  DATA.employees.forEach(e => { delete e.requirements[reqId]; });
  window.closeModal();
  renderAndMount();
};

window.saveNewReq = function() {
  const name = document.getElementById('nr-name').value.trim();
  const shortName = document.getElementById('nr-short').value.trim();
  if (!name||!shortName) { alert('Please enter a name and a short name.'); return; }
  const id = name.toLowerCase().replace(/[^a-z0-9]/g,'_');
  DATA.requirements.push({
    id, name, shortName,
    category: document.getElementById('nr-cat').value,
    hasExpiry: document.getElementById('nr-expiry').value==='yes',
    alertDays: parseInt(document.getElementById('nr-alert').value)||90,
    type: 'recorrente'
  });
  window.closeModal();
  renderAndMount();
};

// ─── ALERTS TAB ───────────────────────────────────────────────────────────────
function renderAlerts() {
  const fEmp   = (document.getElementById('af-emp')  ?.value||'').toLowerCase();
  const fGroup =  document.getElementById('af-group') ?.value||'all';
  const fReq   = (document.getElementById('af-req')  ?.value||'').toLowerCase();
  const fCat   =  document.getElementById('af-cat')  ?.value||'all';
  const fStat  =  document.getElementById('af-stat') ?.value||'all';
  const fRen   =  document.getElementById('af-ren')  ?.value||'all';

  let items = [];
  for (const emp of DATA.employees) {
    if (emp.active === false) continue;
    for (const req of DATA.requirements) {
      const empReq = emp.requirements[req.id];
      if (!empReq) continue;
      const status = computeStatus(req, empReq);
      const days = req.hasExpiry && empReq.expiry ? daysUntil(empReq.expiry) : null;
      const alertDays = req.alertDays || DATA.alertWindowDays;

      let include = false;
      if (status==='expired') include = true;
      else if (status==='expiring' && days!==null && days<=alertDays) include = true;
      else if (['partial','missing'].includes(status)) include = true;
      else if (empReq.renewal && empReq.renewal!=='not_requested') include = true;
      if (!include) continue;

      if (fEmp && !emp.name.toLowerCase().includes(fEmp)) continue;
      if (fGroup!=='all' && emp.group!==fGroup) continue;
      if (fReq && !req.name.toLowerCase().includes(fReq)) continue;
      if (fCat!=='all' && req.category!==fCat) continue;
      if (fStat!=='all' && status!==fStat) continue;
      if (fRen!=='all' && (empReq.renewal||'not_requested')!==fRen) continue;

      items.push({ emp, req, empReq, status, days });
    }
  }

  // Also include HMH documents in alerts
  for (const doc of (DATA.hmhDocuments||[])) {
    const days = doc.expiry ? daysUntil(doc.expiry) : null;
    if (days === null) continue;
    const alertDays = doc.alertDays || 90;
    let status = 'ok';
    if (days < 0) status = 'expired';
    else if (days <= alertDays) status = 'expiring';
    if (!['expired','expiring'].includes(status)) continue;
    items.push({ isHmh: true, doc, status, days });
  }

  const order = { expired:0, missing:1, expiring:2, partial:3 };
  items.sort((a,b) => {
    const oa = order[a.status]??4, ob = order[b.status]??4;
    if (oa!==ob) return oa-ob;
    if (a.days!==null && b.days!==null) return a.days-b.days;
    return 0;
  });

  let html = `<div class="page-title"><span>🔔</span> Alerts</div>`;
  html += `<div class="alerts-table-wrapper"><table class="alerts-table"><thead>`;
  html += `<tr>
    <th>Employee</th><th>Group</th><th>Requirement</th>
    <th>Category</th><th>Status</th><th>Renewal Status</th>
  </tr>`;
  html += `<tr class="filter-row">
    <td><input id="af-emp" placeholder="Filter" value="${fEmp}" oninput="window.applyAlertFilters()"></td>
    <td><select id="af-group" onchange="window.applyAlertFilters()">
      <option value="all">All</option>
      ${DATA.groups.map(g=>`<option value="${g.id}" ${fGroup===g.id?'selected':''}>${g.name}</option>`).join('')}
    </select></td>
    <td><input id="af-req" placeholder="Filter" value="${fReq}" oninput="window.applyAlertFilters()"></td>
    <td><select id="af-cat" onchange="window.applyAlertFilters()">
      <option value="all">All</option>
      ${Object.entries(DATA.categoryLabels).map(([k,v])=>`<option value="${k}" ${fCat===k?'selected':''}>${v}</option>`).join('')}
    </select></td>
    <td><select id="af-stat" onchange="window.applyAlertFilters()">
      <option value="all">All</option>
      <option value="expired" ${fStat==='expired'?'selected':''}>Expired</option>
      <option value="expiring" ${fStat==='expiring'?'selected':''}>Expiring</option>
      <option value="partial" ${fStat==='partial'?'selected':''}>Partially Compliant</option>
      <option value="missing" ${fStat==='missing'?'selected':''}>Missing</option>
    </select></td>
    <td><select id="af-ren" onchange="window.applyAlertFilters()">
      <option value="all">All</option>
      ${DATA.renewalStatuses.map(r=>`<option value="${r.id}" ${fRen===r.id?'selected':''}>${r.label}</option>`).join('')}
    </select></td>
  </tr>`;
  html += `</thead><tbody>`;

  if (!items.length) {
    html += `<tr><td colspan="6" style="text-align:center;padding:40px;color:#94a3b8">✅ No alerts found for the selected filters.</td></tr>`;
  }

  for (const item of items) {
    if (item.isHmh) {
      const rowCls = item.status==='expired' ? 'row-expired' : 'row-expiring';
      html += `<tr class="${rowCls}">
        <td>🏢 HMH</td><td>—</td>
        <td>${item.doc.name}</td>
        <td><span class="cat-pill">HMH</span></td>
        <td><span class="status-badge badge-${item.status}">${statusLabel(item.status)}</span></td>
        <td>—</td>
      </tr>`;
      continue;
    }
    const rowCls = ['expired','missing'].includes(item.status) ? 'row-expired' : ['expiring','partial'].includes(item.status) ? 'row-expiring' : '';
    const cur = item.empReq.renewal || 'not_requested';
    html += `<tr class="${rowCls}">
      <td><a class="emp-link-alert" href="#employee/${item.emp.id}">${item.emp.name}</a></td>
      <td>${groupLabel(item.emp.group)}</td>
      <td>${item.req.name}</td>
      <td><span class="cat-pill">${DATA.categoryLabels[item.req.category]||item.req.category}</span></td>
      <td><span class="status-badge badge-${item.status}">${statusLabel(item.status)}</span></td>
      <td><select class="renewal-select" data-emp="${item.emp.id}" data-req="${item.req.id}" onchange="window.updateRenewal(this)">
        ${DATA.renewalStatuses.map(rs=>`<option value="${rs.id}" ${cur===rs.id?'selected':''}>${rs.label}</option>`).join('')}
      </select></td>
    </tr>`;
  }
  html += `</tbody></table></div>`;
  return html;
}

window.applyAlertFilters = function() {
  document.getElementById('app-main').innerHTML = renderAlerts();
};

window.updateRenewal = function(sel) {
  const emp = getEmp(parseInt(sel.dataset.emp));
  if (!emp || !emp.requirements[sel.dataset.req]) return;
  emp.requirements[sel.dataset.req].renewal = sel.value;
};

// ─── EMPLOYEE CARD ─────────────────────────────────────────────────────────────
function renderEmployee(id) {
  const emp = getEmp(id);
  if (!emp) return `<p>Employee not found.</p>`;
  const group = DATA.groups.find(g=>g.id===emp.group);
  const initials = getInitials(emp.name);
  const sv = DATA.sispatValues.find(s=>s.id===emp.sispat);

  let html = `<button class="card-back-btn" onclick="history.back()">← Back to Overview</button>`;
  html += `<div class="employee-card"><div class="card-header">
    <div class="card-avatar">${initials}</div>
    <div class="card-header-info">
      <h2>${emp.name}</h2>
      <div class="card-meta">
        <span class="card-meta-tag">${group?.name||emp.group}</span>
        <span class="card-meta-tag">${emp.discipline==='mec'?'Mechanical':'Electrical'}</span>
        <span class="card-meta-tag">${regimeLabel(emp.regime)}</span>
        ${emp.country&&emp.country!=='BR'?`<span class="card-meta-tag">🌍 ${emp.country}</span>`:''}
      </div>
      <div class="card-meta" style="margin-top:6px">
        ${emp.funcao?`<span class="card-meta-tag info">💼 ${emp.funcao}</span>`:''}
        ${(emp.cpfPassport || emp.cpf)?`<span class="card-meta-tag info">📋 CPF / Passport: ${emp.cpfPassport || emp.cpf}</span>`:''}
        ${emp.email?`<span class="card-meta-tag info">✉️ ${emp.email}</span>`:''}
        ${emp.sispat?`<span class="card-meta-tag info">🏷️ Sispat: ${sv?.label||emp.sispat}</span>`:''}
        ${emp.rg?`<span class="card-meta-tag info">🪪 RG: ${emp.rg}</span>`:''}
      </div>
    </div>
  </div><div class="card-body">`;

  const cats = ['personal','employment','training','health','customer'];
  for (const cat of cats) {
    const reqs = DATA.requirements.filter(r=>r.category===cat);
    const applicable = reqs.filter(r=>emp.requirements[r.id] && emp.requirements[r.id].status!=='na');
    if (!applicable.length) continue;
    html += `<div class="card-category"><div class="card-category-title">${DATA.categoryIcons[cat]} ${DATA.categoryLabels[cat]}</div>`;
    for (const req of applicable) {
      const empReq = emp.requirements[req.id];
      if (!empReq) continue;
      const status = computeStatus(req, empReq);
      const needsRenewal = ['expiring','expired'].includes(status);
      const cur = empReq.renewal || 'not_requested';
      html += `<div class="req-row">
        <span class="req-name">${req.name}</span>
        <span class="status-badge badge-${status}">${statusLabel(status)}</span>
        <span class="req-expiry">${req.hasExpiry&&empReq.expiry?formatDate(empReq.expiry):''}</span>`;
      if (needsRenewal||empReq.renewal) {
        html += `<select class="renewal-select" data-emp="${emp.id}" data-req="${req.id}" onchange="window.updateRenewal(this)">
          ${DATA.renewalStatuses.map(rs=>`<option value="${rs.id}" ${cur===rs.id?'selected':''}>${rs.label}</option>`).join('')}
        </select>`;
        if (cur==='scheduled') {
          html += `<input type="date" class="scheduled-date-input" value="${empReq.scheduledDate||''}"
            onchange="window.updateScheduledDate(${emp.id},'${req.id}',this.value)" title="Select scheduled date">`;
        }
      }
      html += `</div>`;
    }
    html += `</div>`;
  }
  html += `</div></div>`;
  return html;
}

window.updateScheduledDate = function(empId, reqId, val) {
  const emp = getEmp(empId);
  if (emp && emp.requirements[reqId]) emp.requirements[reqId].scheduledDate = val;
};

// ─── INIT ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  window._expandedGroups = {};
  DATA.groups.forEach(g => { window._expandedGroups[g.id] = true; });
  renderAndMount();
});
