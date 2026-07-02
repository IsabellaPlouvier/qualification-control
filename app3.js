// ─── PERSONNEL TAB ────────────────────────────────────────────────────────────
window._personnelSort = { col: null, dir: 1 };
window._personnelFilters = {};

function getEmpColVal(emp, colId) {
  if (colId === 'nome') return emp.name || '';
  if (colId === 'area') return groupLabel(emp.group);
  if (colId === 'sispat') {
    const sv = DATA.sispatValues.find(s => s.id === emp.sispat);
    return sv ? sv.label : (emp.sispat || '');
  }
  if (colId === 'birthDate' || colId === 'hiringDate') return emp[colId] ? formatDate(emp[colId]) : '';
  return emp[colId] || '';
}

function getEmpFilterVal(emp, colId) {
  if (colId === 'area') return emp.group || '';
  if (colId === 'sispat') return emp.sispat || '';
  return getEmpColVal(emp, colId);
}

function renderPersonnel() {
  const cols = DATA.personnelColumns || [];
  const filters = window._personnelFilters || {};
  const sort = window._personnelSort;

  let emps = DATA.employees.filter(e => e.active !== false);

  // Filter
  for (const col of cols) {
    const fval = (filters[col.id] || '').toLowerCase();
    if (!fval) continue;
    emps = emps.filter(e => {
      const raw = (getEmpFilterVal(e, col.id) || '').toString().toLowerCase();
      if (col.id === 'area' || col.id === 'sispat') return raw === fval;
      return raw.includes(fval);
    });
  }

  // Sort
  if (sort.col) {
    emps.sort((a, b) => {
      const av = getEmpColVal(a, sort.col).toLowerCase();
      const bv = getEmpColVal(b, sort.col).toLowerCase();
      return av < bv ? -sort.dir : av > bv ? sort.dir : 0;
    });
  }
  let html = `<div class="page-title">
    <span>👥</span> Personnel Information
    <div class="page-title-actions">
      <button class="btn btn-ghost" onclick="window.openInactiveModal()">👁 View Inactive</button>
      <button class="btn btn-ghost" onclick="window.openManageSispat()">🏷️ Manage Sispat</button>
      <button class="btn btn-ghost" onclick="window.openAddColumnModal()">➕ Add Column</button>
      <button class="btn btn-primary" onclick="window.openAddEmpPersonnelModal()">➕ Add Employee</button>
    </div>
  </div>`;

  html += `<div class="personnel-wrapper"><table class="personnel-table"><thead>`;
  html += `<tr>`;
  for (let i = 0; i < cols.length; i++) {
    const col = cols[i];
    const sortArrow = sort.col === col.id ? (sort.dir === 1 ? ' ▲' : ' ▼') : '';
    html += `<th draggable="true" ondragstart="window.personnelDragStart(event,'${col.id}')" ondragover="window.personnelDragOver(event)" ondrop="window.personnelDrop(event,'${col.id}')">
      <span class="col-sort" onclick="window.personnelSort('${col.id}')" style="cursor:pointer">${col.label}${sortArrow}</span>
      ${col.protected ? '' : `<button class="col-delete-btn" onclick="window.deleteColumn('${col.id}')">×</button>`}
    </th>`;
  }
  html += `<th>Actions</th></tr>`;
  html += `<tr class="filter-row-p">`;
  for (const col of cols) {
    if (col.id === 'area') {
      html += `<td><select onchange="window.personnelFilter('${col.id}',this.value)">
        <option value="">All</option>
        ${DATA.groups.map(g => `<option value="${g.id}" ${filters[col.id]===g.id?'selected':''}>${g.name}</option>`).join('')}
      </select></td>`;
    } else if (col.id === 'sispat') {
      html += `<td><select onchange="window.personnelFilter('${col.id}',this.value)">
        <option value="">All</option>
        ${DATA.sispatValues.map(s => `<option value="${s.id}" ${filters[col.id]===s.id?'selected':''}>${s.label}</option>`).join('')}
      </select></td>`;
    } else {
      html += `<td><input placeholder="Filter" value="${filters[col.id]||''}"
        oninput="window.personnelFilter('${col.id}',this.value)"></td>`;
    }
  }
  html += `<td></td></tr>`;
  html += `</thead><tbody>`;

  if (!emps.length) {
    html += `<tr><td colspan="${cols.length + 1}" style="text-align:center;padding:40px;color:#94a3b8">No employees match the current filters.</td></tr>`;
  }

  for (const emp of emps) {
    html += `<tr${emp.active===false?' style="opacity:.55"':''}>`;
    for (const col of cols) {
      if (col.id === 'sispat') {
        html += `<td onclick="window.personnelEditCell(this,${emp.id},'${col.id}')">${sispatBadge(emp.sispat)}</td>`;
      } else {
        const val = getEmpColVal(emp, col.id);
        html += `<td onclick="window.personnelEditCell(this,${emp.id},'${col.id}')">${val || '<span style="color:#cbd5e1">—</span>'}</td>`;
      }
    }
    html += `<td style="white-space:nowrap">
      <label style="font-size:12px;display:inline-flex;align-items:center;gap:4px;margin-right:8px">
        <input type="checkbox" ${emp.active===false?'':'checked'} onchange="window.toggleEmployeeActive(${emp.id},this.checked)">Active
      </label>
      <button class="btn-icon" title="Delete employee" onclick="window.deleteEmpPersonnel(${emp.id})">🗑</button>
    </td>`;
    html += `</tr>`;
  }
  html += `</tbody></table></div>`;
  return html;
}

window.personnelSort = function(colId) {
  const s = window._personnelSort;
  if (s.col === colId) s.dir = -s.dir;
  else { s.col = colId; s.dir = 1; }
  document.getElementById('app-main').innerHTML = renderPersonnel();
};

window.personnelFilter = function(colId, val) {
  window._personnelFilters[colId] = val;
  document.getElementById('app-main').innerHTML = renderPersonnel();
};

window._dragColId = null;

window.personnelDragStart = function(e, colId) {
  window._dragColId = colId;
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
};

window.personnelDragOver = function(e) {
  e.preventDefault();
};

window.personnelDrop = function(e, targetColId) {
  e.preventDefault();
  const src = window._dragColId;
  if (!src || src === targetColId) return;
  const cols = DATA.personnelColumns || [];
  const srcIdx = cols.findIndex(c => c.id === src);
  const tgtIdx = cols.findIndex(c => c.id === targetColId);
  if (srcIdx < 0 || tgtIdx < 0) return;
  const [moved] = cols.splice(srcIdx, 1);
  cols.splice(tgtIdx, 0, moved);
  window._dragColId = null;
  document.getElementById('app-main').innerHTML = renderPersonnel();
};

window.personnelEditCell = function(td, empId, colId) {
  if (td.classList.contains('editing')) return;
  const emp = getEmp(empId);
  if (!emp) return;
  td.classList.add('editing');
  const cur = colId === 'area' ? emp.group : (emp[colId] || '');

  if (colId === 'sispat') {
    td.innerHTML = `<select onblur="window.personnelSaveCell(this,${empId},'${colId}')" onchange="window.personnelSaveCell(this,${empId},'${colId}')">
      ${DATA.sispatValues.map(s => `<option value="${s.id}" ${emp.sispat===s.id?'selected':''}>${s.label}</option>`).join('')}
    </select>`;
    td.querySelector('select').focus();
  } else if (colId === 'area') {
    td.innerHTML = `<select onblur="window.personnelSaveCell(this,${empId},'${colId}')" onchange="window.personnelSaveCell(this,${empId},'${colId}')">
      ${DATA.groups.map(g => `<option value="${g.id}" ${emp.group===g.id?'selected':''}>${g.name}</option>`).join('')}
    </select>`;
    td.querySelector('select').focus();
  } else if (colId === 'birthDate' || colId === 'hiringDate') {
    td.innerHTML = `<input type="date" value="${emp[colId]||''}" onblur="window.personnelSaveCell(this,${empId},'${colId}')" onkeydown="if(event.key==='Enter')this.blur()">`;
    td.querySelector('input').focus();
  } else {
    td.innerHTML = `<input type="text" value="${cur}" onblur="window.personnelSaveCell(this,${empId},'${colId}')" onkeydown="if(event.key==='Enter')this.blur()">`;
    td.querySelector('input').focus();
  }
};

window.personnelSaveCell = function(input, empId, colId) {
  const emp = getEmp(empId);
  if (!emp) return;
  const val = input.value;
  if (colId === 'area') emp.group = val;
  else if (colId === 'nome') emp.name = val;
  else emp[colId] = val;
  document.getElementById('app-main').innerHTML = renderPersonnel();
};

window.deleteEmpPersonnel = function(empId) {
  const emp = getEmp(empId);
  if (!emp) return;
  if (!confirm(`Are you sure you want to delete "${emp.name}"?`)) return;
  DATA.employees = DATA.employees.filter(e => e.id !== empId);
  document.getElementById('app-main').innerHTML = renderPersonnel();
};

window.openInactiveModal = function() {
  const inactive = DATA.employees
    .filter(e => e.active === false)
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  let rows = '';
  if (!inactive.length) {
    rows = '<tr><td colspan="5" style="text-align:center;padding:24px;color:#94a3b8">No inactive employees found.</td></tr>';
  } else {
    rows = inactive.map(emp => `
      <tr>
        <td>${emp.name}</td>
        <td>${groupLabel(emp.group)}</td>
        <td>${emp.discipline === 'mec' ? 'Mechanical' : 'Electrical'}</td>
        <td>${regimeLabel(emp.regime)}</td>
        <td><button class="btn btn-primary btn-sm" onclick="window.restoreEmployee(${emp.id})">Restore</button></td>
      </tr>
    `).join('');
  }

  const html = `<div class="modal-header"><h3>Inactive Employees</h3>
    <button class="modal-close" onclick="window.closeModal()">×</button></div>
  <div class="modal-body">
    <div class="alerts-table-wrapper" style="box-shadow:none;border:1px solid #e2e8f0;border-radius:8px">
      <table class="alerts-table">
        <thead><tr><th>Name</th><th>Area</th><th>Discipline</th><th>Regime</th><th>Action</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>
  <div class="modal-footer">
    <button class="btn btn-ghost" onclick="window.closeModal()">Close</button>
  </div>`;
  window.openModal(html, true);
};

window.restoreEmployee = function(empId) {
  const emp = getEmp(empId);
  if (!emp) return;
  emp.active = true;
  window.openInactiveModal();
  if (getView().view === 'personnel') {
    document.getElementById('app-main').innerHTML = renderPersonnel();
  }
};

window.openAddColumnModal = function() {
  const html = `<div class="modal-header"><h3>➕ Add Column</h3>
    <button class="modal-close" onclick="window.closeModal()">×</button></div>
  <div class="modal-body">
    <div class="form-group"><label>Column Name *</label><input type="text" id="nc-label" placeholder="e.g. Shift, Certification"></div>
    <div class="form-group"><label>Type</label><select id="nc-type">
      <option value="text">Text</option>
      <option value="date">Date</option>
    </select></div>
  </div>
  <div class="modal-footer">
    <button class="btn btn-ghost" onclick="window.closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="window.saveNewColumn()">Add Column</button>
  </div>`;
  window.openModal(html);
};

window.saveNewColumn = function() {
  const label = document.getElementById('nc-label').value.trim();
  if (!label) { alert('Please enter a column name.'); return; }
  let id = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  if (!id) id = 'column';
  let suffix = 2;
  const base = id;
  while (DATA.personnelColumns.find(c => c.id === id)) {
    id = `${base}_${suffix}`;
    suffix += 1;
  }
  DATA.personnelColumns.push({ id, label, type: document.getElementById('nc-type').value });
  window.closeModal();
  document.getElementById('app-main').innerHTML = renderPersonnel();
};

window.deleteColumn = function(colId) {
  if (!confirm('Are you sure you want to delete this column?')) return;
  DATA.personnelColumns = DATA.personnelColumns.filter(c => c.id !== colId);
  document.getElementById('app-main').innerHTML = renderPersonnel();
};

window.openManageSispat = function() {
  const colorOptions = ['purple','blue','teal','gray','orange','green'];
  const html = `<div class="modal-header"><h3>🏷️ Manage Sispat Values</h3>
    <button class="modal-close" onclick="window.closeModal()">×</button></div>
  <div class="modal-body">
    <table class="alerts-table" style="margin-bottom:18px"><thead><tr><th>ID</th><th>Label</th><th>Color</th><th></th></tr></thead><tbody>
      ${DATA.sispatValues.map(s => `<tr>
        <td><code>${s.id}</code></td><td>${s.label}</td>
        <td><span class="sispat-badge sispat-${s.id}">${s.color}</span></td>
        <td><button class="btn btn-danger btn-sm" onclick="window.deleteSispat('${s.id}')">Delete</button></td>
      </tr>`).join('')}
    </tbody></table>
    <h4 style="margin-bottom:10px;color:var(--navy)">➕ Add Value</h4>
    <div class="form-row">
      <div class="form-group"><label>ID (no spaces)</label><input type="text" id="sv-id" placeholder="e.g. petrobras"></div>
      <div class="form-group"><label>Label</label><input type="text" id="sv-label" placeholder="e.g. Petrobras"></div>
    </div>
    <div class="form-group"><label>Color</label><select id="sv-color">
      ${colorOptions.map(c => `<option value="${c}">${c}</option>`).join('')}
    </select></div>
  </div>
  <div class="modal-footer">
    <button class="btn btn-ghost" onclick="window.closeModal()">Close</button>
    <button class="btn btn-primary" onclick="window.saveSispat()">Add Value</button>
  </div>`;
  window.openModal(html, true);
};

window.deleteSispat = function(id) {
  if (!confirm('Are you sure you want to delete this Sispat value?')) return;
  DATA.sispatValues = DATA.sispatValues.filter(s => s.id !== id);
  window.closeModal();
};

window.saveSispat = function() {
  const id = document.getElementById('sv-id').value.trim().replace(/\s+/g,'_');
  const label = document.getElementById('sv-label').value.trim();
  if (!id || !label) { alert('Please enter both an ID and a label.'); return; }
  DATA.sispatValues.push({ id, label, color: document.getElementById('sv-color').value });
  window.closeModal();
};

window.openAddEmpPersonnelModal = function() {
  const cols = DATA.personnelColumns || [];
  let fields = '';
  for (const col of cols) {
    if (col.id === 'sispat') {
      fields += `<div class="form-group"><label>${col.label}</label><select id="pn-${col.id}">
        ${DATA.sispatValues.map(s => `<option value="${s.id}">${s.label}</option>`).join('')}
      </select></div>`;
    } else if (col.id === 'area') {
      fields += `<div class="form-group"><label>Group/Area *</label><select id="pn-area">
        ${DATA.groups.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
      </select></div>`;
    } else if (col.id === 'birthDate' || col.id === 'hiringDate') {
      fields += `<div class="form-group"><label>${col.label}</label><input type="date" id="pn-${col.id}"></div>`;
    } else {
      fields += `<div class="form-group"><label>${col.label}${col.id==='nome'?' *':''}</label>
        <input type="text" id="pn-${col.id}" placeholder="${col.label}"></div>`;
    }
  }
  fields += `<div class="form-row">
    <div class="form-group"><label>Discipline</label><select id="pn-discipline">
      <option value="ele">Electrical</option><option value="mec">Mechanical</option>
    </select></div>
    <div class="form-group"><label>Regime</label><select id="pn-regime">
      <option value="offshore">Offshore</option><option value="onshore">Onshore</option>
    </select></div>
  </div>`;

  const html = `<div class="modal-header"><h3>➕ Add Employee</h3>
    <button class="modal-close" onclick="window.closeModal()">×</button></div>
  <div class="modal-body">${fields}</div>
  <div class="modal-footer">
    <button class="btn btn-ghost" onclick="window.closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="window.saveEmpPersonnel()">Add Employee</button>
  </div>`;
  window.openModal(html, true);
};

window.saveEmpPersonnel = function() {
  const nameEl = document.getElementById('pn-nome') || document.getElementById('pn-name');
  const name = nameEl ? nameEl.value.trim() : '';
  if (!name) { alert('Please enter a name.'); return; }
  const newEmp = {
    id: genId(), name,
    group: document.getElementById('pn-area')?.value || DATA.groups[0]?.id || '',
    discipline: document.getElementById('pn-discipline')?.value || 'ele',
    regime: document.getElementById('pn-regime')?.value || 'offshore',
    country: 'BR',
    active: true,
    requirements: {}
  };
  const cols = DATA.personnelColumns || [];
  for (const col of cols) {
    if (['nome','area'].includes(col.id)) continue;
    const el = document.getElementById('pn-' + col.id);
    if (el) newEmp[col.id] = el.value;
  }
  DATA.employees.push(newEmp);
  window.closeModal();
  document.getElementById('app-main').innerHTML = renderPersonnel();
};

// ─── HMH DOCUMENTS TAB ───────────────────────────────────────────────────────
function renderHMH() {
  const docs = DATA.hmhDocuments || [];

  let html = `<div class="page-title">
    <span>🏢</span> HMH Documents
    <div class="page-title-actions">
      <button class="btn btn-primary" onclick="window.openAddHMHModal()">➕ Add Document</button>
    </div>
  </div>`;

  html += `<div class="hmh-table-wrapper"><table class="hmh-table"><thead><tr>
    <th>Document Name</th><th>Category</th><th>Type</th>
    <th>Expiry</th><th>Status</th><th>Alert (days)</th>
    <th>Notes</th><th>Actions</th>
  </tr></thead><tbody>`;

  if (!docs.length) {
    html += `<tr><td colspan="8" style="text-align:center;padding:40px;color:#94a3b8">No documents found.</td></tr>`;
  }

  for (const doc of docs) {
    const days = doc.expiry ? daysUntil(doc.expiry) : null;
    let status = 'ok', cellCls = '';
    if (doc.expiry) {
      if (days < 0) { status = 'Expired'; cellCls = 'hmh-cell-expired'; }
      else if (days <= (doc.alertDays || 90)) { status = 'Expiring'; cellCls = 'hmh-cell-expiring'; }
      else { status = 'OK'; cellCls = 'hmh-cell-ok'; }
    } else { status = '—'; }

    html += `<tr>
      <td style="font-weight:600">${doc.name}</td>
      <td>${doc.category || '—'}</td>
      <td>${doc.type === 'recorrente' ? 'Recurring' : 'Non-Recurring'}</td>
      <td class="${cellCls}">${doc.expiry ? formatDate(doc.expiry) : '—'}</td>
      <td class="${cellCls}" style="font-weight:700">${status}</td>
      <td style="text-align:center">${doc.alertDays || 90}</td>
      <td style="max-width:220px;white-space:normal;font-size:12px;color:#64748b">${doc.obs || ''}</td>
      <td style="display:flex;gap:4px">
        <button class="btn btn-ghost btn-sm" title="Edit document" onclick="window.openEditHMHModal('${doc.id}')">✏️</button>
        <button class="btn btn-danger btn-sm" title="Delete document" onclick="window.deleteHMHDoc('${doc.id}')">🗑</button>
      </td>
    </tr>`;
  }
  html += `</tbody></table></div>`;
  return html;
}

function hmhDocFormHTML(doc) {
  doc = doc || {};
  return `
    <div class="form-group"><label>Name *</label><input type="text" id="hd-name" value="${doc.name||''}" placeholder="Document name"></div>
    <div class="form-row">
      <div class="form-group"><label>Category</label><input type="text" id="hd-cat" value="${doc.category||''}" placeholder="Ex: legal, quality"></div>
      <div class="form-group"><label>Type</label><select id="hd-type">
        <option value="recorrente" ${doc.type==='recorrente'?'selected':''}>Recurring</option>
        <option value="nao_recorrente" ${doc.type==='nao_recorrente'?'selected':''}>Non-Recurring</option>
      </select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Expiry</label><input type="date" id="hd-expiry" value="${doc.expiry||''}"></div>
      <div class="form-group"><label>Alert window (days)</label><input type="number" id="hd-alert" value="${doc.alertDays||90}" min="0"></div>
    </div>
    <div class="form-group"><label>Notes</label><textarea id="hd-obs" rows="2" style="resize:vertical">${doc.obs||''}</textarea></div>`;
}

window.openAddHMHModal = function() {
  const html = `<div class="modal-header"><h3>➕ Add HMH Document</h3>
    <button class="modal-close" onclick="window.closeModal()">×</button></div>
  <div class="modal-body">${hmhDocFormHTML()}</div>
  <div class="modal-footer">
    <button class="btn btn-ghost" onclick="window.closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="window.saveHMHDoc(null)">Add Document</button>
  </div>`;
  window.openModal(html);
};

window.openEditHMHModal = function(id) {
  const doc = (DATA.hmhDocuments||[]).find(d => d.id === id);
  if (!doc) return;
  const html = `<div class="modal-header"><h3>✏️ Edit Document</h3>
    <button class="modal-close" onclick="window.closeModal()">×</button></div>
  <div class="modal-body">${hmhDocFormHTML(doc)}</div>
  <div class="modal-footer">
    <button class="btn btn-ghost" onclick="window.closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="window.saveHMHDoc('${id}')">Save Changes</button>
  </div>`;
  window.openModal(html);
};

window.saveHMHDoc = function(id) {
  const name = document.getElementById('hd-name').value.trim();
  if (!name) { alert('Please enter a name.'); return; }
  const data = {
    name,
    category: document.getElementById('hd-cat').value.trim(),
    type: document.getElementById('hd-type').value,
    expiry: document.getElementById('hd-expiry').value,
    alertDays: parseInt(document.getElementById('hd-alert').value) || 90,
    obs: document.getElementById('hd-obs').value.trim(),
  };
  if (!DATA.hmhDocuments) DATA.hmhDocuments = [];
  if (id) {
    const idx = DATA.hmhDocuments.findIndex(d => d.id === id);
    if (idx >= 0) Object.assign(DATA.hmhDocuments[idx], data);
  } else {
    data.id = 'hmh' + Date.now();
    DATA.hmhDocuments.push(data);
  }
  window.closeModal();
  document.getElementById('app-main').innerHTML = renderHMH();
};

window.deleteHMHDoc = function(id) {
  if (!confirm('Are you sure you want to delete this document?')) return;
  DATA.hmhDocuments = (DATA.hmhDocuments||[]).filter(d => d.id !== id);
  document.getElementById('app-main').innerHTML = renderHMH();
};
