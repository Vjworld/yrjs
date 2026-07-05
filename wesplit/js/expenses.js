/* ============================================================
   GoPlaces – Expense Management
   ============================================================ */
'use strict';

const Expenses = (() => {

  /* ---- Category helpers ---- */
  function getCatHtml(catId) {
    const cat = Storage.getCatById(catId);
    if (!cat) return '';
    return `<span class="expense-icon" style="background:${cat.bg};color:${cat.color}">${cat.icon}</span>`;
  }

  /* ---- Build Add/Edit Expense Modal ---- */
  function buildExpenseForm(tripId, existingExp = null) {
    const trip    = Storage.Trips.get(tripId);
    if (!trip) { Toast.show('Trip not found', 'error'); return; }
    const members = trip.members || [];
    const cats    = Storage.Categories.getAll();
    const currSym = Storage.formatCurrency(0).replace('0','');
    const isEdit  = !!existingExp;

    // Populate paid-by options
    const memberOptions = members.map(m =>
      `<option value="${m.id}" ${isEdit && existingExp.paidById === m.id ? 'selected' : ''}>${m.name}</option>`
    ).join('');

    // Split-with checkboxes
    const splitCheckboxes = members.map(m => `
      <label class="checkbox-label">
        <input type="checkbox" name="split_member" value="${m.id}"
          ${!isEdit || (existingExp.splitAmong && existingExp.splitAmong.includes(m.id)) ? 'checked' : ''} />
        <span class="avatar-sm">${m.avatar || m.name[0]}</span> ${m.name}
      </label>
    `).join('');

    // Category options (standard + custom)
    const catOptions = cats.map(c =>
      `<option value="${c.id}" ${isEdit && existingExp.categoryId === c.id ? 'selected' : ''}>${c.icon} ${c.label}</option>`
    ).join('');

    const body = `
      <div class="form-section">
        <div class="form-group">
          <label>Description *</label>
          <input type="text" id="exp-desc" placeholder="e.g. Lunch at Café Saffron" value="${isEdit ? existingExp.description || '' : ''}" required />
        </div>
        <div class="form-row-two">
          <div class="form-group">
            <label>Amount *</label>
            <div class="input-icon-wrap">
              <i class="fas fa-rupee-sign" style="font-size:12px"></i>
              <input type="number" id="exp-amount" placeholder="0.00" min="0" step="0.01"
                value="${isEdit ? existingExp.amount || '' : ''}" required />
            </div>
          </div>
          <div class="form-group">
            <label>Date</label>
            <input type="date" id="exp-date" value="${isEdit ? (existingExp.date || todayStr()) : todayStr()}" />
          </div>
        </div>
        <div class="form-row-two">
          <div class="form-group">
            <label>Category *</label>
            <select id="exp-category">
              ${catOptions}
            </select>
          </div>
          <div class="form-group">
            <label>Paid by *</label>
            <select id="exp-paidby">${memberOptions}</select>
          </div>
        </div>
        <div class="form-group">
          <label>Add new category on-the-go</label>
          <div style="display:flex;gap:8px;">
            <input type="text" id="new-cat-name" placeholder="e.g. Ropeway" style="flex:1" />
            <button type="button" class="btn btn-secondary btn-sm" id="add-cat-btn">+ Add</button>
          </div>
          <span class="form-hint">Saved to your category list for future use</span>
        </div>
        <div class="form-group">
          <label>Split among (${members.length} members)</label>
          <div style="display:flex;gap:6px;margin-bottom:6px;">
            <button type="button" class="btn btn-sm btn-ghost" id="select-all-split">All</button>
            <button type="button" class="btn btn-sm btn-ghost" id="select-none-split">None</button>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;max-height:160px;overflow-y:auto;padding:4px 0;">
            ${splitCheckboxes}
          </div>
        </div>
        <div class="form-group">
          <label>Notes (optional)</label>
          <textarea id="exp-notes" placeholder="Any additional notes about this expense…" rows="2">${isEdit ? existingExp.notes || '' : ''}</textarea>
        </div>
        <div class="form-group">
          <label>Receipt / Photo (optional)</label>
          <input type="file" id="exp-receipt" accept="image/*" style="font-size:var(--text-xs)" />
          <span class="form-hint">Stored locally in your browser</span>
        </div>
      </div>`;

    Modal.show({
      title: isEdit ? 'Edit Expense' : 'Add Expense',
      body,
      size:  'lg',
      footer: `
        <button class="btn btn-secondary" id="exp-cancel-btn">Cancel</button>
        <button class="btn btn-primary" id="exp-save-btn">
          <i class="fas fa-check"></i> ${isEdit ? 'Update' : 'Add Expense'}
        </button>`,
      onOpen: () => {
        document.getElementById('exp-cancel-btn').onclick = Modal.close;
        document.getElementById('exp-save-btn').onclick = () => saveExpense(tripId, existingExp);

        document.getElementById('add-cat-btn').onclick = () => {
          const nameEl = document.getElementById('new-cat-name');
          const catName = nameEl.value.trim();
          if (!catName) { Toast.show('Please enter a category name', 'warning'); return; }
          const icons = ['📋','🎯','⭐','🔑','🎪','🛕','🌊','🚂'];
          const newCat = {
            id:    'custom_' + catName.toLowerCase().replace(/\s+/g,'_'),
            label: catName,
            icon:  icons[Math.floor(Math.random()*icons.length)],
            color: '#64748b', bg: '#f1f5f9'
          };
          Storage.Categories.add(newCat);
          const sel = document.getElementById('exp-category');
          const opt = document.createElement('option');
          opt.value = newCat.id; opt.textContent = newCat.icon + ' ' + newCat.label;
          sel.appendChild(opt);
          sel.value = newCat.id;
          nameEl.value = '';
          Toast.show(`Category "${catName}" added!`, 'success');
        };

        document.getElementById('select-all-split').onclick = () => {
          document.querySelectorAll('[name="split_member"]').forEach(cb => cb.checked = true);
        };
        document.getElementById('select-none-split').onclick = () => {
          document.querySelectorAll('[name="split_member"]').forEach(cb => cb.checked = false);
        };
      }
    });
  }

  function todayStr() {
    return new Date().toISOString().split('T')[0];
  }

  function saveExpense(tripId, existingExp = null) {
    const description = document.getElementById('exp-desc').value.trim();
    const amountStr   = document.getElementById('exp-amount').value;
    const date        = document.getElementById('exp-date').value;
    const categoryId  = document.getElementById('exp-category').value;
    const paidById    = document.getElementById('exp-paidby').value;
    const notes       = document.getElementById('exp-notes').value.trim();
    const splitAmong  = [...document.querySelectorAll('[name="split_member"]:checked')].map(cb => cb.value);

    if (!description) { Toast.show('Please enter a description', 'error'); return; }
    const amount = parseFloat(amountStr);
    if (!amount || amount <= 0) { Toast.show('Please enter a valid amount', 'error'); return; }
    if (!paidById) { Toast.show('Please select who paid', 'error'); return; }
    if (splitAmong.length === 0) { Toast.show('Select at least one member to split with', 'warning'); return; }

    const trip = Storage.Trips.get(tripId);
    const paidByMember = trip.members.find(m => m.id === paidById);
    const perPerson  = splitAmong.length > 0 ? amount / splitAmong.length : amount;

    const expense = {
      id:          existingExp ? existingExp.id : Storage.genId(),
      tripId,
      description,
      amount,
      date:        date || todayStr(),
      categoryId,
      paidById,
      paidByName:  paidByMember ? paidByMember.name : 'Unknown',
      notes,
      splitAmong,
      perPerson:   Math.round(perPerson * 100) / 100,
      createdAt:   existingExp ? existingExp.createdAt : Date.now(),
      updatedAt:   Date.now(),
    };

    // Handle receipt file
    const fileInput = document.getElementById('exp-receipt');
    if (fileInput && fileInput.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        expense.receiptBase64 = e.target.result;
        Storage.Expenses.save(expense);
      };
      reader.readAsDataURL(fileInput.files[0]);
    } else {
      Storage.Expenses.save(expense);
    }

    // Award coins
    if (!existingExp) Storage.Coins.add(APP.coins.addExpense);

    // Queue for offline sync
    if (!navigator.onLine) {
      Storage.Queue.add({ type: 'expense', action: existingExp ? 'update' : 'create', data: expense });
    }

    Modal.close();
    Toast.show(`Expense "${description}" ${existingExp ? 'updated' : 'added'} (+${APP.coins.addExpense} coins)`, 'success');

    // Refresh current page
    Pages.render(App.currentPage);
  }

  function deleteExpense(expId) {
    Modal.confirm('Delete this expense?', 'This action cannot be undone.', () => {
      Storage.Expenses.delete(expId);
      Toast.show('Expense deleted', 'info');
      Pages.render(App.currentPage);
    });
  }

  /* ---- Expense list item HTML ---- */
  function expenseItemHtml(exp) {
    const cat    = Storage.getCatById(exp.categoryId);
    const sym    = Storage.formatCurrency(exp.amount);
    const date   = Storage.formatDate(new Date(exp.date).getTime() || exp.createdAt);

    return `
      <div class="expense-item" data-id="${exp.id}">
        <div class="expense-icon" style="background:${cat?.bg||'#f1f5f9'};color:${cat?.color||'#64748b'}">${cat?.icon||'📦'}</div>
        <div class="expense-details">
          <div class="name">${escHtml(exp.description)}</div>
          <div class="meta">${cat?.label||'Other'} &bull; ${date} &bull; Paid by <strong>${escHtml(exp.paidByName)}</strong></div>
          ${exp.notes ? `<div class="meta" style="margin-top:2px;font-style:italic">${escHtml(exp.notes)}</div>` : ''}
        </div>
        <div class="expense-amount">
          <div class="amount" style="color:var(--clr-primary)">${sym}</div>
          <div class="paidby">${exp.splitAmong?.length||1} members · ${Storage.formatCurrency(exp.perPerson)} each</div>
        </div>
        <div class="expense-actions" style="display:flex;gap:4px;margin-left:8px;">
          <button class="icon-btn" style="width:30px;height:30px;font-size:12px" onclick="Expenses.editExpense('${exp.id}','${exp.tripId}')" title="Edit"><i class="fas fa-edit"></i></button>
          <button class="icon-btn" style="width:30px;height:30px;font-size:12px;color:var(--clr-danger)" onclick="Expenses.deleteExpense('${exp.id}')" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
      </div>`;
  }

  function editExpense(expId, tripId) {
    const exp = Storage.Expenses.get(expId);
    if (!exp) { Toast.show('Expense not found', 'error'); return; }
    buildExpenseForm(tripId, exp);
  }

  function escHtml(str) {
    return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return { buildExpenseForm, expenseItemHtml, deleteExpense, editExpense, getCatHtml };
})();
