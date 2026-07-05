/* ============================================================
   WeSplit – Toast Notifications & Modal System
   ============================================================ */
'use strict';

/* ---- Toast ---- */
const Toast = (() => {
  const icons = {
    success: 'fa-check-circle',
    error:   'fa-times-circle',
    warning: 'fa-exclamation-triangle',
    info:    'fa-info-circle',
  };
  const titles = { success: 'Success', error: 'Error', warning: 'Warning', info: 'Info' };

  function show(msg, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <i class="fas ${icons[type]||icons.info} toast-icon"></i>
      <div class="toast-content">
        <div class="toast-title">${titles[type]||'Info'}</div>
        <div class="toast-msg">${msg}</div>
      </div>
      <button class="toast-close" title="Dismiss"><i class="fas fa-times"></i></button>`;

    container.appendChild(toast);

    const dismiss = () => {
      toast.classList.add('toast-exit');
      setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
    };

    toast.querySelector('.toast-close').addEventListener('click', dismiss);

    if (duration > 0) setTimeout(dismiss, duration);
    return dismiss;
  }

  return { show };
})();

/* ---- Modal ---- */
const Modal = (() => {
  let onOpenCb = null;

  function show({ title = '', body = '', footer = '', size = '', onOpen = null }) {
    const overlay = document.getElementById('modal-overlay');
    const box     = document.getElementById('modal-box');
    const titleEl = document.getElementById('modal-title');
    const bodyEl  = document.getElementById('modal-body');
    const footEl  = document.getElementById('modal-footer');

    if (!overlay || !box) return;

    box.className = 'modal-box' + (size === 'lg' ? ' modal-lg' : size === 'sm' ? ' modal-sm' : '');
    titleEl.textContent = title;
    bodyEl.innerHTML    = body;
    footEl.innerHTML    = footer;

    overlay.classList.remove('hidden');
    onOpenCb = onOpen;
    if (onOpen) onOpen();
  }

  function close() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.classList.add('hidden');
    onOpenCb = null;
  }

  function confirm(title, message, onConfirm) {
    show({
      title,
      body: `<p style="color:var(--text-secondary);font-size:var(--text-sm)">${message}</p>`,
      size: 'sm',
      footer: `
        <button class="btn btn-secondary" id="conf-cancel">Cancel</button>
        <button class="btn btn-danger" id="conf-ok">Confirm</button>`,
      onOpen: () => {
        document.getElementById('conf-cancel').onclick = close;
        document.getElementById('conf-ok').onclick = () => { close(); onConfirm(); };
      }
    });
  }

  function init() {
    document.getElementById('modal-close')?.addEventListener('click', close);
    document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
      if (e.target === document.getElementById('modal-overlay')) close();
    });
  }

  return { show, close, confirm, init };
})();

/* ---- In-App Notifications Panel ---- */
const NotifPanel = (() => {
  let panel = null;
  let open  = false;

  function toggle() {
    if (open) { destroy(); return; }
    create();
  }

  function create() {
    open  = true;
    panel = document.createElement('div');
    panel.className = 'notif-panel';
    const notifs    = Storage.Notifs.getAll();
    const unread    = notifs.filter(n => !n.read).length;

    panel.innerHTML = `
      <div class="notif-panel-header">
        <span>Notifications</span>
        ${unread > 0 ? `<button class="btn btn-sm btn-ghost" style="padding:2px 8px" id="mark-all-read-btn">Mark all read</button>` : ''}
      </div>
      <div class="notif-list">
        ${notifs.length === 0
          ? `<div class="empty-state" style="padding:24px"><i class="fas fa-bell-slash"></i><p>No notifications yet</p></div>`
          : notifs.map(n => `
            <div class="notif-item ${n.read ? '' : 'unread'}" data-id="${n.id}">
              <div class="notif-dot-sm ${n.read ? 'hidden' : ''}"></div>
              <div>
                <div class="notif-text"><strong>${escHtml(n.title)}</strong><br/>${escHtml(n.msg||'')}</div>
                <div class="notif-time">${Storage.timeAgo(n.ts)}</div>
              </div>
            </div>`).join('')
        }
      </div>`;

    document.querySelector('.top-header').appendChild(panel);

    panel.querySelectorAll('.notif-item').forEach(item => {
      item.addEventListener('click', () => {
        Storage.Notifs.markRead(item.dataset.id);
        item.classList.remove('unread');
        item.querySelector('.notif-dot-sm')?.classList.add('hidden');
        updateBadge();
      });
    });

    panel.querySelector('#mark-all-read-btn')?.addEventListener('click', () => {
      Storage.Notifs.markAllRead();
      panel.querySelectorAll('.notif-item').forEach(el => {
        el.classList.remove('unread');
        el.querySelector('.notif-dot-sm')?.classList.add('hidden');
      });
      updateBadge();
      panel.querySelector('.notif-panel-header button')?.remove();
    });

    // Click outside to close
    setTimeout(() => {
      document.addEventListener('click', outsideClick);
    }, 50);
  }

  function outsideClick(e) {
    if (panel && !panel.contains(e.target) && e.target.id !== 'notif-btn') {
      destroy();
    }
  }

  function destroy() {
    open = false;
    panel?.remove();
    panel = null;
    document.removeEventListener('click', outsideClick);
  }

  function updateBadge() {
    const count = Storage.Notifs.unreadCount();
    const dot   = document.getElementById('notif-dot');
    if (dot) dot.classList.toggle('hidden', count === 0);
  }

  function escHtml(str) { return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  return { toggle, updateBadge };
})();
