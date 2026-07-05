/* ============================================================
   GoPlaces – Local Storage & Offline Queue
   Offline-first: IndexedDB for persistence, queues pending
   sync operations when offline.
   ============================================================ */
'use strict';

const Storage = (() => {
  const PREFIX = 'goplaces_';
  const DB_NAME = 'goplaces_db';
  const DB_VER  = 1;
  let db = null;

  /* ---- IndexedDB init ---- */
  function initDB() {
    return new Promise((resolve, reject) => {
      if (db) { resolve(db); return; }
      const req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('pending_ops')) {
          db.createObjectStore('pending_ops', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('trips'))    db.createObjectStore('trips', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('expenses')) db.createObjectStore('expenses', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('members'))  db.createObjectStore('members', { keyPath: 'id' });
      };
      req.onsuccess = e => { db = e.target.result; resolve(db); };
      req.onerror   = e => { console.warn('IndexedDB error', e); resolve(null); };
    });
  }

  /* ---- Generic IDB helpers ---- */
  async function idbPut(storeName, obj) {
    const database = await initDB();
    if (!database) return;
    return new Promise((resolve, reject) => {
      const tx = database.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(obj);
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
  }

  async function idbGetAll(storeName) {
    const database = await initDB();
    if (!database) return [];
    return new Promise((resolve) => {
      const tx = database.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror   = () => resolve([]);
    });
  }

  async function idbDelete(storeName, id) {
    const database = await initDB();
    if (!database) return;
    return new Promise((resolve) => {
      const tx = database.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).delete(id);
      tx.oncomplete = resolve;
    });
  }

  /* ---- LocalStorage helpers ---- */
  function ls_get(key, def = null) {
    try {
      const v = localStorage.getItem(PREFIX + key);
      return v ? JSON.parse(v) : def;
    } catch { return def; }
  }

  function ls_set(key, value) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (e) { console.warn('Storage full:', e); }
  }

  function ls_remove(key) {
    try { localStorage.removeItem(PREFIX + key); } catch {}
  }

  /* ---- User data ---- */
  const User = {
    get:    () => ls_get('user', null),
    set:    (u)  => ls_set('user', u),
    remove: ()   => ls_remove('user'),
    update: (partial) => {
      const u = User.get() || {};
      User.set({ ...u, ...partial });
      return User.get();
    },
  };

  /* ---- Settings ---- */
  const Settings = {
    defaults: { theme: 'light', currency: 'INR', notifications: true, sheetsUrl: '', sheetId: '', remind24h: true },
    get:  () => ({ ...Settings.defaults, ...ls_get('settings', {}) }),
    set:  (s) => ls_set('settings', s),
    update: (partial) => { const s = Settings.get(); Settings.set({ ...s, ...partial }); return Settings.get(); },
  };

  /* ---- Custom Categories ---- */
  const Categories = {
    get:  () => ls_get('custom_cats', []),
    add:  (cat) => {
      const cats = Categories.get();
      if (!cats.find(c => c.id === cat.id)) cats.push(cat);
      ls_set('custom_cats', cats);
    },
    getAll: () => [...APP.defaultCategories, ...Categories.get()],
  };

  /* ---- Trips ---- */
  const Trips = {
    getAll: () => ls_get('trips', []),
    get:    (id) => Trips.getAll().find(t => t.id === id) || null,
    save:   (trip) => {
      const trips = Trips.getAll();
      const idx   = trips.findIndex(t => t.id === trip.id);
      if (idx >= 0) trips[idx] = trip;
      else trips.unshift(trip);
      ls_set('trips', trips);
      idbPut('trips', trip);
      return trip;
    },
    delete: (id) => {
      let trips = Trips.getAll().filter(t => t.id !== id);
      ls_set('trips', trips);
      idbDelete('trips', id);
    },
    setActive: (id) => ls_set('active_trip', id),
    getActive: ()   => ls_get('active_trip', null),
  };

  /* ---- Expenses ---- */
  const Expenses = {
    getAll:       () => ls_get('expenses', []),
    getByTrip:    (tripId) => Expenses.getAll().filter(e => e.tripId === tripId),
    get:          (id) => Expenses.getAll().find(e => e.id === id) || null,
    save:         (exp) => {
      const list = Expenses.getAll();
      const idx  = list.findIndex(e => e.id === exp.id);
      if (idx >= 0) list[idx] = exp;
      else list.unshift(exp);
      ls_set('expenses', list);
      idbPut('expenses', exp);
      return exp;
    },
    delete: (id) => {
      let list = Expenses.getAll().filter(e => e.id !== id);
      ls_set('expenses', list);
      idbDelete('expenses', id);
    },
    totalForTrip: (tripId) => Expenses.getByTrip(tripId).reduce((s, e) => s + (e.amount || 0), 0),
  };

  /* ---- Members (global contact book) ---- */
  const Members = {
    getAll:  () => ls_get('members', []),
    get:     (id) => Members.getAll().find(m => m.id === id) || null,
    save:    (m) => {
      const list = Members.getAll();
      const idx  = list.findIndex(x => x.id === m.id);
      if (idx >= 0) list[idx] = m; else list.push(m);
      ls_set('members', list);
    },
    delete:  (id) => ls_set('members', Members.getAll().filter(m => m.id !== id)),
  };

  /* ---- Notifications ---- */
  const Notifs = {
    getAll:   () => ls_get('notifs', []),
    add:      (n) => {
      const list = Notifs.getAll();
      list.unshift({ id: genId(), ts: Date.now(), read: false, ...n });
      ls_set('notifs', list.slice(0, 50));
    },
    markRead: (id) => {
      const list = Notifs.getAll().map(n => n.id === id ? { ...n, read: true } : n);
      ls_set('notifs', list);
    },
    markAllRead: () => {
      ls_set('notifs', Notifs.getAll().map(n => ({ ...n, read: true })));
    },
    unreadCount: () => Notifs.getAll().filter(n => !n.read).length,
  };

  /* ---- Offline queue ---- */
  const Queue = {
    add: async (op) => {
      await initDB();
      await idbPut('pending_ops', { ts: Date.now(), ...op });
    },
    getAll: async () => idbGetAll('pending_ops'),
    clear:  async () => {
      const ops = await Queue.getAll();
      for (const op of ops) await idbDelete('pending_ops', op.id);
    },
  };

  /* ---- Community data ---- */
  const Community = {
    getMates:  () => ls_get('mates',  APP.sampleMates),
    saveMate:  (m) => { const list = Community.getMates(); list.unshift(m); ls_set('mates', list); },
    getGroups: () => ls_get('groups', APP.sampleGroups),
    saveGroup: (g) => { const list = Community.getGroups(); list.unshift(g); ls_set('groups', list); },
  };

  /* ---- Coins ---- */
  const Coins = {
    get: () => {
      const u = User.get();
      return u ? (u.coins || 0) : 0;
    },
    add: (amount) => {
      const u = User.get();
      if (!u) return;
      const newCoins = (u.coins || 0) + amount;
      User.update({ coins: newCoins });
      document.getElementById('coins-count') && (document.getElementById('coins-count').textContent = newCoins);
      return newCoins;
    },
  };

  /* ---- Suggest / Bug Reports ---- */
  const Reports = {
    getAll: () => ls_get('reports', []),
    add:    (r) => {
      const list = Reports.getAll();
      list.unshift({ id: genId(), ts: Date.now(), status: 'open', ...r });
      ls_set('reports', list.slice(0, 100));
    },
  };

  /* ---- Helpers ---- */
  function genId() {
    return '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
  }

  function formatCurrency(amount, currencyCode) {
    const settings = Settings.get();
    const code = currencyCode || settings.currency || 'INR';
    const curr = APP.currencies.find(c => c.code === code);
    const sym  = curr ? curr.symbol : '₹';
    const num  = Number(amount || 0);
    if (code === 'INR') return sym + num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    return sym + num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  function formatDate(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function formatTime(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  function timeAgo(ts) {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return Math.floor(diff/60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff/3600000) + 'h ago';
    return Math.floor(diff/86400000) + 'd ago';
  }

  function getCatById(id) {
    return Categories.getAll().find(c => c.id === id) || APP.defaultCategories.find(c => c.id === 'other');
  }

  /* ---- Export ---- */
  return {
    initDB,
    User, Settings, Categories, Trips, Expenses, Members,
    Notifs, Queue, Community, Coins, Reports,
    genId, formatCurrency, formatDate, formatTime, timeAgo, getCatById,
  };
})();
