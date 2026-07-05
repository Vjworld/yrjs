/* ============================================================
   GoPlaces – Page Renderers
   ============================================================ */
'use strict';

const Pages = (() => {

  function escHtml(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ======================================================
     DASHBOARD
     ====================================================== */
  function renderDashboard() {
    const user     = Storage.User.get();
    const trips    = Storage.Trips.getAll();
    const expenses = Storage.Expenses.getAll();
    const sym      = Storage.Settings.get().currency || 'INR';
    const totalAmt = expenses.reduce((s,e) => s + (e.amount||0), 0);
    const activeTrip = trips.find(t => t.id === Storage.Trips.getActive()) || trips[0];

    let activeExpenses = activeTrip ? Storage.Expenses.getByTrip(activeTrip.id) : [];
    let activeTxs      = activeTrip ? Settlements.calculate(activeTrip.id) : [];

    App.setTitle('Dashboard', activeTrip ? `Current trip: ${activeTrip.name}` : 'No active trip');

    return `<div class="page-content">
      ${!activeTrip ? `
        <div class="sheets-banner" style="background:var(--clr-primary-10);border-color:var(--clr-primary-20);color:var(--clr-primary)">
          <i class="fas fa-map-marked-alt"></i>
          <div>You haven't created a trip yet. <span class="cta-link" onclick="App.navigate('trips')">Create your first trip →</span></div>
        </div>` : ''}

      <!-- Stats -->
      <div class="stats-grid">
        ${statCard('🗺️', 'Total Trips', trips.length, 'All time trips', '#4f46e5','#ede9fe')}
        ${statCard('💰', 'Total Spent', Storage.formatCurrency(totalAmt), 'All trips combined', '#10b981','#d1fae5')}
        ${statCard('🧾', 'Expenses', expenses.length, 'All entries', '#f59e0b','#fef3c7')}
        ${statCard('🪙', 'Your Coins', user?.coins||0, 'Loyalty rewards', '#0ea5e9','#e0f2fe')}
      </div>

      <div class="dashboard-grid">
        <!-- Active Trip Card -->
        <div class="card">
          <div class="card-header">
            <div class="card-title"><i class="fas fa-map-marked-alt"></i> Active Trip</div>
            ${activeTrip ? `<button class="btn btn-sm btn-secondary" onclick="App.navigate('trips')">Switch</button>` : ''}
          </div>
          ${activeTrip ? `
            <div>
              <h3 style="font-size:var(--text-xl);margin-bottom:4px">${escHtml(activeTrip.name)}</h3>
              <p style="color:var(--text-muted);font-size:var(--text-sm);margin-bottom:12px">
                <i class="fas fa-map-pin" style="margin-right:4px"></i>${escHtml(activeTrip.destination||'TBD')}
                ${activeTrip.startDate ? ` &bull; ${Storage.formatDate(new Date(activeTrip.startDate).getTime())}` : ''}
              </p>
              <div style="display:flex;gap:16px;margin-bottom:16px">
                <div><div class="text-muted text-xs">Total</div><div class="fw-700" style="color:var(--clr-primary)">${Storage.formatCurrency(Storage.Expenses.totalForTrip(activeTrip.id))}</div></div>
                <div><div class="text-muted text-xs">Expenses</div><div class="fw-700">${activeExpenses.length}</div></div>
                <div><div class="text-muted text-xs">Members</div><div class="fw-700">${activeTrip.members?.length||0}</div></div>
                <div><div class="text-muted text-xs">Pending</div><div class="fw-700" style="color:var(--clr-danger)">${activeTxs.length}</div></div>
              </div>
              <div style="display:flex;gap:8px">
                <button class="btn btn-primary btn-sm" onclick="Expenses.buildExpenseForm('${activeTrip.id}')">
                  <i class="fas fa-plus"></i> Add Expense
                </button>
                <button class="btn btn-secondary btn-sm" onclick="App.navigate('settlements')">
                  <i class="fas fa-handshake"></i> Settle Up
                </button>
              </div>
            </div>` : `
            <div class="empty-state">
              <i class="fas fa-map-marked-alt"></i>
              <h3>No active trip</h3>
              <p>Create a trip to start tracking expenses</p>
              <button class="btn btn-primary" onclick="App.navigate('trips')"><i class="fas fa-plus"></i> New Trip</button>
            </div>`}
        </div>

        <!-- Recent Expenses -->
        <div class="card">
          <div class="card-header">
            <div class="card-title"><i class="fas fa-receipt"></i> Recent Expenses</div>
            <a href="#" onclick="App.navigate('expenses')" style="font-size:var(--text-xs);color:var(--clr-primary)">View all</a>
          </div>
          ${activeExpenses.length > 0
            ? `<div class="expense-list">${activeExpenses.slice(0,5).map(e => Expenses.expenseItemHtml(e)).join('')}</div>`
            : `<div class="empty-state" style="padding:24px"><i class="fas fa-receipt"></i><p>No expenses yet for this trip</p></div>`}
        </div>

        <!-- Settlement Preview -->
        <div class="card">
          <div class="card-header">
            <div class="card-title"><i class="fas fa-handshake"></i> Pending Settlements</div>
            <a href="#" onclick="App.navigate('settlements')" style="font-size:var(--text-xs);color:var(--clr-primary)">Full view</a>
          </div>
          ${activeTxs.length > 0
            ? `<div style="display:flex;flex-direction:column;gap:8px">${activeTxs.slice(0,3).map(tx => Settlements.settlementCardHtml(tx)).join('')}</div>`
            : `<div class="empty-state" style="padding:24px"><i class="fas fa-check-circle" style="color:var(--clr-accent)"></i><p style="color:var(--clr-accent);font-weight:600">All settled up!</p></div>`}
        </div>

        <!-- Category Breakdown -->
        <div class="card">
          <div class="card-header">
            <div class="card-title"><i class="fas fa-chart-pie"></i> Spending by Category</div>
          </div>
          ${buildCategoryBreakdown(activeTrip?.id)}
        </div>
      </div>
    </div>`;
  }

  function statCard(emoji, label, value, sub, color, bg) {
    return `<div class="stat-card">
      <div class="stat-icon" style="background:${bg};color:${color}">${emoji}</div>
      <div class="stat-value">${value}</div>
      <div class="stat-label">${label}</div>
      ${sub ? `<div class="text-muted text-xs">${sub}</div>` : ''}
    </div>`;
  }

  function buildCategoryBreakdown(tripId) {
    if (!tripId) return `<div class="empty-state" style="padding:24px"><i class="fas fa-chart-pie"></i><p>Select a trip to see breakdown</p></div>`;
    const breakdown = Settlements.categoryBreakdown(tripId);
    const entries   = Object.entries(breakdown).sort((a,b) => b[1]-a[1]);
    if (!entries.length) return `<div class="empty-state" style="padding:24px"><i class="fas fa-chart-pie"></i><p>No expenses yet</p></div>`;
    const total = entries.reduce((s,[,v]) => s+v, 0);
    return `<div style="display:flex;flex-direction:column;gap:10px">
      ${entries.map(([catId, amt], i) => {
        const cat  = Storage.getCatById(catId);
        const pct  = total > 0 ? Math.round(amt/total*100) : 0;
        const col  = APP.chartColors[i % APP.chartColors.length];
        return `<div>
          <div style="display:flex;justify-content:space-between;font-size:var(--text-xs);margin-bottom:4px">
            <span style="color:var(--text-secondary);font-weight:600">${cat?.icon||'📦'} ${cat?.label||'Other'}</span>
            <span style="font-weight:700">${Storage.formatCurrency(amt)} <span style="color:var(--text-muted)">(${pct}%)</span></span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${col}"></div></div>
        </div>`;
      }).join('')}
    </div>`;
  }

  /* ======================================================
     TRIPS
     ====================================================== */
  function renderTrips() {
    const trips = Storage.Trips.getAll();
    App.setTitle('My Trips', `${trips.length} trip${trips.length !== 1 ? 's' : ''}`);

    return `<div class="page-content">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-5)">
        <div class="search-bar" style="flex:1;max-width:320px">
          <i class="fas fa-search"></i>
          <input type="text" id="trip-search" placeholder="Search trips…" oninput="Pages.filterTrips(this.value)" />
        </div>
        <button class="btn btn-primary" onclick="Pages.showAddTripModal()">
          <i class="fas fa-plus"></i> New Trip
        </button>
      </div>

      <div class="trips-grid" id="trips-grid">
        ${trips.length === 0
          ? `<div class="empty-state" style="grid-column:1/-1;padding:60px 20px">
               <i class="fas fa-map-marked-alt"></i>
               <h3>No trips yet</h3>
               <p>Create your first trip to start tracking expenses with your group</p>
               <button class="btn btn-primary" onclick="Pages.showAddTripModal()"><i class="fas fa-plus"></i> Create Trip</button>
             </div>`
          : trips.map(trip => tripCardHtml(trip)).join('')}
      </div>
    </div>`;
  }

  function tripCardHtml(trip) {
    const total    = Storage.Expenses.totalForTrip(trip.id);
    const isActive = Storage.Trips.getActive() === trip.id;
    const cover    = trip.cover || APP.tripCovers[Math.abs(trip.id.charCodeAt(1)||0) % APP.tripCovers.length];

    return `<div class="trip-card" onclick="Pages.openTrip('${trip.id}')">
      <div class="trip-card-cover" style="background:${cover}">
        <span style="font-size:3rem">${trip.emoji||'🗺️'}</span>
        ${isActive ? `<span style="position:absolute;top:10px;right:10px" class="badge badge-green">Active</span>` : ''}
      </div>
      <div class="trip-card-body">
        <h3>${escHtml(trip.name)}</h3>
        <div class="trip-card-meta">
          ${trip.destination ? `<span><i class="fas fa-map-pin"></i> ${escHtml(trip.destination)}</span>` : ''}
          ${trip.startDate   ? `<span><i class="fas fa-calendar"></i> ${trip.startDate}</span>` : ''}
        </div>
        <div class="trip-members">
          ${(trip.members||[]).slice(0,5).map(m =>
            `<div class="avatar avatar-sm" title="${escHtml(m.name)}">${m.avatar||m.name[0]}</div>`
          ).join('')}
          ${(trip.members||[]).length > 5 ? `<div class="avatar avatar-sm" style="background:#e2e8f0;color:var(--text-muted)">+${(trip.members||[]).length-5}</div>` : ''}
        </div>
        <div class="trip-card-footer">
          <div class="trip-total">Total: <span>${Storage.formatCurrency(total)}</span></div>
          <div style="display:flex;gap:6px">
            <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation();Pages.showEditTripModal('${trip.id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="event.stopPropagation();Pages.deleteTrip('${trip.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>`;
  }

  function filterTrips(q) {
    const grid  = document.getElementById('trips-grid');
    const trips = Storage.Trips.getAll();
    const q2    = q.toLowerCase();
    const filtered = q2 ? trips.filter(t => t.name.toLowerCase().includes(q2) || (t.destination||'').toLowerCase().includes(q2)) : trips;
    if (grid) grid.innerHTML = filtered.length ? filtered.map(tripCardHtml).join('') : `<div class="empty-state" style="grid-column:1/-1"><i class="fas fa-search"></i><p>No trips match "${escHtml(q)}"</p></div>`;
  }

  function showAddTripModal(existing = null) {
    const isEdit   = !!existing;
    const members  = existing?.members || [];
    const memberList = members.map(m => `
      <div class="member-row" id="mrow_${m.id}" style="display:flex;align-items:center;gap:8px;padding:8px;border:1px solid var(--border-color);border-radius:var(--radius-md)">
        <div class="avatar avatar-sm">${m.avatar||m.name[0]}</div>
        <div style="flex:1">
          <div style="font-weight:600;font-size:var(--text-sm)">${escHtml(m.name)}</div>
          <div style="font-size:var(--text-xs);color:var(--text-muted)">${escHtml(m.email||'')} ${m.upi ? '• UPI: '+escHtml(m.upi) : ''}</div>
        </div>
        <button class="btn btn-sm btn-ghost" style="color:var(--clr-danger)" onclick="Pages.removeTempMember('${m.id}')">
          <i class="fas fa-times"></i>
        </button>
      </div>`).join('');

    window._tempMembers = [...members];

    Modal.show({
      title: isEdit ? 'Edit Trip' : 'Create New Trip',
      size: 'lg',
      body: `
        <div class="form-section">
          <div class="form-row-two">
            <div class="form-group">
              <label>Trip Name *</label>
              <input type="text" id="trip-name" placeholder="e.g. Goa 2024" value="${isEdit ? escHtml(existing.name||'') : ''}" required />
            </div>
            <div class="form-group">
              <label>Destination</label>
              <input type="text" id="trip-dest" placeholder="e.g. Goa, India" value="${isEdit ? escHtml(existing.destination||'') : ''}" />
            </div>
          </div>
          <div class="form-row-two">
            <div class="form-group">
              <label>Start Date</label>
              <input type="date" id="trip-start" value="${isEdit ? existing.startDate||'' : ''}" />
            </div>
            <div class="form-group">
              <label>End Date</label>
              <input type="date" id="trip-end" value="${isEdit ? existing.endDate||'' : ''}" />
            </div>
          </div>
          <div class="form-group">
            <label>Trip Emoji</label>
            <div style="display:flex;gap:6px;flex-wrap:wrap" id="emoji-picker">
              ${['🗺️','🏖️','🏔️','🌴','🏰','🚢','✈️','🏕️','🎡','🚂','🛕','🌊'].map(e => 
                `<button type="button" class="btn btn-sm btn-secondary emoji-opt ${isEdit && existing.emoji===e?'btn-primary':''}" data-emoji="${e}" style="font-size:20px;padding:6px 10px">${e}</button>`
              ).join('')}
            </div>
          </div>
          <div class="form-group">
            <label>Trip Description</label>
            <textarea id="trip-desc" placeholder="Brief description about the trip…" rows="2">${isEdit ? escHtml(existing.description||'') : ''}</textarea>
          </div>

          <!-- Members Section -->
          <div style="border-top:1px solid var(--border-color);padding-top:16px;margin-top:4px">
            <label style="font-size:var(--text-sm);font-weight:700;color:var(--text-secondary);display:block;margin-bottom:12px">
              <i class="fas fa-users" style="margin-right:6px;color:var(--clr-primary)"></i>Trip Members
            </label>
            <div id="trip-members-list" style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px">
              ${memberList || '<p class="text-muted text-sm">No members added yet</p>'}
            </div>
            <div class="card" style="background:var(--bg-app);padding:16px">
              <div style="font-size:var(--text-sm);font-weight:600;margin-bottom:10px">Add Member</div>
              <div class="form-row-two">
                <div class="form-group">
                  <label>Full Name *</label>
                  <input type="text" id="new-member-name" placeholder="John Doe" />
                </div>
                <div class="form-group">
                  <label>Email</label>
                  <input type="email" id="new-member-email" placeholder="john@example.com" />
                </div>
              </div>
              <div class="form-row-two">
                <div class="form-group">
                  <label>Phone</label>
                  <input type="tel" id="new-member-phone" placeholder="+91 98765 43210" />
                </div>
                <div class="form-group">
                  <label>UPI ID (for payments)</label>
                  <input type="text" id="new-member-upi" placeholder="name@upi" />
                </div>
              </div>
              <button class="btn btn-secondary btn-sm" id="add-member-btn" style="margin-top:4px">
                <i class="fas fa-user-plus"></i> Add Member
              </button>
            </div>
          </div>
        </div>`,
      footer: `
        <button class="btn btn-secondary" id="trip-cancel-btn">Cancel</button>
        <button class="btn btn-primary" id="trip-save-btn"><i class="fas fa-check"></i> ${isEdit ? 'Update Trip' : 'Create Trip'}</button>`,
      onOpen: () => {
        document.getElementById('trip-cancel-btn').onclick = Modal.close;
        document.getElementById('trip-save-btn').onclick = () => saveTripModal(isEdit ? existing.id : null);

        // Emoji picker
        document.querySelectorAll('.emoji-opt').forEach(btn => {
          btn.addEventListener('click', () => {
            document.querySelectorAll('.emoji-opt').forEach(b => b.classList.remove('btn-primary'));
            btn.classList.add('btn-primary');
            window._selectedEmoji = btn.dataset.emoji;
          });
        });
        window._selectedEmoji = isEdit ? existing.emoji : '🗺️';

        document.getElementById('add-member-btn').onclick = addTempMember;
      }
    });
  }

  window._tempMembers = [];

  function addTempMember() {
    const name  = document.getElementById('new-member-name').value.trim();
    const email = document.getElementById('new-member-email').value.trim();
    const phone = document.getElementById('new-member-phone').value.trim();
    const upi   = document.getElementById('new-member-upi').value.trim();

    if (!name) { Toast.show('Member name is required', 'warning'); return; }

    const member = {
      id:     Storage.genId(),
      name, email, phone, upi,
      avatar: name[0].toUpperCase(),
    };

    window._tempMembers.push(member);
    Storage.Members.save(member);

    const list = document.getElementById('trip-members-list');
    const isFirst = list.innerHTML.includes('No members added yet');
    if (isFirst) list.innerHTML = '';
    const div = document.createElement('div');
    div.id = `mrow_${member.id}`;
    div.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px;border:1px solid var(--border-color);border-radius:var(--radius-md)';
    div.innerHTML = `
      <div class="avatar avatar-sm">${member.avatar}</div>
      <div style="flex:1">
        <div style="font-weight:600;font-size:var(--text-sm)">${escHtml(name)}</div>
        <div style="font-size:var(--text-xs);color:var(--text-muted)">${escHtml(email)} ${upi ? '• UPI: '+escHtml(upi) : ''}</div>
      </div>
      <button class="btn btn-sm btn-ghost" style="color:var(--clr-danger)" onclick="Pages.removeTempMember('${member.id}')">
        <i class="fas fa-times"></i>
      </button>`;
    list.appendChild(div);

    document.getElementById('new-member-name').value  = '';
    document.getElementById('new-member-email').value = '';
    document.getElementById('new-member-phone').value = '';
    document.getElementById('new-member-upi').value   = '';
    Toast.show(`${name} added to trip`, 'success');
  }

  function removeTempMember(id) {
    window._tempMembers = (window._tempMembers||[]).filter(m => m.id !== id);
    document.getElementById('mrow_' + id)?.remove();
  }

  function saveTripModal(tripId = null) {
    const name  = document.getElementById('trip-name').value.trim();
    const dest  = document.getElementById('trip-dest').value.trim();
    const start = document.getElementById('trip-start').value;
    const end   = document.getElementById('trip-end').value;
    const desc  = document.getElementById('trip-desc').value.trim();

    if (!name) { Toast.show('Please enter a trip name', 'error'); return; }

    const existing = tripId ? Storage.Trips.get(tripId) : null;
    const trip = {
      id:          tripId || Storage.genId(),
      name, destination: dest, startDate: start, endDate: end, description: desc,
      emoji:       window._selectedEmoji || '🗺️',
      cover:       existing?.cover || APP.tripCovers[Math.floor(Math.random()*APP.tripCovers.length)],
      members:     window._tempMembers || [],
      createdAt:   existing?.createdAt || Date.now(),
      updatedAt:   Date.now(),
    };

    Storage.Trips.save(trip);
    if (!tripId) {
      Storage.Trips.setActive(trip.id);
      Storage.Coins.add(APP.coins.tripCreated);
    }

    Modal.close();
    Toast.show(`Trip "${name}" ${tripId ? 'updated' : 'created'}!`, 'success');
    Pages.render('trips');
  }

  function openTrip(id) {
    Storage.Trips.setActive(id);
    App.navigate('expenses');
  }

  function showEditTripModal(id) {
    const trip = Storage.Trips.get(id);
    if (!trip) return;
    window._tempMembers = [...(trip.members||[])];
    showAddTripModal(trip);
  }

  function deleteTrip(id) {
    const trip = Storage.Trips.get(id);
    Modal.confirm(`Delete trip "${trip?.name}"?`,
      'All expenses for this trip will also be deleted. This cannot be undone.',
      () => {
        Storage.Expenses.getByTrip(id).forEach(e => Storage.Expenses.delete(e.id));
        Storage.Trips.delete(id);
        if (Storage.Trips.getActive() === id) Storage.Trips.setActive(null);
        Toast.show('Trip deleted', 'info');
        Pages.render('trips');
      });
  }

  /* ======================================================
     EXPENSES PAGE
     ====================================================== */
  function renderExpenses() {
    const activeId = Storage.Trips.getActive();
    const trips    = Storage.Trips.getAll();
    const trip     = trips.find(t => t.id === activeId) || trips[0];

    if (!trip) {
      App.setTitle('Expenses');
      return `<div class="page-content"><div class="empty-state">
        <i class="fas fa-receipt"></i><h3>No trips found</h3>
        <p>Create a trip first to start logging expenses</p>
        <button class="btn btn-primary" onclick="App.navigate('trips')"><i class="fas fa-plus"></i> Create Trip</button>
      </div></div>`;
    }

    const expenses = Storage.Expenses.getByTrip(trip.id);
    const cats     = Storage.Categories.getAll();
    App.setTitle('Expenses', trip.name);

    // Filter state
    const activeCat  = window._expFilter?.cat  || 'all';
    const activeSort = window._expFilter?.sort || 'date-desc';
    const searchQ    = window._expFilter?.q    || '';

    let filtered = [...expenses];
    if (activeCat !== 'all') filtered = filtered.filter(e => e.categoryId === activeCat);
    if (searchQ) filtered = filtered.filter(e => e.description.toLowerCase().includes(searchQ.toLowerCase()));
    if (activeSort === 'date-desc')    filtered.sort((a,b) => new Date(b.date) - new Date(a.date));
    if (activeSort === 'date-asc')     filtered.sort((a,b) => new Date(a.date) - new Date(b.date));
    if (activeSort === 'amount-desc')  filtered.sort((a,b) => b.amount - a.amount);
    if (activeSort === 'amount-asc')   filtered.sort((a,b) => a.amount - b.amount);

    const total = filtered.reduce((s,e) => s + e.amount, 0);

    return `<div class="page-content">
      <!-- Trip selector -->
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:var(--space-5);flex-wrap:wrap">
        <div class="form-group" style="margin:0">
          <select id="trip-selector" onchange="Pages.switchTrip(this.value)" style="padding:8px 32px 8px 12px;min-width:180px">
            ${trips.map(t => `<option value="${t.id}" ${t.id===trip.id?'selected':''}>${escHtml(t.name)}</option>`).join('')}
          </select>
        </div>
        <div class="search-bar" style="flex:1;max-width:280px">
          <i class="fas fa-search"></i>
          <input type="text" id="exp-search" placeholder="Search expenses…" value="${escHtml(searchQ)}"
            oninput="Pages.filterExpenses({q:this.value})" />
        </div>
        <select onchange="Pages.filterExpenses({sort:this.value})" style="padding:8px 12px;border:1.5px solid var(--border-color);border-radius:var(--radius-md);background:var(--bg-input);color:var(--text-primary);font-size:var(--text-sm)">
          <option value="date-desc" ${activeSort==='date-desc'?'selected':''}>Latest first</option>
          <option value="date-asc"  ${activeSort==='date-asc'?'selected':''}>Oldest first</option>
          <option value="amount-desc" ${activeSort==='amount-desc'?'selected':''}>Highest amount</option>
          <option value="amount-asc"  ${activeSort==='amount-asc'?'selected':''}>Lowest amount</option>
        </select>
        <div style="display:flex;gap:8px;margin-left:auto">
          <button class="btn btn-secondary btn-sm" onclick="Settlements.exportCSV('${trip.id}')">
            <i class="fas fa-file-csv"></i> Export
          </button>
          <button class="btn btn-primary" onclick="Expenses.buildExpenseForm('${trip.id}')">
            <i class="fas fa-plus"></i> Add Expense
          </button>
        </div>
      </div>

      <!-- Category filter chips -->
      <div class="filter-bar">
        <button class="cat-chip ${activeCat==='all'?'active':''}" onclick="Pages.filterExpenses({cat:'all'})">All</button>
        ${cats.filter(c => expenses.some(e => e.categoryId === c.id)).map(c =>
          `<button class="cat-chip ${activeCat===c.id?'active':''}" onclick="Pages.filterExpenses({cat:'${c.id}'})">
            ${c.icon} ${c.label}
          </button>`
        ).join('')}
      </div>

      <!-- Summary bar -->
      <div class="card" style="margin-bottom:var(--space-5);flex-direction:row;display:flex;gap:24px;flex-wrap:wrap">
        <div><div class="text-xs text-muted">Showing</div><div class="fw-700">${filtered.length} of ${expenses.length} expenses</div></div>
        <div><div class="text-xs text-muted">Total</div><div class="fw-700" style="color:var(--clr-primary)">${Storage.formatCurrency(total)}</div></div>
        <div><div class="text-xs text-muted">Members</div><div class="fw-700">${trip.members?.length||0}</div></div>
        <div><div class="text-xs text-muted">Per person avg</div><div class="fw-700">${Storage.formatCurrency(trip.members?.length ? total/trip.members.length : 0)}</div></div>
      </div>

      <!-- Expenses list -->
      <div class="card" style="padding:0;overflow:hidden">
        ${filtered.length === 0
          ? `<div class="empty-state" style="padding:48px 24px">
              <i class="fas fa-receipt"></i>
              <h3>No expenses found</h3>
              <p>${expenses.length > 0 ? 'Try adjusting your filters' : 'Add your first expense to get started'}</p>
              ${expenses.length === 0 ? `<button class="btn btn-primary" onclick="Expenses.buildExpenseForm('${trip.id}')"><i class="fas fa-plus"></i> Add Expense</button>` : ''}
            </div>`
          : `<div class="expense-list" style="padding:8px">${filtered.map(e => Expenses.expenseItemHtml(e)).join('')}</div>`}
      </div>
    </div>`;
  }

  function filterExpenses(opts) {
    window._expFilter = { ...(window._expFilter||{}), ...opts };
    Pages.render('expenses');
  }

  function switchTrip(id) {
    Storage.Trips.setActive(id);
    window._expFilter = {};
    Pages.render('expenses');
  }

  /* ======================================================
     SETTLEMENTS PAGE
     ====================================================== */
  function renderSettlements() {
    const activeId = Storage.Trips.getActive();
    const trip     = activeId ? Storage.Trips.get(activeId) : Storage.Trips.getAll()[0];
    App.setTitle('Settlements', trip?.name || '');

    if (!trip) return `<div class="page-content"><div class="empty-state"><i class="fas fa-handshake"></i><h3>No active trip</h3><p>Select a trip to view settlements</p></div></div>`;

    const txs       = Settlements.calculate(trip.id);
    const summary   = Settlements.perPersonSummary(trip.id);
    const totalSpent= Storage.Expenses.totalForTrip(trip.id);

    return `<div class="page-content">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-5);flex-wrap:wrap;gap:12px">
        <div>
          <h2 style="font-size:var(--text-xl);font-weight:700">${escHtml(trip.name)}</h2>
          <p class="text-muted text-sm">Total: ${Storage.formatCurrency(totalSpent)} &bull; ${txs.length} pending settlement${txs.length!==1?'s':''}</p>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary btn-sm" onclick="Settlements.exportCSV('${trip.id}')">
            <i class="fas fa-download"></i> Export CSV
          </button>
          <button class="btn btn-accent btn-sm" onclick="Sheets.syncAll()">
            <img src="https://www.gstatic.com/images/branding/product/1x/sheets_2020q4_32dp.png" width="14" alt="" /> Sync Sheets
          </button>
        </div>
      </div>

      <div class="tabs" style="margin-bottom:var(--space-5)">
        <button class="tab-btn active" data-tab="settle-tab">Settle Up</button>
        <button class="tab-btn" data-tab="summary-tab">Per Person</button>
        <button class="tab-btn" data-tab="breakdown-tab">Breakdown</button>
      </div>

      <!-- Settle Up Tab -->
      <div id="settle-tab" class="tab-content">
        ${txs.length === 0
          ? `<div class="empty-state"><i class="fas fa-check-circle" style="color:var(--clr-accent)"></i><h3 style="color:var(--clr-accent)">All settled up!</h3><p>No pending transactions for this trip</p></div>`
          : `<div style="display:flex;flex-direction:column;gap:12px">${txs.map(tx => Settlements.settlementCardHtml(tx)).join('')}</div>`}
      </div>

      <!-- Per Person Tab -->
      <div id="summary-tab" class="tab-content hidden">
        <div class="card" style="padding:0;overflow:hidden">
          <table class="data-table">
            <thead><tr><th>Member</th><th>Total Paid</th><th>Share</th><th>Balance</th></tr></thead>
            <tbody>
              ${summary.map(m => `<tr>
                <td><div style="display:flex;align-items:center;gap:8px"><div class="avatar avatar-sm">${m.avatar}</div><div><div class="fw-600">${escHtml(m.name)}</div></div></div></td>
                <td class="amount-positive">${Storage.formatCurrency(m.paid)}</td>
                <td>${Storage.formatCurrency(m.share)}</td>
                <td class="${m.net>=0?'amount-positive':'amount-negative'}">${m.net>=0?'+':''}${Storage.formatCurrency(m.net)}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Breakdown Tab -->
      <div id="breakdown-tab" class="tab-content hidden">
        <div class="card">
          <div class="card-title mb-16"><i class="fas fa-chart-pie"></i> Category Breakdown</div>
          ${buildCategoryBreakdown(trip.id)}
        </div>
      </div>
    </div>`;
  }

  /* ======================================================
     FIND TRIP MATE
     ====================================================== */
  function renderFindMate() {
    App.setTitle('Find a Trip Mate', 'Connect with solo travelers');
    const mates = Storage.Community.getMates();
    return `<div class="page-content">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-5);flex-wrap:wrap;gap:12px">
        <div class="search-bar" style="flex:1;max-width:320px">
          <i class="fas fa-search"></i><input type="text" placeholder="Search by name, city or destination…" oninput="Pages.searchMates(this.value)" id="mate-search" />
        </div>
        <button class="btn btn-primary" onclick="Pages.showPostMateModal()">
          <i class="fas fa-user-plus"></i> Post My Profile
        </button>
      </div>
      <div class="community-grid" id="mates-grid">
        ${mates.map(m => mateCardHtml(m)).join('')}
      </div>
    </div>`;
  }

  function mateCardHtml(m) {
    return `<div class="community-card">
      <div class="community-card-header">
        <div class="avatar avatar-lg">${m.avatar}</div>
        ${m.verified ? '<span class="badge badge-green"><i class="fas fa-check-circle"></i> Verified</span>' : ''}
      </div>
      <h3>${escHtml(m.name)}, ${m.age}</h3>
      <p class="text-sm text-muted"><i class="fas fa-map-pin"></i> ${escHtml(m.city)}</p>
      <div class="tags">
        ${(m.destinations||[]).map(d => `<span class="badge badge-primary">${escHtml(d)}</span>`).join('')}
      </div>
      <div class="tags" style="margin-top:4px">
        ${(m.interests||[]).map(i => `<span class="badge badge-gray">${escHtml(i)}</span>`).join('')}
      </div>
      <div class="meta-row">
        <span class="text-xs text-muted">Looking for trip mate</span>
        <button class="btn btn-sm btn-primary" onclick="Pages.contactMate('${m.id}')">Connect</button>
      </div>
    </div>`;
  }

  function searchMates(q) {
    const q2    = q.toLowerCase();
    const mates = Storage.Community.getMates();
    const grid  = document.getElementById('mates-grid');
    if (!grid) return;
    const filtered = q2 ? mates.filter(m =>
      m.name.toLowerCase().includes(q2) ||
      m.city.toLowerCase().includes(q2) ||
      (m.destinations||[]).some(d => d.toLowerCase().includes(q2))
    ) : mates;
    grid.innerHTML = filtered.map(mateCardHtml).join('');
  }

  function showPostMateModal() {
    const user = Storage.User.get();
    Modal.show({
      title: 'Post Your Traveler Profile',
      size: 'lg',
      body: `<div class="form-section">
        <div class="form-row-two">
          <div class="form-group"><label>Age</label><input type="number" id="mate-age" value="${user?.age||''}" min="18" /></div>
          <div class="form-group"><label>City</label><input type="text" id="mate-city" value="${user?.city||''}" placeholder="Mumbai" /></div>
        </div>
        <div class="form-group"><label>Desired Destinations (comma separated)</label>
          <input type="text" id="mate-dests" placeholder="Goa, Manali, Ladakh" /></div>
        <div class="form-group"><label>Interests (comma separated)</label>
          <input type="text" id="mate-interests" placeholder="hiking, photography, food" /></div>
        <div class="form-group"><label>About You</label>
          <textarea id="mate-about" placeholder="Tell others about your travel style…" rows="3"></textarea></div>
      </div>`,
      footer: `<button class="btn btn-secondary" id="mate-cancel">Cancel</button>
               <button class="btn btn-primary" id="mate-post">Post Profile</button>`,
      onOpen: () => {
        document.getElementById('mate-cancel').onclick = Modal.close;
        document.getElementById('mate-post').onclick = () => {
          const user = Storage.User.get();
          const m = {
            id:           Storage.genId(),
            name:         user?.name || 'You',
            avatar:       user?.avatar || user?.name?.[0] || 'U',
            age:          parseInt(document.getElementById('mate-age').value)||25,
            city:         document.getElementById('mate-city').value.trim(),
            destinations: document.getElementById('mate-dests').value.split(',').map(s=>s.trim()).filter(Boolean),
            interests:    document.getElementById('mate-interests').value.split(',').map(s=>s.trim()).filter(Boolean),
            about:        document.getElementById('mate-about').value.trim(),
            verified:     false,
          };
          Storage.Community.saveMate(m);
          Modal.close();
          Toast.show('Profile posted!', 'success');
          Pages.render('find-mate');
        };
      }
    });
  }

  function contactMate(id) {
    const m = Storage.Community.getMates().find(x => x.id === id);
    Toast.show(`Connection request sent to ${m?.name||'traveler'}! (Feature: email/SMS integration)`, 'info');
  }

  /* ======================================================
     FIND GROUPS
     ====================================================== */
  function renderFindGroup() {
    App.setTitle('Find Groups to Join', 'Discover active trip itineraries');
    const groups = Storage.Community.getGroups();
    return `<div class="page-content">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-5);flex-wrap:wrap;gap:12px">
        <div class="search-bar" style="flex:1;max-width:320px">
          <i class="fas fa-search"></i><input type="text" placeholder="Search groups…" oninput="Pages.searchGroups(this.value)" id="group-search" />
        </div>
        <button class="btn btn-primary" onclick="Pages.showPostGroupModal()">
          <i class="fas fa-plus"></i> Post Your Group
        </button>
      </div>
      <div class="community-grid" id="groups-grid">
        ${groups.map(g => groupCardHtml(g)).join('')}
      </div>
    </div>`;
  }

  function groupCardHtml(g) {
    return `<div class="community-card">
      <div class="community-card-header">
        <span style="font-size:2.5rem">${g.emoji||'🗺️'}</span>
        <span class="badge ${g.slots>0?'badge-green':'badge-red'}">${g.slots>0?g.slots+' slots left':'Full'}</span>
      </div>
      <h3>${escHtml(g.name)}</h3>
      <p class="text-sm text-muted"><i class="fas fa-map-pin"></i> ${escHtml(g.destination)}</p>
      <p class="text-sm text-muted"><i class="fas fa-calendar"></i> ${escHtml(g.dates)}</p>
      <div class="tags" style="margin-top:8px">
        ${(g.tags||[]).map(t => `<span class="badge badge-primary">${escHtml(t)}</span>`).join('')}
      </div>
      <div class="meta-row">
        <div><div class="text-xs text-muted">Budget est.</div><div class="fw-600">${escHtml(g.budget)}</div></div>
        <button class="btn btn-sm btn-primary" ${g.slots<=0?'disabled':''} onclick="Pages.requestJoin('${g.id}')">
          ${g.slots>0?'Request to Join':'Full'}
        </button>
      </div>
    </div>`;
  }

  function searchGroups(q) {
    const q2 = q.toLowerCase();
    const grid = document.getElementById('groups-grid');
    if (!grid) return;
    const filtered = q2 ? Storage.Community.getGroups().filter(g =>
      g.name.toLowerCase().includes(q2) || g.destination.toLowerCase().includes(q2) ||
      (g.tags||[]).some(t => t.toLowerCase().includes(q2))
    ) : Storage.Community.getGroups();
    grid.innerHTML = filtered.map(groupCardHtml).join('');
  }

  function showPostGroupModal() {
    Modal.show({
      title: 'Post Your Trip Group',
      size: 'lg',
      body: `<div class="form-section">
        <div class="form-group"><label>Group Name *</label><input type="text" id="grp-name" placeholder="Manali Winter Trek 2024" /></div>
        <div class="form-row-two">
          <div class="form-group"><label>Destination *</label><input type="text" id="grp-dest" placeholder="Manali, HP" /></div>
          <div class="form-group"><label>Dates</label><input type="text" id="grp-dates" placeholder="Dec 20–27" /></div>
        </div>
        <div class="form-row-two">
          <div class="form-group"><label>Budget per person</label><input type="text" id="grp-budget" placeholder="₹15,000" /></div>
          <div class="form-group"><label>Open slots</label><input type="number" id="grp-slots" min="1" value="2" /></div>
        </div>
        <div class="form-group"><label>Tags (comma separated)</label><input type="text" id="grp-tags" placeholder="trekking, snow, offroad" /></div>
        <div class="form-group"><label>Description</label><textarea id="grp-desc" rows="3" placeholder="Describe your trip…"></textarea></div>
      </div>`,
      footer: `<button class="btn btn-secondary" id="grp-cancel">Cancel</button>
               <button class="btn btn-primary" id="grp-post">Post Group</button>`,
      onOpen: () => {
        document.getElementById('grp-cancel').onclick = Modal.close;
        document.getElementById('grp-post').onclick = () => {
          const name = document.getElementById('grp-name').value.trim();
          if (!name) { Toast.show('Group name required', 'error'); return; }
          const emojis = ['🏔️','🏖️','🌴','🕌','🤿','⛵','🚙','🚂','✈️','🏕️'];
          const g = {
            id:          Storage.genId(),
            name, emoji: emojis[Math.floor(Math.random()*emojis.length)],
            destination: document.getElementById('grp-dest').value.trim(),
            dates:       document.getElementById('grp-dates').value.trim(),
            budget:      document.getElementById('grp-budget').value.trim(),
            slots:       parseInt(document.getElementById('grp-slots').value)||2,
            members:     1,
            organizer:   Storage.User.get()?.name || 'You',
            tags:        document.getElementById('grp-tags').value.split(',').map(s=>s.trim()).filter(Boolean),
            description: document.getElementById('grp-desc').value.trim(),
          };
          Storage.Community.saveGroup(g);
          Modal.close();
          Toast.show('Group posted!', 'success');
          Pages.render('find-group');
        };
      }
    });
  }

  function requestJoin(id) {
    const g = Storage.Community.getGroups().find(x => x.id === id);
    Toast.show(`Join request sent for "${g?.name}"! Organizer will contact you. (Email/SMS integration)`, 'success');
  }

  /* ======================================================
     REWARDS
     ====================================================== */
  function renderRewards() {
    const coins = Storage.Coins.get();
    App.setTitle('Rewards', 'Redeem your loyalty coins');
    const rewards = [
      { id: 'r1', title: '10% off at The Mountain Cafe',  partner: 'Kasol',        coins: 100, emoji: '☕', desc: 'Get 10% discount on your next visit' },
      { id: 'r2', title: 'Free room upgrade at OYO',       partner: 'Pan India',    coins: 250, emoji: '🏨', desc: 'Complimentary upgrade on standard room' },
      { id: 'r3', title: '₹50 off Zomato order',          partner: 'Zomato',       coins: 150, emoji: '🍕', desc: 'Valid on orders above ₹299' },
      { id: 'r4', title: 'Free cable car ticket',          partner: 'Manali Resort',coins: 500, emoji: '🚡', desc: 'One complimentary ropeway ride' },
      { id: 'r5', title: '15% off adventure activities',   partner: 'AdventurePal', coins: 200, emoji: '🧗', desc: 'Rock climbing, rappelling, etc.' },
      { id: 'r6', title: '₹100 off next trip hotel',       partner: 'MakeMyTrip',   coins: 300, emoji: '🏩', desc: 'Apply code at checkout' },
    ];

    return `<div class="page-content">
      <div class="rewards-header">
        <div style="position:relative;z-index:1">
          <p style="opacity:.8;font-size:var(--text-sm);margin-bottom:4px">Your Loyalty Balance</p>
          <div class="rewards-coins"><i class="fas fa-coins" style="font-size:2rem;margin-right:8px;color:#fbbf24"></i>${coins} coins</div>
          <p style="opacity:.75;font-size:var(--text-sm);margin-top:8px">Earn 5 coins per expense &bull; 20 per Sheets sync &bull; 50 on sign-up</p>
        </div>
      </div>

      <!-- How to earn -->
      <div class="card" style="margin-bottom:var(--space-5)">
        <div class="card-title mb-16"><i class="fas fa-info-circle"></i> How to earn coins</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px">
          ${[['fas fa-receipt','Add expense','5 coins'],['fas fa-table','Sync to Sheets','20 coins'],['fas fa-user-plus','Invite a friend','25 coins'],['fas fa-map-marked-alt','Create a trip','10 coins']].map(([icon,label,val]) =>
            `<div style="text-align:center;padding:14px;border:1px solid var(--border-color);border-radius:var(--radius-md);background:var(--bg-app)">
              <i class="${icon}" style="font-size:24px;color:var(--clr-primary);margin-bottom:8px;display:block"></i>
              <div style="font-weight:600;font-size:var(--text-sm)">${label}</div>
              <div class="coin-chip" style="margin:6px auto 0;width:fit-content">${val}</div>
            </div>`
          ).join('')}
        </div>
      </div>

      <h3 style="font-size:var(--text-lg);font-weight:700;margin-bottom:var(--space-4)">Available Rewards</h3>
      <div class="rewards-grid">
        ${rewards.map(r => `
          <div class="reward-item">
            <div style="font-size:2.5rem;text-align:center;padding:12px;background:var(--bg-app);border-radius:var(--radius-md)">${r.emoji}</div>
            <div style="flex:1">
              <h4>${escHtml(r.title)}</h4>
              <p class="text-xs text-muted">${escHtml(r.desc)}</p>
              <p class="text-xs text-muted"><i class="fas fa-store"></i> ${escHtml(r.partner)}</p>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-top:auto">
              <span class="coin-chip"><i class="fas fa-coins"></i> ${r.coins} coins</span>
              <button class="btn btn-sm ${coins>=r.coins?'btn-primary':'btn-secondary'}"
                onclick="Pages.redeemReward('${r.id}','${r.coins}','${escHtml(r.title)}')"
                ${coins<r.coins?'disabled':''}>
                ${coins>=r.coins ? 'Redeem' : 'Need '+(r.coins-coins)+' more'}
              </button>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
  }

  function redeemReward(id, cost, title) {
    const coins = Storage.Coins.get();
    const c     = parseInt(cost);
    if (coins < c) { Toast.show('Not enough coins', 'error'); return; }
    Modal.confirm(`Redeem "${title}"?`, `This will use ${c} coins from your balance.`, () => {
      Storage.User.update({ coins: coins - c });
      document.getElementById('coins-count') && (document.getElementById('coins-count').textContent = coins - c);
      Toast.show(`Redeemed! Check your email for the voucher code.`, 'success');
      Pages.render('rewards');
    });
  }

  /* ======================================================
     PROFILE
     ====================================================== */
  function renderProfile() {
    const user = Storage.User.get() || {};
    App.setTitle('My Profile');
    return `<div class="page-content">
      <div class="profile-header">
        <div class="profile-avatar-wrap">
          <div class="profile-avatar">${user.avatar||user.name?.[0]||'U'}</div>
          <button class="profile-edit-btn" title="Change avatar"><i class="fas fa-camera"></i></button>
        </div>
        <div style="flex:1">
          <h2 style="font-size:var(--text-2xl);font-weight:800">${escHtml(user.name||'Your Name')}</h2>
          <p class="text-muted text-sm">${escHtml(user.email||'')}</p>
          <div style="display:flex;gap:12px;margin-top:10px">
            <span class="coin-chip"><i class="fas fa-coins"></i> ${user.coins||0} coins</span>
            <span class="badge badge-gray">Member since ${Storage.formatDate(user.joinedAt||Date.now())}</span>
            ${user.verified ? '<span class="badge badge-green"><i class="fas fa-check-circle"></i> Verified</span>' : ''}
          </div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="Pages.showEditProfileModal()"><i class="fas fa-edit"></i> Edit</button>
      </div>

      <div class="stats-grid" style="margin-bottom:var(--space-5)">
        ${statCard('🗺️','Trips', Storage.Trips.getAll().length,'','#4f46e5','#ede9fe')}
        ${statCard('🧾','Expenses', Storage.Expenses.getAll().length,'','#10b981','#d1fae5')}
        ${statCard('💰','Total Spent', Storage.formatCurrency(Storage.Expenses.getAll().reduce((s,e)=>s+e.amount,0)),'','#f59e0b','#fef3c7')}
        ${statCard('🪙','Coins', user.coins||0,'','#0ea5e9','#e0f2fe')}
      </div>

      <div class="card">
        <div class="card-title mb-16"><i class="fas fa-id-card"></i> Personal Information</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px">
          ${[['fas fa-user','Full Name',user.name||'—'],['fas fa-envelope','Email',user.email||'—'],['fas fa-phone','Phone',user.phone||'—'],['fas fa-map-pin','Home City',user.city||'—'],['fas fa-language','Preferred Language',user.lang||'English'],['fas fa-coins','Currency',user.currency||'INR']].map(([icon,label,val]) =>
            `<div><div class="text-xs text-muted" style="margin-bottom:3px"><i class="${icon}" style="margin-right:4px"></i>${label}</div><div class="fw-600 text-sm">${escHtml(val)}</div></div>`
          ).join('')}
        </div>
      </div>
    </div>`;
  }

  function showEditProfileModal() {
    const user = Storage.User.get() || {};
    Modal.show({
      title: 'Edit Profile',
      body: `<div class="form-section">
        <div class="form-row-two">
          <div class="form-group"><label>First Name</label><input id="p-fname" value="${escHtml(user.fname||'')}" /></div>
          <div class="form-group"><label>Last Name</label><input id="p-lname" value="${escHtml(user.lname||'')}" /></div>
        </div>
        <div class="form-group"><label>Phone</label><input id="p-phone" value="${escHtml(user.phone||'')}" /></div>
        <div class="form-group"><label>Home City</label><input id="p-city" value="${escHtml(user.city||'')}" /></div>
        <div class="form-group"><label>UPI ID</label><input id="p-upi" value="${escHtml(user.upi||'')}" placeholder="name@upi" /></div>
        <div class="form-group"><label>Bio</label><textarea id="p-bio" rows="2">${escHtml(user.bio||'')}</textarea></div>
      </div>`,
      footer: `<button class="btn btn-secondary" id="p-cancel">Cancel</button>
               <button class="btn btn-primary" id="p-save">Save Changes</button>`,
      onOpen: () => {
        document.getElementById('p-cancel').onclick = Modal.close;
        document.getElementById('p-save').onclick = () => {
          const fname = document.getElementById('p-fname').value.trim();
          const lname = document.getElementById('p-lname').value.trim();
          Storage.User.update({
            fname, lname, name: fname+' '+lname,
            avatar: fname?.[0]?.toUpperCase()||user.avatar,
            phone:  document.getElementById('p-phone').value.trim(),
            city:   document.getElementById('p-city').value.trim(),
            upi:    document.getElementById('p-upi').value.trim(),
            bio:    document.getElementById('p-bio').value.trim(),
          });
          Modal.close(); Toast.show('Profile updated!', 'success');
          Pages.render('profile');
          App.updateUserUI();
        };
      }
    });
  }

  /* ======================================================
     SETTINGS
     ====================================================== */
  function renderSettings() {
    const s = Storage.Settings.get();
    App.setTitle('Settings');
    const currencies = APP.currencies.map(c =>
      `<option value="${c.code}" ${s.currency===c.code?'selected':''}>${c.symbol} ${c.name}</option>`).join('');

    return `<div class="page-content">
      <div class="settings-group">
        <div class="settings-group-title">Appearance</div>
        <div class="settings-item">
          <div class="settings-item-info"><span>Dark Mode</span><small>Switch between light and dark themes</small></div>
          <label class="toggle-switch"><input type="checkbox" id="dark-mode-toggle" ${s.theme==='dark'?'checked':''} onchange="App.toggleTheme(this.checked)" /><span class="toggle-slider"></span></label>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">Currency & Locale</div>
        <div class="settings-item">
          <div class="settings-item-info"><span>Default Currency</span><small>Used for all expense displays</small></div>
          <select onchange="Storage.Settings.update({currency:this.value});Pages.render('settings')" style="padding:6px 28px 6px 10px;border:1.5px solid var(--border-color);border-radius:var(--radius-md);background:var(--bg-input);color:var(--text-primary);font-size:var(--text-sm)">${currencies}</select>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">Google Sheets Sync</div>
        <div class="settings-item">
          <div class="settings-item-info"><span>Apps Script URL</span><small>${s.appsScriptUrl ? 'Connected ✅' : 'Not configured'}</small></div>
          <button class="btn btn-secondary btn-sm" onclick="Sheets.showSetupModal()">Configure</button>
        </div>
        <div class="settings-item">
          <div class="settings-item-info"><span>Auto-sync on reconnect</span><small>Sync queued data when internet returns</small></div>
          <label class="toggle-switch"><input type="checkbox" checked /><span class="toggle-slider"></span></label>
        </div>
        <div class="settings-item">
          <div class="settings-item-info"><span>Manual Sync Now</span><small>Push all data to Google Sheets</small></div>
          <button class="btn btn-accent btn-sm" onclick="Sheets.syncAll()"><i class="fas fa-sync"></i> Sync</button>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">Notifications</div>
        <div class="settings-item">
          <div class="settings-item-info"><span>Push Notifications</span><small>Settlement reminders and updates</small></div>
          <label class="toggle-switch"><input type="checkbox" ${s.notifications?'checked':''} onchange="Storage.Settings.update({notifications:this.checked})" /><span class="toggle-slider"></span></label>
        </div>
        <div class="settings-item">
          <div class="settings-item-info"><span>24h Trip End Reminder</span><small>Remind to settle up before trip ends</small></div>
          <label class="toggle-switch"><input type="checkbox" ${s.remind24h?'checked':''} onchange="Storage.Settings.update({remind24h:this.checked})" /><span class="toggle-slider"></span></label>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">Data & Privacy</div>
        <div class="settings-item">
          <div class="settings-item-info"><span>Export All Data</span><small>Download a JSON backup of all your data</small></div>
          <button class="btn btn-secondary btn-sm" onclick="Pages.exportAllData()"><i class="fas fa-download"></i> Export</button>
        </div>
        <div class="settings-item">
          <div class="settings-item-info"><span>Clear All Data</span><small style="color:var(--clr-danger)">Permanently delete all local data</small></div>
          <button class="btn btn-danger btn-sm" onclick="Pages.clearAllData()"><i class="fas fa-trash"></i> Clear</button>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">About</div>
        <div class="settings-item"><div class="settings-item-info"><span>Version</span></div><span class="text-muted text-sm">GoPlaces v${APP.version}</span></div>
        <div class="settings-item"><div class="settings-item-info"><span>GitHub</span></div><a href="https://github.com" target="_blank" class="text-sm" style="color:var(--clr-primary)">View Source</a></div>
      </div>
    </div>`;
  }

  function exportAllData() {
    const data = {
      user: Storage.User.get(),
      trips: Storage.Trips.getAll(),
      expenses: Storage.Expenses.getAll(),
      settings: Storage.Settings.get(),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'goplaces_backup.json';
    a.click();
    Toast.show('Data exported!', 'success');
  }

  function clearAllData() {
    Modal.confirm('Clear all data?', 'This will permanently delete all trips, expenses, and settings. You will be signed out.', () => {
      localStorage.clear();
      Toast.show('All data cleared. Signing out…', 'info');
      setTimeout(() => location.reload(), 1500);
    });
  }

  /* ======================================================
     LANDING PAGE (About GoPlaces)
     ====================================================== */
  function renderLanding() {
    App.setTitle('About GoPlaces');
    const features = [
      ['fa-receipt','Smart Expense Splitting','Track every expense. Our algorithm minimizes the number of settlements needed, saving time and awkward conversations.','#4f46e5','#ede9fe'],
      ['fa-wifi-slash','Works Offline','Zero coverage? No problem. GoPlaces caches everything locally and syncs automatically when you reconnect.','#0ea5e9','#e0f2fe'],
      ['fa-table','Google Sheets Sync','One click to push all your data to a beautifully formatted Google Sheet — your data, in your Drive, forever.','#10b981','#d1fae5'],
      ['fa-users','Find Travel Companions','Solo traveler? Connect with verified travel mates or discover groups looking for members.','#f59e0b','#fef3c7'],
      ['fa-gift','Loyalty Rewards','Earn coins for every action. Redeem for discounts at partner hotels, cafes, and resorts.','#8b5cf6','#ede9fe'],
      ['fa-store','Sponsor Marketplace','Local businesses can advertise directly to travelers planning or on their trips.','#ec4899','#fce7f3'],
    ];

    return `<div class="page-content">
      <div class="landing-hero">
        <div style="font-size:3rem;margin-bottom:16px">🗺️</div>
        <h1>Travel Together, <span style="color:var(--clr-primary)">Split Fairly</span></h1>
        <p>GoPlaces is your end-to-end, offline-resilient group travel companion. Track expenses, split bills, settle debts, and connect with fellow travelers — all in one place.</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-primary btn-lg" onclick="App.navigate('trips')"><i class="fas fa-map-marked-alt"></i> Start a Trip</button>
          <button class="btn btn-secondary btn-lg" onclick="App.navigate('find-mate')"><i class="fas fa-users"></i> Find Companions</button>
        </div>
      </div>

      <!-- Problem / Solution -->
      <div class="card" style="margin-bottom:var(--space-6)">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-6);align-items:start">
          <div>
            <div style="font-size:2rem;margin-bottom:8px">😤</div>
            <h3 style="color:var(--clr-danger);margin-bottom:8px">The Problem</h3>
            <ul style="font-size:var(--text-sm);color:var(--text-secondary);display:flex;flex-direction:column;gap:8px;padding-left:16px;list-style:disc">
              <li>Tracking group expenses in spreadsheets is tedious and error-prone</li>
              <li>Mountains and remote areas have no internet — apps become useless</li>
              <li>Calculating who owes whom leads to confusion and arguments</li>
              <li>No single app combines expense splitting <em>and</em> travel social features</li>
            </ul>
          </div>
          <div>
            <div style="font-size:2rem;margin-bottom:8px">✅</div>
            <h3 style="color:var(--clr-accent);margin-bottom:8px">GoPlaces Solution</h3>
            <ul style="font-size:var(--text-sm);color:var(--text-secondary);display:flex;flex-direction:column;gap:8px;padding-left:16px;list-style:disc">
              <li>One-click expense logging with smart auto-split</li>
              <li>Full offline support with IndexedDB caching</li>
              <li>Debt-minimization algorithm reduces transactions to minimum</li>
              <li>Integrated community, rewards, and Google Sheets sync</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Features -->
      <h2 style="text-align:center;font-size:var(--text-2xl);font-weight:800;margin-bottom:var(--space-5)">Everything You Need</h2>
      <div class="feature-grid" style="margin-bottom:var(--space-8)">
        ${features.map(([icon,title,desc,color,bg]) => `
          <div class="feature-item">
            <div class="icon" style="background:${bg};color:${color}"><i class="fas ${icon}"></i></div>
            <h3>${title}</h3><p>${desc}</p>
          </div>`).join('')}
      </div>

      <!-- For Partners -->
      <div class="card" style="background:linear-gradient(135deg,var(--clr-primary-10),transparent)">
        <h2 style="font-size:var(--text-xl);font-weight:800;margin-bottom:12px">🏪 Partner with GoPlaces</h2>
        <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-bottom:16px">
          Reach travelers at the exact moment they're planning their next adventure. GoPlaces's sponsored listings appear directly in our travel companion app.
        </p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:16px">
          ${[['🏨','Hotels & Resorts','Capture group bookings from multi-member trips'],['🍽️','Restaurants & Cafes','Target hungry travelers in your city'],['🎡','Activity Providers','Promote tours, treks, and adventures'],['🛕','Local Businesses','Reach travelers in your locality']].map(([e,t,d])=>
            `<div style="padding:14px;background:var(--bg-card);border-radius:var(--radius-md);border:1px solid var(--border-color)">
              <div style="font-size:1.5rem;margin-bottom:6px">${e}</div>
              <div class="fw-600 text-sm">${t}</div>
              <div class="text-xs text-muted">${d}</div>
            </div>`
          ).join('')}
        </div>
        <button class="btn btn-primary" onclick="App.navigate('contact')"><i class="fas fa-handshake"></i> Become a Partner</button>
      </div>
    </div>`;
  }

  /* ======================================================
     FAQ
     ====================================================== */
  function renderFAQ() {
    App.setTitle('FAQ', 'Frequently Asked Questions');
    const faqs = [
      ['Is GoPlaces free to use?', 'Yes! GoPlaces is completely free for individuals. We monetize through optional partner sponsor placements and premium features.'],
      ['How does the offline mode work?', 'GoPlaces uses IndexedDB, a browser-native database that persists even without internet. Any data you enter offline is queued and automatically synced to Google Sheets when you reconnect.'],
      ['How is my data secured?', 'All data is stored in your own browser (localStorage/IndexedDB) and in your personal Google Drive via Sheets. GoPlaces never stores your data on external servers.'],
      ['What is a UPI ID and why do I need it?', 'UPI (Unified Payments Interface) is India\'s instant payment system. Adding your UPI ID lets other group members send you payment directly from within the app via GPay, PhonePe, or Paytm.'],
      ['How does the debt minimization work?', 'GoPlaces calculates the net balance for each person, then uses a greedy algorithm to calculate the minimum number of transactions needed to settle all debts. This reduces the number of payments from O(n²) to just O(n).'],
      ['What is the coin worth?', '1 coin ≈ ₹0.10 in partner discount value. Example: 100 coins = ₹10 off at a partner hotel. Coins are earned automatically as you use the app.'],
      ['Can I use GoPlaces for international trips?', 'Yes! GoPlaces supports multiple currencies (₹, $, €, £, ¥ and more). You can set your preferred currency in Settings.'],
      ['How do I set up Google Sheets sync?', 'Go to Settings → Google Sheets, click Configure, and follow the step-by-step guide to deploy your personal Apps Script Web App. It takes about 5 minutes and requires no coding knowledge.'],
      ['How many members can a trip have?', 'GoPlaces has no hard limit on trip members. It\'s been tested with groups of up to 50 people. Performance is excellent for typical group sizes (5–20).'],
      ['Can I run GoPlaces from a local file?', 'Yes! Since GoPlaces is pure HTML/CSS/JS with no backend server required, you can open index.html directly from your computer or host it on GitHub Pages.'],
    ];

    return `<div class="page-content">
      <div class="page-hero">
        <h1>Frequently Asked Questions</h1>
        <p>Everything you need to know about GoPlaces</p>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;max-width:760px">
        ${faqs.map(([q,a]) => `
          <div class="accordion-item">
            <div class="accordion-header" onclick="Pages.toggleAccordion(this)">
              <span>${escHtml(q)}</span>
              <i class="fas fa-chevron-down"></i>
            </div>
            <div class="accordion-body">
              <p>${escHtml(a)}</p>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
  }

  function toggleAccordion(header) {
    header.classList.toggle('open');
    const body = header.nextElementSibling;
    body.classList.toggle('open');
  }

  /* ======================================================
     SPONSORS
     ====================================================== */
  function renderSponsors() {
    App.setTitle('Partner Sponsors', 'Exclusive deals for GoPlaces travelers');
    const sponsors = [
      { name: 'The Mountain Cafe',     city: 'Kasol',      offer: '10% off all food items',        emoji: '☕', tag: 'Food & Cafe' },
      { name: 'OYO Rooms',             city: 'Pan India',   offer: 'Free room upgrade for groups 4+',emoji: '🏨', tag: 'Hotel' },
      { name: 'AdventurePal',          city: 'Manali',      offer: '15% off adventure packages',     emoji: '🧗', tag: 'Adventure' },
      { name: 'Kerala Houseboat Tours',city: 'Alleppey',    offer: 'Special group discount on boats', emoji: '⛵', tag: 'Activities' },
      { name: 'Spiti Camping Co.',     city: 'Spiti Valley',offer: 'Free bonfire night with booking', emoji: '🏕️', tag: 'Camping' },
      { name: 'Rajasthan Heritage Walk',city:'Jaipur',      offer: '2 for 1 heritage tour',           emoji: '🕌', tag: 'Culture' },
    ];
    return `<div class="page-content">
      <div class="page-hero">
        <h1>Partner Sponsors</h1>
        <p>Exclusive deals curated for GoPlaces travelers</p>
      </div>

      <div class="sheets-banner" style="margin-bottom:var(--space-5)">
        <i class="fas fa-store"></i>
        <div>Are you a hotel, cafe, or activity provider? <span class="cta-link" onclick="App.navigate('contact')">Partner with us →</span> and reach thousands of group travelers daily.</div>
      </div>

      <div class="sponsor-grid">
        ${sponsors.map(s => `
          <div class="sponsor-card">
            <div class="sponsor-card-img">${s.emoji}</div>
            <div class="sponsor-card-body">
              <span class="badge badge-primary" style="margin-bottom:8px">${s.tag}</span>
              <h3>${escHtml(s.name)}</h3>
              <p><i class="fas fa-map-pin"></i> ${escHtml(s.city)}</p>
              <div style="font-size:var(--text-sm);font-weight:600;color:var(--clr-accent);margin-bottom:12px">🎁 ${escHtml(s.offer)}</div>
              <button class="btn btn-primary btn-sm btn-full" onclick="Toast.show('Offer code: WESPLIT10 – present at ${escHtml(s.name)}', 'success', 6000)">
                Claim Offer
              </button>
            </div>
          </div>`).join('')}
      </div>

      <div class="card" style="margin-top:var(--space-8);text-align:center">
        <h3 style="margin-bottom:8px">Want to advertise here?</h3>
        <p class="text-muted text-sm" style="margin-bottom:16px">Reach active group travelers planning their next trip. Affordable rates, high intent audience.</p>
        <button class="btn btn-primary" onclick="App.navigate('contact')"><i class="fas fa-envelope"></i> Get in Touch</button>
      </div>
    </div>`;
  }

  /* ======================================================
     CONTACT US
     ====================================================== */
  function renderContact() {
    App.setTitle('Contact Us');
    return `<div class="page-content">
      <div class="page-hero">
        <h1>Get in Touch</h1>
        <p>Have a question, partnership inquiry, or just want to say hi? We'd love to hear from you.</p>
      </div>
      <div class="contact-grid">
        <!-- Form -->
        <div class="card">
          <div class="card-title mb-16"><i class="fas fa-envelope"></i> Send a Message</div>
          <form id="contact-form" class="form-section" novalidate>
            <div class="form-row-two">
              <div class="form-group"><label>Your Name *</label><input id="ct-name" placeholder="John Doe" required /></div>
              <div class="form-group"><label>Email *</label><input type="email" id="ct-email" placeholder="you@example.com" required /></div>
            </div>
            <div class="form-group"><label>Subject *</label>
              <select id="ct-subject">
                <option value="">Select a topic…</option>
                <option>General Enquiry</option>
                <option>Partnership / Sponsorship</option>
                <option>Technical Support</option>
                <option>Feedback</option>
                <option>Press & Media</option>
                <option>Other</option>
              </select>
            </div>
            <div class="form-group"><label>Message *</label>
              <textarea id="ct-message" rows="5" placeholder="Tell us more…" required></textarea>
            </div>
            <button type="submit" class="btn btn-primary btn-full"><i class="fas fa-paper-plane"></i> Send Message</button>
          </form>
        </div>

        <!-- Contact info -->
        <div>
          <div class="card" style="margin-bottom:var(--space-4)">
            <div class="card-title mb-16"><i class="fas fa-info-circle"></i> Contact Details</div>
            ${[['fas fa-envelope','Email','hello@goplaces.app'],['fas fa-phone','Phone','+91 98765 43210'],['fas fa-map-pin','Address','Mumbai, Maharashtra, India'],['fas fa-clock','Response Time','Within 24 hours']].map(([icon,label,val]) =>
              `<div class="contact-info-item">
                <div class="contact-icon"><i class="${icon}"></i></div>
                <div><div class="text-xs text-muted">${label}</div><div class="fw-600 text-sm">${escHtml(val)}</div></div>
              </div>`
            ).join('')}
          </div>
          <div class="card">
            <div class="card-title mb-16"><i class="fas fa-share-alt"></i> Follow Us</div>
            <div style="display:flex;gap:10px">
              ${[['fab fa-twitter','Twitter','#'],['fab fa-instagram','Instagram','#'],['fab fa-github','GitHub','https://github.com'],['fab fa-linkedin','LinkedIn','#']].map(([icon,name,url]) =>
                `<a href="${url}" target="_blank" class="icon-btn" title="${name}" style="border:1.5px solid var(--border-color)"><i class="${icon}"></i></a>`
              ).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }

  /* ======================================================
     SUGGEST / BUG REPORT
     ====================================================== */
  function renderSuggest() {
    App.setTitle('Suggest a Feature / Report a Bug');
    const reports = Storage.Reports.getAll().slice(0, 10);
    return `<div class="page-content">
      <div class="page-hero">
        <h1>Your Feedback Matters</h1>
        <p>Help us make GoPlaces better for everyone. Suggest features or report bugs — every submission is reviewed.</p>
      </div>
      <div class="contact-grid">
        <div class="card">
          <div class="card-title mb-16"><i class="fas fa-lightbulb"></i> Submit Feedback</div>
          <form id="suggest-form" class="form-section" novalidate>
            <div class="form-group"><label>Type</label>
              <select id="sg-type">
                <option value="feature">💡 Feature Suggestion</option>
                <option value="bug">🐛 Bug Report</option>
                <option value="improvement">⚡ Improvement</option>
                <option value="ux">🎨 UI/UX Feedback</option>
              </select>
            </div>
            <div class="form-group"><label>Title *</label>
              <input id="sg-title" placeholder="Short, descriptive title" required /></div>
            <div class="form-group"><label>Description *</label>
              <textarea id="sg-desc" rows="4" placeholder="Describe your suggestion or bug in detail…" required></textarea>
            </div>
            <div class="form-group"><label>Steps to Reproduce (for bugs)</label>
              <textarea id="sg-steps" rows="3" placeholder="1. Go to...\n2. Click on...\n3. See error"></textarea>
            </div>
            <div class="form-group"><label>Priority</label>
              <select id="sg-priority">
                <option value="low">Low</option>
                <option value="medium" selected>Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <button type="submit" class="btn btn-primary btn-full"><i class="fas fa-paper-plane"></i> Submit</button>
          </form>
        </div>
        <div>
          <div class="card">
            <div class="card-title mb-16"><i class="fas fa-list"></i> Recent Submissions</div>
            ${reports.length === 0
              ? `<div class="empty-state" style="padding:24px"><i class="fas fa-inbox"></i><p>No submissions yet</p></div>`
              : reports.map(r => `
                <div style="padding:12px;border-bottom:1px solid var(--border-color)">
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                    <span class="badge ${r.type==='bug'?'badge-red':r.type==='feature'?'badge-primary':'badge-yellow'}">${r.type}</span>
                    <span class="badge ${r.priority==='critical'?'badge-red':r.priority==='high'?'badge-yellow':'badge-gray'}">${r.priority}</span>
                  </div>
                  <div class="fw-600 text-sm">${escHtml(r.title)}</div>
                  <div class="text-xs text-muted">${Storage.timeAgo(r.ts)}</div>
                </div>`).join('')}
          </div>
        </div>
      </div>
    </div>`;
  }

  /* ======================================================
     FORM HANDLERS (Contact, Suggest)
     ====================================================== */
  function setupForms() {
    document.addEventListener('submit', (e) => {
      if (e.target.id === 'contact-form') {
        e.preventDefault();
        const name    = document.getElementById('ct-name')?.value.trim();
        const email   = document.getElementById('ct-email')?.value.trim();
        const subject = document.getElementById('ct-subject')?.value;
        const msg     = document.getElementById('ct-message')?.value.trim();
        if (!name||!email||!subject||!msg) { Toast.show('Please fill all required fields', 'error'); return; }
        Toast.show('Message sent! We\'ll get back to you within 24 hours.', 'success');
        e.target.reset();
      }
      if (e.target.id === 'suggest-form') {
        e.preventDefault();
        const title = document.getElementById('sg-title')?.value.trim();
        const desc  = document.getElementById('sg-desc')?.value.trim();
        if (!title||!desc) { Toast.show('Please fill title and description', 'error'); return; }
        Storage.Reports.add({
          type:     document.getElementById('sg-type')?.value,
          title,
          desc,
          steps:    document.getElementById('sg-steps')?.value.trim(),
          priority: document.getElementById('sg-priority')?.value,
        });
        Toast.show('Thank you for your feedback! We review all submissions.', 'success');
        e.target.reset();
        Pages.render('suggest');
      }
    });
  }

  /* ======================================================
     RENDER DISPATCHER
     ====================================================== */
  function render(page) {
    const container = document.getElementById('page-container');
    if (!container) return;

    let html = '';
    switch(page) {
      case 'dashboard':   html = renderDashboard();   break;
      case 'trips':       html = renderTrips();        break;
      case 'expenses':    html = renderExpenses();     break;
      case 'settlements': html = renderSettlements();  break;
      case 'find-mate':   html = renderFindMate();     break;
      case 'find-group':  html = renderFindGroup();    break;
      case 'rewards':     html = renderRewards();      break;
      case 'profile':     html = renderProfile();      break;
      case 'settings':    html = renderSettings();     break;
      case 'landing':     html = renderLanding();      break;
      case 'faq':         html = renderFAQ();          break;
      case 'sponsors':    html = renderSponsors();     break;
      case 'contact':     html = renderContact();      break;
      case 'suggest':     html = renderSuggest();      break;
      default:            html = renderDashboard();    break;
    }

    container.innerHTML = html;

    // Setup tab switching
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabGroup = btn.closest('.tabs');
        tabGroup.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tabId = btn.dataset.tab;
        document.querySelectorAll('.tab-content').forEach(tc => tc.classList.add('hidden'));
        document.getElementById(tabId)?.classList.remove('hidden');
      });
    });
  }

  return {
    render, filterTrips, showAddTripModal, showEditTripModal, deleteTrip, openTrip,
    removeTempMember, saveTripModal, filterExpenses, switchTrip, toggleAccordion,
    redeemReward, showEditProfileModal, exportAllData, clearAllData, setupForms,
    searchMates, searchGroups, showPostMateModal, showPostGroupModal, contactMate, requestJoin,
  };
})();
