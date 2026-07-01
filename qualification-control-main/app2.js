// ─── DRAKE HELPERS ────────────────────────────────────────────────────────────
function getDrakeAlertItems(req) {
  // Returns all alert items for this req: expired/expiring/partial/missing for emp+doc combos
  // Also items with renewal=renewed that are still tracked
  const items = [];
  const seen = new Set();

  for (const empId of req.employees) {
    const emp = getEmp(empId);
    if (!emp) continue;
    if (emp.active === false) continue;

    for (const reqId of req.requiredDocs) {
      const key = empId + '|' + reqId;
      if (seen.has(key)) continue;
      seen.add(key);

      const reqDef = getReq(reqId);
      const empReq = emp.requirements[reqId];
      if (!empReq) continue;

      const status = computeStatus(reqDef, empReq);
      const days = reqDef && reqDef.hasExpiry && empReq.expiry ? daysUntil(empReq.expiry) : null;
      const alertDays = (reqDef && reqDef.alertDays) || DATA.alertWindowDays;
      const renewal = empReq.renewal || 'not_requested';

      // Include if: alert status OR renewal=renewed (already renewed but not checked in drake)
      const isAlert = ['expired','expiring','partial','missing'].includes(status);
      const isRenewed = renewal === 'renewed';

      if (!isAlert && !isRenewed) continue;

      // Check if already in pendingUpdates
      const pending = req.pendingUpdates.find(p => p.empId === empId && p.reqId === reqId);

      items.push({
        empId, reqId, emp, reqDef, empReq, status, days, renewal, pending: pending || null
      });
    }
  }

  // Also include HMH docs
  for (const hmhId of (req.hmhDocs || [])) {
    const doc = (DATA.hmhDocuments || []).find(d => d.id === hmhId);
    if (!doc) continue;
    const days = doc.expiry ? daysUntil(doc.expiry) : null;
    let status = 'ok';
    if (days !== null) {
        for (const item of alertItems) {
      else if (days <= (doc.alertDays || 90)) status = 'expiring';
    }
    if (!['expired','expiring'].includes(status)) continue;
    items.push({ empId: 'hmh', reqId: hmhId, emp: null, reqDef: null, hmhDoc: doc, status, days, renewal: null, pending: null });
  }

  // Sort: expired first, then expiring, then by days
  const order = { expired:0, missing:1, expiring:2, partial:3, renewed:4 };
  items.sort((a,b) => {
    const oa = order[a.status] ?? 5, ob = order[b.status] ?? 5;
    if (oa !== ob) return oa - ob;
    if (a.days !== null && b.days !== null) return a.days - b.days;
    return 0;
  });

  return items;
}

function getDrakeCutoff(req) {
  const items = getDrakeAlertItems(req);
  const withExpiry = items.filter(i => i.days !== null && i.status !== 'renewed');
  if (!withExpiry.length) return null;
  const minDays = Math.min(...withExpiry.map(i => i.days));
  const cutoffDate = new Date(TODAY);
  cutoffDate.setDate(cutoffDate.getDate() + minDays - 30);
  return cutoffDate;
}

function renewalBadge(renewal) {
  const colors = {
    not_requested: '#e2e8f0|#475569',
    requested_hr: '#dbeafe|#1d4ed8',
    scheduled: '#fef9c3|#713f12',
    waiting_certificate: '#ffedd5|#7c2d12',
    renewed: '#dcfce7|#15803d'
  };
  const [bg, color] = (colors[renewal] || '#e2e8f0|#475569').split('|');
  const rs = DATA.renewalStatuses.find(r => r.id === renewal);
  const label = rs ? rs.label : renewal;
  return `<span style="background:${bg};color:${color};font-size:11px;font-weight:700;padding:2px 9px;border-radius:99px;white-space:nowrap">${label}</span>`;
}

// ─── DRAKE LIST ───────────────────────────────────────────────────────────────
function renderDrake() {
  const reqs = DATA.drakeRequisitions || [];
  let html = `<div class="page-title">
    <span>🚢</span> Drake Requisitions
    <div class="page-title-actions">
      <button class="btn btn-primary" onclick="window.openAddDrakeModal()">➕ New Requisition</button>
    </div>
  </div>`;

  if (!reqs.length) {
    html += `<div class="empty-state"><div class="empty-icon">🚢</div><p>No requisitions created yet.</p></div>`;
    return html;
  }

  html += `<div class="drake-grid">`;
  for (const req of reqs) {
    const alertItems = getDrakeAlertItems(req);
    const cutoff = getDrakeCutoff(req);
    const badgeCls = clientBadgeClass(req.client);
    const alertCount = alertItems.length;

    html += `<div class="drake-card" onclick="window.navigate('drake/${req.id}')">
      <div class="drake-card-title">${req.name}</div>
      <div class="drake-card-meta">
        <span class="client-badge ${badgeCls}">${req.client}</span>
        <span class="${alertCount > 0 ? 'pending-count-badge' : 'pending-count-badge zero'}">${alertCount} alert${alertCount !== 1 ? 's' : ''}</span>
      </div>
      <div class="drake-card-stats">
        <div class="drake-stat">
          <span class="drake-stat-number">${req.employees.length}</span>
          <span class="drake-stat-label">Employees</span>
        </div>
        <div class="drake-stat">
          <span class="drake-stat-number">${req.requiredDocs.length + (req.hmhDocs||[]).length}</span>
          <span class="drake-stat-label">Required docs</span>
        </div>
      </div>
      ${cutoff ? `<div class="drake-cutoff">Cutoff date: <strong>${cutoff.toLocaleDateString('en-GB')}</strong></div>`
               : '<div class="drake-cutoff" style="color:#94a3b8">No expiry alerts</div>'}
    </div>`;
  }
  html += `</div>`;
  return html;
}

// ─── DRAKE DETAIL ─────────────────────────────────────────────────────────────
function renderDrakeDetail(reqId) {
  const req = DATA.drakeRequisitions.find(r => r.id === reqId);
  if (!req) return `<button class="card-back-btn" onclick="window.navigate('drake')">← Back</button><p>Requisition not found.</p>`;

  const cutoff = getDrakeCutoff(req);
  const badgeCls = clientBadgeClass(req.client);
  const alertItems = getDrakeAlertItems(req);
  const history = req.history || [];

  let html = `<button class="card-back-btn" onclick="window.navigate('drake')">← Back to Requisitions</button>`;

  html += `<div class="drake-detail-header">
    <div class="drake-detail-title">🚢 ${req.name}</div>
    <span class="client-badge ${badgeCls}">${req.client}</span>
    <div class="cutoff-box">Cutoff date: <strong>${cutoff ? cutoff.toLocaleDateString('en-GB') : '—'}</strong></div>
    <button class="btn btn-ghost btn-sm" onclick="window.openManageEmpsDrake('${reqId}')">👥 Manage employees</button>
    <button class="btn btn-ghost btn-sm" onclick="window.openAddAlertManual('${reqId}')">➕ Add manually</button>
  </div>`;

  // ── Alert list ──
  html += `<div class="section-card" style="margin-bottom:16px">
    <div class="section-card-header">
      <span class="section-card-title">🔔 Requisition Alerts (${alertItems.length})</span>
    </div>
    <div class="table-wrapper"><table class="drake-pending-table"><thead><tr>
      <th>Employee</th><th>Document</th>
      <th>Current expiry</th><th style="color:#16a34a;font-weight:700">New expiry</th>
      <th>Doc status</th><th>Renewal status</th><th style="text-align:center">✓</th><th></th>
    </tr></thead><tbody>`;

  if (!alertItems.length) {
    html += `<tr><td colspan="8" style="text-align:center;padding:30px;color:#94a3b8">✅ No alerts for this requisition.</td></tr>`;
  }

  for (const item of alertItems) {
    const empName = item.hmhDoc ? '🏢 HMH' : (item.emp ? `<a class="emp-link-alert" href="#employee/${item.empId}">${item.emp.name}</a>` : item.empId);
    const docName = item.hmhDoc ? item.hmhDoc.name : (item.reqDef ? item.reqDef.name : item.reqId);
    const prevExpiry = item.empReq ? (item.empReq.expiry ? `<span style="color:#94a3b8;text-decoration:line-through;font-size:11px">${formatDate(item.empReq.expiry)}</span>` : '—') : (item.hmhDoc ? formatDate(item.hmhDoc.expiry) : '—');

    // new expiry from pendingUpdates or empReq if renewed
    let newExpiry = '—';
    if (item.pending && item.pending.newExpiry) {
      newExpiry = `<strong style="color:#16a34a">${formatDate(item.pending.newExpiry)}</strong>`;
    } else if (item.renewal === 'renewed' && item.empReq && item.empReq.expiry) {
      newExpiry = `<strong style="color:#16a34a">${formatDate(item.empReq.expiry)}</strong>`;
    }

    const statusBadge = `<span class="status-badge badge-${item.status}">${statusLabel(item.status)}</span>`;
    const renewalBadgeHtml = item.renewal ? renewalBadge(item.renewal) : '—';

    const empKey = item.empId === 'hmh' ? 'hmh' : item.empId;
    html += `<tr>
      <td>${empName}</td>
      <td style="font-weight:500">${docName}</td>
      <td>${prevExpiry}</td>
      <td>${newExpiry}</td>
      <td>${statusBadge}</td>
      <td>${renewalBadgeHtml}</td>
      <td style="text-align:center">
        <button class="btn btn-ghost btn-sm" title="Marcar como enviado ao Drake" 
          onclick="window.checkDrakeItem('${reqId}','${empKey}','${item.reqId}')">✅</button>
      </td>
      <td>
        <button class="btn-icon" title="Remove alert" 
          onclick="window.removeDrakeAlert('${reqId}','${empKey}','${item.reqId}')">🗑</button>
      </td>
    </tr>`;
  }

  html += `</tbody></table></div></div>`;

  // ── History ──
  html += `<div class="section-card">
    <div class="section-card-header">
      <button class="history-toggle" onclick="window.toggleHistory(this)">▶ History (${history.length})</button>
    </div>
    <div class="history-body" style="display:none">
    <div class="table-wrapper"><table class="drake-pending-table"><thead><tr>
      <th>Employee</th><th>Document</th><th>New expiry</th><th>Added on</th><th>Sent on</th><th>Comment</th>
    </tr></thead><tbody>`;

  if (!history.length) {
    html += `<tr><td colspan="6" style="text-align:center;padding:20px;color:#94a3b8">No history yet.</td></tr>`;
  }
  for (const h of history) {
    const hEmp = getEmp(h.empId);
    const hReq = getReq(h.reqId);
    html += `<tr>
      <td>${hEmp ? hEmp.name : (h.empId === 'hmh' ? '🏢 HMH' : h.empId)}</td>
      <td>${hReq ? hReq.name : h.reqId}</td>
      <td>${h.newExpiry ? formatDate(h.newExpiry) : '—'}</td>
      <td>${h.addedAt ? formatDate(h.addedAt) : '—'}</td>
      <td>${h.checkedAt ? formatDate(h.checkedAt) : '—'}</td>
      <td>
        <input type="text" value="${h.comment || ''}" placeholder="Add comment..."
          style="font-family:Inter,sans-serif;font-size:12px;padding:3px 7px;border:1px solid #e2e8f0;border-radius:4px;width:200px;outline:none"
          onchange="window.updateHistoryComment('${reqId}','${h.id}',this.value)">
      </td>
    </tr>`;
  }
  html += `</tbody></table></div></div></div>`;
  return html;
}

window.toggleHistory = function(btn) {
  const body = btn.closest('.section-card').querySelector('.history-body');
  if (!body) return;
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : 'block';
  const total = (btn.textContent.match(/\((\d+)\)$/) || [])[1] || '0';
  btn.textContent = `${isOpen ? '▶' : '▼'} History (${total})`;
};

window.updateHistoryComment = function(reqId, histId, val) {
  const req = DATA.drakeRequisitions.find(r => r.id === reqId);
  if (!req) return;
  const h = req.history.find(x => x.id === histId);
  if (h) h.comment = val;
};

window.checkDrakeItem = function(reqId, empId, docReqId) {
  const req = DATA.drakeRequisitions.find(r => r.id === reqId);
  if (!req) return;
  const empIdParsed = empId === 'hmh' ? 'hmh' : parseInt(empId);

  // Get new expiry
  let newExpiry = null;
  if (empIdParsed !== 'hmh') {
    const emp = getEmp(empIdParsed);
    if (emp && emp.requirements[docReqId]) newExpiry = emp.requirements[docReqId].expiry || null;
  } else {
    const doc = (DATA.hmhDocuments || []).find(d => d.id === docReqId);
    if (doc) newExpiry = doc.expiry || null;
  }

  req.history.push({
    id: 'h' + Date.now(),
    empId: empIdParsed,
    reqId: docReqId,
    prevExpiry: null,
    newExpiry,
    addedAt: new Date().toISOString().split('T')[0],
    checkedAt: new Date().toISOString().split('T')[0],
    comment: ''
  });

  // Remove from pendingUpdates if existed
  req.pendingUpdates = req.pendingUpdates.filter(p => !(p.empId === empIdParsed && p.reqId === docReqId));

  document.getElementById('app-main').innerHTML = renderDrakeDetail(reqId);
};

window.removeDrakeAlert = function(reqId, empId, docReqId) {
  if (!confirm('Remove this alert from the list?')) return;
  const req = DATA.drakeRequisitions.find(r => r.id === reqId);
  if (!req) return;
  const empIdParsed = empId === 'hmh' ? 'hmh' : parseInt(empId);
  req.pendingUpdates = req.pendingUpdates.filter(p => !(p.empId === empIdParsed && p.reqId === docReqId));
  document.getElementById('app-main').innerHTML = renderDrakeDetail(reqId);
};

window.openAddAlertManual = function(reqId) {
  const req = DATA.drakeRequisitions.find(r => r.id === reqId);
  if (!req) return;
  const activeEmployees = DATA.employees
    .filter(e => req.employees.includes(e.id) && e.active !== false)
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const html = `<div class="modal-header"><h3>➕ Add Manual Alert</h3>
    <button class="modal-close" onclick="window.closeModal()">×</button></div>
  <div class="modal-body">
    <div class="form-group"><label>Employee</label><select id="am-emp">
      <option value="">— Select —</option>
      ${activeEmployees.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}
    </select></div>
    <div class="form-group"><label>Document</label><select id="am-req">
      <option value="">— Select —</option>
      ${req.requiredDocs.map(rId => { const r = getReq(rId); return r ? `<option value="${rId}">${r.name}</option>` : ''; }).join('')}
    </select></div>
    <div class="form-group"><label>New expiry</label><input type="date" id="am-expiry"></div>
  </div>
  <div class="modal-footer">
    <button class="btn btn-ghost" onclick="window.closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="window.saveAlertManual('${reqId}')">Add</button>
  </div>`;
  window.openModal(html);
};

window.saveAlertManual = function(reqId) {
  const req = DATA.drakeRequisitions.find(r => r.id === reqId);
  if (!req) return;
  const empId = parseInt(document.getElementById('am-emp').value);
  const docReqId = document.getElementById('am-req').value;
  if (!empId || !docReqId) { alert('Select employee and document.'); return; }
  req.pendingUpdates.push({
    id: 'pu' + Date.now(),
    empId, reqId: docReqId,
    prevExpiry: null,
    newExpiry: document.getElementById('am-expiry').value,
    addedAt: new Date().toISOString().split('T')[0],
    checkedAt: null, comment: ''
  });
  window.closeModal();
  document.getElementById('app-main').innerHTML = renderDrakeDetail(reqId);
};

// ─── NEW DRAKE MODAL (with filters) ──────────────────────────────────────────
window.openAddDrakeModal = function() {
  const activeEmployees = [...DATA.employees]
    .filter(e => e.active !== false)
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const html = `<div class="modal-header"><h3>➕ New Drake Requisition</h3>
    <button class="modal-close" onclick="window.closeModal()">×</button></div>
  <div class="modal-body">
    <div class="form-row">
      <div class="form-group"><label>Requisition Name *</label><input type="text" id="dr-name" placeholder="Ex: GOLD - REQ 10199"></div>
      <div class="form-group"><label>Client *</label><input type="text" id="dr-client" placeholder="Ex: Constellation, Foresea"></div>
    </div>

    <div class="form-group" style="margin-bottom:6px"><label>👥 Employees</label>
      <div style="display:flex;gap:8px;margin-bottom:6px">
        <input type="text" id="dr-emp-name-filter" placeholder="Search by name..." oninput="window.filterDrakeEmps()"
          style="font-family:Inter,sans-serif;font-size:12px;padding:5px 8px;border:1px solid #e2e8f0;border-radius:4px;flex:1;outline:none">
        <select id="dr-emp-area-filter" onchange="window.filterDrakeEmps()"
          style="font-family:Inter,sans-serif;font-size:12px;padding:5px 8px;border:1px solid #e2e8f0;border-radius:4px;outline:none">
          <option value="">All groups</option>
          ${DATA.groups.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
        </select>
      </div>
      <div id="dr-emp-list" style="max-height:180px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:4px;padding:8px">
        ${activeEmployees.map(e => `
          <label class="drake-emp-row" data-name="${e.name.toLowerCase()}" data-group="${e.group}"
            style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:13px;cursor:pointer">
            <input type="checkbox" class="dr-emp-cb" value="${e.id}">
            <span style="flex:1">${e.name}</span>
            <span style="font-size:11px;color:#94a3b8;background:#f1f5f9;padding:1px 7px;border-radius:99px">${groupLabel(e.group)}</span>
          </label>`).join('')}
      </div>
    </div>

    <div class="form-group" style="margin-bottom:6px"><label>📋 Required Documents</label>
      <div style="display:flex;gap:8px;margin-bottom:6px">
        <input type="text" id="dr-req-name-filter" placeholder="Search by name..." oninput="window.filterDrakeReqs()"
          style="font-family:Inter,sans-serif;font-size:12px;padding:5px 8px;border:1px solid #e2e8f0;border-radius:4px;flex:1;outline:none">
        <select id="dr-req-cat-filter" onchange="window.filterDrakeReqs()"
          style="font-family:Inter,sans-serif;font-size:12px;padding:5px 8px;border:1px solid #e2e8f0;border-radius:4px;outline:none">
          <option value="">All categories</option>
          ${Object.entries(DATA.categoryLabels).map(([k,v]) => `<option value="${k}">${v}</option>`).join('')}
        </select>
      </div>
      <div id="dr-req-list" style="max-height:180px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:4px;padding:8px">
        ${DATA.requirements.map(r => `
          <label class="drake-req-row" data-name="${r.name.toLowerCase()}" data-cat="${r.category}"
            style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:13px;cursor:pointer">
            <input type="checkbox" class="dr-req-cb" value="${r.id}">
            <span style="flex:1">${r.name}</span>
            <span style="font-size:11px;color:#94a3b8;background:#f1f5f9;padding:1px 7px;border-radius:99px">${DATA.categoryLabels[r.category]||r.category}</span>
          </label>`).join('')}
        ${(DATA.hmhDocuments||[]).map(d => `
          <label class="drake-req-row" data-name="${d.name.toLowerCase()}" data-cat="hmh"
            style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:13px;cursor:pointer">
            <input type="checkbox" class="dr-hmh-cb" value="${d.id}">
            <span style="flex:1">🏢 ${d.name}</span>
            <span style="font-size:11px;color:#0f766e;background:#ccfbf1;padding:1px 7px;border-radius:99px">HMH</span>
          </label>`).join('')}
      </div>
    </div>
  </div>
  <div class="modal-footer">
    <button class="btn btn-ghost" onclick="window.closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="window.saveDrakeReq()">Create Requisition</button>
  </div>`;
  window.openModal(html, true);
};

window.filterDrakeEmps = function() {
  const name = (document.getElementById('dr-emp-name-filter').value || '').toLowerCase();
  const area = document.getElementById('dr-emp-area-filter').value;
  document.querySelectorAll('.drake-emp-row').forEach(row => {
    const matchName = !name || row.dataset.name.includes(name);
    const matchArea = !area || row.dataset.group === area;
    row.style.display = matchName && matchArea ? '' : 'none';
  });
};

window.filterDrakeReqs = function() {
  const name = (document.getElementById('dr-req-name-filter').value || '').toLowerCase();
  const cat = document.getElementById('dr-req-cat-filter').value;
  document.querySelectorAll('.drake-req-row').forEach(row => {
    const matchName = !name || row.dataset.name.includes(name);
    const matchCat = !cat || row.dataset.cat === cat;
    row.style.display = matchName && matchCat ? '' : 'none';
  });
};

window.saveDrakeReq = function() {
  const name = document.getElementById('dr-name').value.trim();
  const client = document.getElementById('dr-client').value.trim();
  if (!name || !client) { alert('Name and client are required.'); return; }
  const employees = [...document.querySelectorAll('.dr-emp-cb:checked')].map(cb => parseInt(cb.value));
  const requiredDocs = [...document.querySelectorAll('.dr-req-cb:checked')].map(cb => cb.value);
  const hmhDocs = [...document.querySelectorAll('.dr-hmh-cb:checked')].map(cb => cb.value);
  DATA.drakeRequisitions.push({ id: 'req' + Date.now(), name, client, employees, requiredDocs, hmhDocs, pendingUpdates: [], history: [] });
  window.closeModal();
  document.getElementById('app-main').innerHTML = renderDrake();
};

window.openManageEmpsDrake = function(reqId) {
  const req = DATA.drakeRequisitions.find(r => r.id === reqId);
  if (!req) return;
  const activeEmployees = [...DATA.employees]
    .filter(e => e.active !== false)
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const html = `<div class="modal-header"><h3>👥 Manage Employees</h3>
    <button class="modal-close" onclick="window.closeModal()">×</button></div>
  <div class="modal-body">
    <div style="display:flex;gap:8px;margin-bottom:8px">
      <input type="text" id="me-name-filter" placeholder="Search by name..." oninput="window.filterManageEmps()"
        style="font-family:Inter,sans-serif;font-size:12px;padding:5px 8px;border:1px solid #e2e8f0;border-radius:4px;flex:1;outline:none">
      <select id="me-area-filter" onchange="window.filterManageEmps()"
        style="font-family:Inter,sans-serif;font-size:12px;padding:5px 8px;border:1px solid #e2e8f0;border-radius:4px;outline:none">
        <option value="">All groups</option>
        ${DATA.groups.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
      </select>
    </div>
    <div id="me-emp-list" style="max-height:320px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:4px;padding:8px">
      ${activeEmployees.map(e => `
        <label class="manage-emp-row" data-name="${e.name.toLowerCase()}" data-group="${e.group}"
          style="display:flex;align-items:center;gap:8px;padding:5px 0;font-size:13px;cursor:pointer">
          <input type="checkbox" class="me-emp-cb" value="${e.id}" ${req.employees.includes(e.id)?'checked':''}>
          <span style="flex:1">${e.name}</span>
          <span style="font-size:11px;color:#94a3b8;background:#f1f5f9;padding:1px 7px;border-radius:99px">${groupLabel(e.group)}</span>
        </label>`).join('')}
    </div>
  </div>
  <div class="modal-footer">
    <button class="btn btn-ghost" onclick="window.closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="window.saveEmpsDrake('${reqId}')">Save</button>
  </div>`;
  window.openModal(html);
};

window.filterManageEmps = function() {
  const name = (document.getElementById('me-name-filter').value || '').toLowerCase();
  const area = document.getElementById('me-area-filter').value;
  document.querySelectorAll('.manage-emp-row').forEach(row => {
    const matchName = !name || row.dataset.name.includes(name);
    const matchArea = !area || row.dataset.group === area;
    row.style.display = matchName && matchArea ? '' : 'none';
  });
};

window.saveEmpsDrake = function(reqId) {
  const req = DATA.drakeRequisitions.find(r => r.id === reqId);
  if (!req) return;
  req.employees = [...document.querySelectorAll('.me-emp-cb:checked')].map(cb => parseInt(cb.value));
  window.closeModal();
  document.getElementById('app-main').innerHTML = renderDrakeDetail(reqId);
};

// Expose navigate globally
window.navigate = function(hash) { location.hash = hash; };
