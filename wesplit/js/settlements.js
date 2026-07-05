/* ============================================================
   WeSplit – Settlement Matrix (Debt Minimization Algorithm)
   ============================================================ */
'use strict';

const Settlements = (() => {

  /**
   * Core algorithm: Minimize number of transactions.
   * Returns array of { from, fromId, to, toId, amount }
   */
  function calculate(tripId) {
    const trip     = Storage.Trips.get(tripId);
    if (!trip) return [];
    const expenses = Storage.Expenses.getByTrip(tripId);
    const members  = trip.members || [];

    // Net balance per member
    const balance = {};
    members.forEach(m => { balance[m.id] = 0; });

    expenses.forEach(exp => {
      const { paidById, amount, splitAmong } = exp;
      if (!paidById || !amount) return;

      // Payer gets +amount
      if (balance[paidById] !== undefined) balance[paidById] += amount;

      // Each splitter owes their share
      const share = splitAmong && splitAmong.length > 0 ? amount / splitAmong.length : amount;
      (splitAmong || members.map(m => m.id)).forEach(mid => {
        if (balance[mid] !== undefined) balance[mid] -= share;
      });
    });

    // Build creditors (positive) and debtors (negative) lists
    let creditors = [];
    let debtors   = [];
    members.forEach(m => {
      const net = Math.round(balance[m.id] * 100) / 100;
      if (net > 0.01)  creditors.push({ id: m.id, name: m.name, avatar: m.avatar || m.name[0], amount: net });
      if (net < -0.01) debtors.push({ id: m.id, name: m.name, avatar: m.avatar || m.name[0], amount: Math.abs(net) });
    });

    // Sort descending
    creditors.sort((a,b) => b.amount - a.amount);
    debtors.sort((a,b)   => b.amount - a.amount);

    const transactions = [];
    let ci = 0, di = 0;

    while (ci < creditors.length && di < debtors.length) {
      const cred = creditors[ci];
      const debt = debtors[di];
      const amt  = Math.min(cred.amount, debt.amount);

      if (amt > 0.01) {
        transactions.push({
          fromId:   debt.id,
          from:     debt.name,
          fromAv:   debt.avatar,
          toId:     cred.id,
          to:       cred.name,
          toAv:     cred.avatar,
          amount:   Math.round(amt * 100) / 100,
        });
      }

      cred.amount -= amt;
      debt.amount -= amt;

      if (cred.amount < 0.01) ci++;
      if (debt.amount < 0.01) di++;
    }

    return transactions;
  }

  /* ---- Per-person summary ---- */
  function perPersonSummary(tripId) {
    const trip     = Storage.Trips.get(tripId);
    if (!trip) return [];
    const expenses = Storage.Expenses.getByTrip(tripId);
    const members  = trip.members || [];

    return members.map(m => {
      const paid  = expenses.filter(e => e.paidById === m.id).reduce((s,e) => s + e.amount, 0);
      const share = expenses.reduce((s, e) => {
        if (!e.splitAmong) return s;
        if (e.splitAmong.includes(m.id)) return s + e.perPerson;
        return s;
      }, 0);
      return {
        id:     m.id,
        name:   m.name,
        avatar: m.avatar || m.name[0],
        paid:   Math.round(paid * 100) / 100,
        share:  Math.round(share * 100) / 100,
        net:    Math.round((paid - share) * 100) / 100,
      };
    });
  }

  /* ---- Category breakdown ---- */
  function categoryBreakdown(tripId) {
    const expenses = Storage.Expenses.getByTrip(tripId);
    const result   = {};
    expenses.forEach(e => {
      const cid = e.categoryId || 'other';
      result[cid] = (result[cid] || 0) + e.amount;
    });
    return result;
  }

  /* ---- HTML for settlement card ---- */
  function settlementCardHtml(tx) {
    const sym = Storage.formatCurrency(tx.amount);
    const upiHtml = APP.upiApps.map(u => `
      <button class="upi-btn" onclick="Settlements.openUPI('${u.id}','${tx.toId}','${tx.amount}')">
        <img src="${u.icon}" width="16" onerror="this.style.display='none'" alt="${u.name}" /> ${u.name}
      </button>`).join('');

    return `
      <div class="settlement-card">
        <div class="avatar avatar-sm" style="background:linear-gradient(135deg,#ef4444,#f97316)">${tx.fromAv}</div>
        <div class="settlement-info">
          <div class="settlement-names">
            <span>${tx.from}</span>
            <i class="fas fa-long-arrow-alt-right settlement-arrow"></i>
            <span>${tx.to}</span>
          </div>
          <div class="settlement-amount">${sym}</div>
          <div class="settlement-upi">${upiHtml}</div>
        </div>
        <div style="flex-shrink:0">
          <button class="btn btn-sm btn-accent" onclick="Settlements.markPaid('${tx.fromId}','${tx.toId}','${tx.amount}')">
            <i class="fas fa-check"></i> Done
          </button>
        </div>
      </div>`;
  }

  /* ---- Open UPI app ---- */
  function openUPI(appId, recipientId, amount) {
    const trip = Storage.Trips.get(Storage.Trips.getActive());
    const member = trip?.members?.find(m => m.id === recipientId);
    if (!member?.upi) {
      Toast.show(`No UPI ID on file for ${member?.name || 'this member'}. Ask them to update their profile.`, 'warning');
      return;
    }
    const upiUrl = `upi://pay?pa=${encodeURIComponent(member.upi)}&pn=${encodeURIComponent(member.name)}&am=${amount}&cu=INR&tn=WeSplit+Settlement`;
    window.open(upiUrl, '_blank');
    Toast.show(`Opening ${appId} for ₹${amount} payment to ${member.name}`, 'info');
  }

  /* ---- Mark as paid (remove from pending) ---- */
  function markPaid(fromId, toId, amount) {
    // Create a "settlement" record to track it
    const settle = {
      id:      Storage.genId(),
      fromId, toId, amount: parseFloat(amount),
      paidAt:  Date.now(),
      tripId:  Storage.Trips.getActive(),
    };
    const existing = Storage.Settings.get().settlements || [];
    Storage.Settings.update({ settlements: [...existing, settle] });
    Storage.Notifs.add({ title: '💸 Settlement marked', msg: `₹${amount} payment recorded`, type: 'success' });
    Toast.show('Payment marked as settled!', 'success');
    Pages.render(App.currentPage);
  }

  /* ---- Export to CSV ---- */
  function exportCSV(tripId) {
    const trip     = Storage.Trips.get(tripId);
    const expenses = Storage.Expenses.getByTrip(tripId);
    if (!expenses.length) { Toast.show('No expenses to export', 'warning'); return; }

    const header = ['Date','Description','Category','Amount','Paid By','Split Among','Per Person','Notes'];
    const rows   = expenses.map(e => {
      const cat = Storage.getCatById(e.categoryId);
      const trip = Storage.Trips.get(e.tripId);
      const splitNames = (e.splitAmong||[]).map(id => trip?.members?.find(m=>m.id===id)?.name||id).join(';');
      return [
        e.date, `"${(e.description||'').replace(/"/g,'""')}"`, cat?.label||'Other',
        e.amount, e.paidByName, `"${splitNames}"`, e.perPerson, `"${(e.notes||'').replace(/"/g,'""')}"`
      ].join(',');
    });

    const csv  = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${trip?.name||'trip'}_expenses.csv`;
    a.click();
    URL.revokeObjectURL(url);
    Toast.show('Expenses exported to CSV!', 'success');
  }

  return { calculate, perPersonSummary, categoryBreakdown, settlementCardHtml, openUPI, markPaid, exportCSV };
})();
