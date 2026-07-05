/* ============================================================
   WeSplit – Google Sheets Integration
   Uses Apps Script Web App as a backend proxy for OAuth-less
   public writes. For full OAuth, replace syncWithOAuth().
   ============================================================ */
'use strict';

const Sheets = (() => {

  const SCRIPT_URL_KEY = 'wesplit_script_url';

  function getScriptUrl() {
    return localStorage.getItem(SCRIPT_URL_KEY) || Storage.Settings.get().appsScriptUrl || '';
  }

  function setScriptUrl(url) {
    localStorage.setItem(SCRIPT_URL_KEY, url);
    Storage.Settings.update({ appsScriptUrl: url });
  }

  /* ---- Show setup modal ---- */
  function showSetupModal() {
    const current = getScriptUrl();
    Modal.show({
      title: '🔗 Connect Google Sheets',
      body: `
        <div class="form-section">
          <div class="sheets-banner">
            <i class="fas fa-info-circle"></i>
            <div>
              <strong>How it works:</strong> Deploy the provided Apps Script as a Web App, paste the URL below.
              WeSplit pushes all your expenses to a Google Sheet instantly.
              <br/><a class="cta-link" id="script-help-link" href="#">View setup guide ↗</a>
            </div>
          </div>
          <div class="form-group">
            <label>Apps Script Web App URL</label>
            <input type="url" id="script-url-input" placeholder="https://script.google.com/macros/s/…/exec"
              value="${escHtml(current)}" />
            <span class="form-hint">Deploy your Apps Script and paste the Web App URL here</span>
          </div>
          <div class="form-group">
            <label>Spreadsheet ID (optional)</label>
            <input type="text" id="sheet-id-input" placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
              value="${escHtml(Storage.Settings.get().sheetId||'')}" />
            <span class="form-hint">The ID from your Google Sheets URL (between /d/ and /edit)</span>
          </div>
          <div class="card" style="background:var(--bg-app)">
            <div class="card-title" style="margin-bottom:8px"><i class="fas fa-code"></i> Apps Script Code</div>
            <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:8px">
              Copy the script below → paste in Google Apps Script → Deploy as Web App (Execute as Me, Anyone can access).
            </p>
            <button class="btn btn-sm btn-secondary" id="copy-script-btn" style="margin-bottom:8px">
              <i class="fas fa-copy"></i> Copy Script
            </button>
            <pre id="apps-script-code" style="font-size:10px;overflow-x:auto;background:var(--text-primary);color:var(--bg-app);padding:12px;border-radius:8px;white-space:pre-wrap;">${appsScriptCode()}</pre>
          </div>
        </div>`,
      size: 'lg',
      footer: `
        <button class="btn btn-secondary" id="sheets-cancel">Cancel</button>
        <button class="btn btn-accent" id="test-connection-btn"><i class="fas fa-plug"></i> Test Connection</button>
        <button class="btn btn-primary" id="save-sheets-btn"><i class="fas fa-save"></i> Save & Sync</button>`,
      onOpen: () => {
        document.getElementById('sheets-cancel').onclick = Modal.close;
        document.getElementById('copy-script-btn').onclick = () => {
          navigator.clipboard.writeText(appsScriptCode()).then(() => Toast.show('Script copied!', 'success'));
        };
        document.getElementById('test-connection-btn').onclick = testConnection;
        document.getElementById('save-sheets-btn').onclick = saveAndSync;
        document.getElementById('script-help-link').onclick = (e) => { e.preventDefault(); showHelpGuide(); };
      }
    });
  }

  function escHtml(str) { return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  /* ---- Test connection ---- */
  async function testConnection() {
    const url = document.getElementById('script-url-input').value.trim();
    if (!url) { Toast.show('Please enter the Apps Script URL first', 'warning'); return; }

    Toast.show('Testing connection…', 'info');
    try {
      const resp = await fetch(url + '?action=ping', { method: 'GET', mode: 'cors' });
      const text = await resp.text();
      if (text.includes('pong') || resp.ok) {
        Toast.show('✅ Connection successful!', 'success');
      } else {
        Toast.show('Connection returned unexpected response. Check your Apps Script deployment.', 'warning');
      }
    } catch (err) {
      Toast.show('Could not reach the URL. Ensure it\'s deployed as a Web App with "Anyone" access.', 'error');
    }
  }

  /* ---- Save & Sync ---- */
  async function saveAndSync() {
    const url     = document.getElementById('script-url-input').value.trim();
    const sheetId = document.getElementById('sheet-id-input').value.trim();

    if (!url) { Toast.show('Please enter the Apps Script URL', 'warning'); return; }
    setScriptUrl(url);
    if (sheetId) Storage.Settings.update({ sheetId });

    Modal.close();
    await syncAll();
  }

  /* ---- Sync all data ---- */
  async function syncAll(silent = false) {
    const url = getScriptUrl();
    if (!url) { showSetupModal(); return; }

    if (!navigator.onLine) {
      Toast.show('You\'re offline. Data will sync automatically when you reconnect.', 'warning');
      await Storage.Queue.add({ type: 'sync', ts: Date.now() });
      return;
    }

    if (!silent) Toast.show('Syncing to Google Sheets…', 'info');

    try {
      const user     = Storage.User.get();
      const trips    = Storage.Trips.getAll();
      const expenses = Storage.Expenses.getAll();

      const payload = {
        action: 'syncAll',
        user:   { id: user?.id, name: user?.name, email: user?.email },
        trips:  trips.map(t => ({
          id: t.id, name: t.name, destination: t.destination,
          startDate: t.startDate, endDate: t.endDate,
          totalExpenses: Storage.Expenses.totalForTrip(t.id),
        })),
        expenses: expenses.map(e => ({
          id: e.id, tripId: e.tripId, description: e.description,
          amount: e.amount, date: e.date, categoryId: e.categoryId,
          paidByName: e.paidByName, splitAmong: (e.splitAmong||[]).join(','),
          perPerson: e.perPerson, notes: e.notes,
        })),
        ts: new Date().toISOString(),
      };

      const resp = await fetch(url, {
        method: 'POST',
        mode:   'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) throw new Error('HTTP ' + resp.status);

      // Award coins for sync
      Storage.Coins.add(APP.coins.sheetsSync);
      Storage.Notifs.add({ title: '☁️ Synced!', msg: `${expenses.length} expenses pushed to Google Sheets.`, type: 'success' });
      if (!silent) Toast.show(`✅ Synced ${expenses.length} expenses to Google Sheets (+${APP.coins.sheetsSync} coins)`, 'success');

      // Clear offline queue
      await Storage.Queue.clear();

    } catch (err) {
      console.error('[WeSplit Sheets]', err);
      if (!silent) Toast.show('Sync failed: ' + err.message + '. Data queued for retry.', 'error');
      await Storage.Queue.add({ type: 'sync', ts: Date.now() });
    }
  }

  /* ---- Auto-sync pending queue on reconnect ---- */
  function setupAutoSync() {
    window.addEventListener('online', async () => {
      document.getElementById('offline-banner')?.classList.add('hidden');
      const pending = await Storage.Queue.getAll();
      if (pending.length > 0) {
        Toast.show('Back online! Syncing queued data…', 'info');
        await syncAll(true);
      }
    });
    window.addEventListener('offline', () => {
      document.getElementById('offline-banner')?.classList.remove('hidden');
      Toast.show('You\'re offline. All data is saved locally.', 'warning');
    });
    // Set initial state
    if (!navigator.onLine) {
      document.getElementById('offline-banner')?.classList.remove('hidden');
    }
  }

  /* ---- Help guide ---- */
  function showHelpGuide() {
    Modal.show({
      title: '📖 Google Sheets Setup Guide',
      body: `
        <ol style="font-size:var(--text-sm);color:var(--text-secondary);display:flex;flex-direction:column;gap:14px;padding-left:20px;">
          <li><strong>Open</strong> <a href="https://script.google.com" target="_blank">script.google.com</a> and click <em>New Project</em>.</li>
          <li>Delete the default code and paste the WeSplit Apps Script (copy it from the Sheets modal).</li>
          <li>Click <strong>Deploy → New Deployment</strong>.</li>
          <li>Select type <strong>Web App</strong>. Set:
            <ul style="margin-top:6px;list-style:disc;padding-left:20px;">
              <li>Execute as: <strong>Me</strong></li>
              <li>Who has access: <strong>Anyone</strong></li>
            </ul>
          </li>
          <li>Click <strong>Deploy</strong>, authorize, and copy the Web App URL.</li>
          <li>Paste that URL back into WeSplit → Sheets Setup → Save & Sync.</li>
        </ol>
        <div class="card" style="background:var(--clr-accent-light);border-color:#6ee7b7;margin-top:12px">
          <p style="font-size:var(--text-xs);color:#065f46">
            <strong>Tip:</strong> The spreadsheet is automatically created in your Google Drive.
            Each trip gets its own tab. The sync is one-directional (WeSplit → Sheets).
          </p>
        </div>`,
      size: 'lg',
      footer: `<button class="btn btn-primary" id="close-guide">Got it!</button>`,
      onOpen: () => { document.getElementById('close-guide').onclick = Modal.close; }
    });
  }

  /* ---- Apps Script code template ---- */
  function appsScriptCode() {
    return `// WeSplit – Google Apps Script Web App
// Deploy as Web App: Execute as Me, Anyone can access

const SPREADSHEET_NAME = "WeSplit Data";

function doGet(e) {
  const action = e.parameter.action;
  if (action === "ping") return ContentService.createTextOutput("pong");
  return ContentService.createTextOutput("WeSplit Apps Script v1.0");
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.action === "syncAll") return syncAll(data);
    return respond({ status: "error", msg: "Unknown action" });
  } catch(err) {
    return respond({ status: "error", msg: err.message });
  }
}

function syncAll(data) {
  let ss = findOrCreateSpreadsheet();
  syncTrips(ss, data.trips || []);
  syncExpenses(ss, data.expenses || []);
  syncSummary(ss, data);
  return respond({ status: "ok", ts: new Date().toISOString(), rows: (data.expenses||[]).length });
}

function findOrCreateSpreadsheet() {
  const files = DriveApp.getFilesByName(SPREADSHEET_NAME);
  if (files.hasNext()) return SpreadsheetApp.open(files.next());
  return SpreadsheetApp.create(SPREADSHEET_NAME);
}

function syncTrips(ss, trips) {
  let sheet = ss.getSheetByName("Trips") || ss.insertSheet("Trips");
  sheet.clearContents();
  sheet.appendRow(["ID","Name","Destination","Start Date","End Date","Total Expenses"]);
  trips.forEach(t => sheet.appendRow([t.id,t.name,t.destination,t.startDate,t.endDate,t.totalExpenses]));
  formatHeader(sheet);
}

function syncExpenses(ss, expenses) {
  let sheet = ss.getSheetByName("Expenses") || ss.insertSheet("Expenses");
  sheet.clearContents();
  sheet.appendRow(["ID","Trip ID","Description","Amount","Date","Category","Paid By","Split Among","Per Person","Notes"]);
  expenses.forEach(exp => sheet.appendRow([
    exp.id, exp.tripId, exp.description, exp.amount, exp.date,
    exp.categoryId, exp.paidByName, exp.splitAmong, exp.perPerson, exp.notes||""
  ]));
  formatHeader(sheet);
}

function syncSummary(ss, data) {
  let sheet = ss.getSheetByName("Summary") || ss.insertSheet("Summary");
  sheet.clearContents();
  sheet.appendRow(["WeSplit Sync Summary"]);
  sheet.appendRow(["Last Sync:", new Date().toLocaleString()]);
  sheet.appendRow(["User:", (data.user||{}).name]);
  sheet.appendRow(["Total Trips:", (data.trips||[]).length]);
  sheet.appendRow(["Total Expenses:", (data.expenses||[]).length]);
  const total = (data.expenses||[]).reduce((s,e)=>s+(+e.amount||0),0);
  sheet.appendRow(["Total Amount:", total]);
}

function formatHeader(sheet) {
  const range = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  range.setBackground("#4f46e5").setFontColor("#ffffff").setFontWeight("bold");
  sheet.setFrozenRows(1);
  for (let i=1; i<=sheet.getLastColumn(); i++) sheet.autoResizeColumn(i);
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}`;
  }

  return { syncAll, showSetupModal, setupAutoSync };
})();
