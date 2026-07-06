/* ============================================================
   YRJS – Auth Module (LocalStorage-based, Firebase-ready)
   Handles sign-up, sign-in, forgot password, Google OAuth stub
   ============================================================ */
'use strict';

const Auth = (() => {

  /* ---- Helpers ---- */
  function showPanel(panelId) {
    ['signin-panel','signup-panel','forgot-panel'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('hidden', id !== panelId);
    });
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  function validatePassword(pw) {
    return pw.length >= 8;
  }

  function hashSimple(str) {
    // NOT cryptographic – for demo only. Replace with bcrypt or Firebase Auth.
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    }
    return h.toString(16);
  }

  function getUsers() {
    try { return JSON.parse(localStorage.getItem('yrjs_users') || '[]'); } catch { return []; }
  }

  function saveUsers(users) {
    localStorage.setItem('yrjs_users', JSON.stringify(users));
  }

  function setLoading(btnId, loading) {
    const btn    = document.getElementById(btnId);
    if (!btn) return;
    const text   = btn.querySelector('.btn-text');
    const loader = btn.querySelector('.btn-loader');
    if (text)   text.classList.toggle('hidden', loading);
    if (loader) loader.classList.toggle('hidden', !loading);
    btn.disabled = loading;
  }

  /* ---- Password Strength ---- */
  function checkPwStrength(pw) {
    let score = 0;
    if (pw.length >= 8)   score++;
    if (pw.length >= 12)  score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const bar = document.querySelector('#pw-strength-bar div');
    if (!bar) return;
    const pct   = (score / 5) * 100;
    const color = score < 2 ? '#ef4444' : score < 4 ? '#f59e0b' : '#10b981';
    bar.style.width = pct + '%';
    bar.style.background = color;
  }

  /* ---- Sign Up ---- */
  function handleSignUp(e) {
    e.preventDefault();
    const fname = document.getElementById('su-fname').value.trim();
    const lname = document.getElementById('su-lname').value.trim();
    const email = document.getElementById('su-email').value.trim();
    const phone = document.getElementById('su-phone').value.trim();
    const pw    = document.getElementById('su-password').value;
    const terms = document.getElementById('su-terms').checked;

    if (!fname || !lname) { Toast.show('Please enter your full name', 'error'); return; }
    if (!validateEmail(email)) { Toast.show('Please enter a valid email address', 'error'); return; }
    if (!validatePassword(pw)) { Toast.show('Password must be at least 8 characters', 'error'); return; }
    if (!terms) { Toast.show('Please accept the Terms of Service to continue', 'warning'); return; }

    const users = getUsers();
    if (users.find(u => u.email === email)) {
      Toast.show('This email is already registered. Please sign in.', 'error'); return;
    }

    setLoading('signup-btn', true);
    setTimeout(() => {
      const user = {
        id:        Storage.genId(),
        fname, lname,
        name:  fname + ' ' + lname,
        email, phone,
        pwHash:    hashSimple(pw),
        avatar:    fname[0].toUpperCase(),
        coins:     APP.coins.signUp,
        joinedAt:  Date.now(),
        verified:  false,
      };
      users.push(user);
      saveUsers(users);
      Storage.User.set(user);
      Storage.Notifs.add({ title: '🎉 Welcome!', msg: `You earned ${APP.coins.signUp} welcome coins!`, type: 'info' });
      setLoading('signup-btn', false);
      Toast.show(`Welcome, ${fname}! You earned ${APP.coins.signUp} coins.`, 'success');
      App.onAuthSuccess(user);
    }, 900);
  }

  /* ---- Sign In ---- */
  function handleSignIn(e) {
    e.preventDefault();
    const email = document.getElementById('si-email').value.trim();
    const pw    = document.getElementById('si-password').value;

    if (!validateEmail(email)) { Toast.show('Please enter a valid email address', 'error'); return; }
    if (!pw) { Toast.show('Please enter your password', 'error'); return; }

    setLoading('signin-btn', true);
    setTimeout(() => {
      const users = getUsers();
      const user  = users.find(u => u.email === email && u.pwHash === hashSimple(pw));
      setLoading('signin-btn', false);
      if (!user) {
        Toast.show('Incorrect email or password. Please try again.', 'error');
        return;
      }
      Storage.User.set(user);
      Toast.show(`Welcome back, ${user.fname}!`, 'success');
      App.onAuthSuccess(user);
    }, 800);
  }

  /* ---- Forgot Password ---- */
  function handleForgotPw(e) {
    e.preventDefault();
    const email = document.getElementById('fp-email').value.trim();
    if (!validateEmail(email)) { Toast.show('Please enter a valid email address', 'error'); return; }
    const users = getUsers();
    // Simulate email – in production, hook into Firebase Auth
    Toast.show('If that email exists, a reset link has been sent! (Demo: check console)', 'info');
    console.info('[YRJS] Password reset for:', email);
    showPanel('signin-panel');
  }

  /* ---- Google Sign In (stub) ---- */
  function handleGoogleSignIn() {
    Toast.show('Google Sign-In: configure OAuth in js/config.js (or integrate Firebase Auth)', 'info');
    // Stub: auto-login as demo user
    setTimeout(() => {
      const demoUser = {
        id:       Storage.genId(),
        fname:    'Demo',
        lname:    'Traveler',
        name:     'Demo Traveler',
        email:    'demo@yrjs.app',
        avatar:   'D',
        coins:    150,
        joinedAt: Date.now(),
        verified: true,
      };
      Storage.User.set(demoUser);
      App.onAuthSuccess(demoUser);
    }, 600);
  }

  /* ---- Apple Sign In (stub) ---- */
  function handleAppleSignIn() {
    Toast.show('Apple Sign-In: configure Sign in with Apple credentials in js/config.js', 'info');
    // Stub: auto-login as demo user (same as Google stub)
    setTimeout(() => {
      const demoUser = {
        id:       Storage.genId(),
        fname:    'Demo',
        lname:    'Traveler',
        name:     'Demo Traveler',
        email:    'demo@yrjs.app',
        avatar:   'D',
        coins:    150,
        joinedAt: Date.now(),
        verified: true,
      };
      Storage.User.set(demoUser);
      App.onAuthSuccess(demoUser);
    }, 600);
  }

  /* ---- Sign Out ---- */
  function signOut() {
    Storage.User.remove();
    App.showAuthScreen();
    Toast.show('Signed out successfully', 'info');
  }

  /* ---- Toggle password visibility ---- */
  function setupPwToggles() {
    document.querySelectorAll('.toggle-pw').forEach(btn => {
      btn.addEventListener('click', () => {
        const inp = document.getElementById(btn.dataset.target);
        if (!inp) return;
        inp.type = inp.type === 'password' ? 'text' : 'password';
        btn.querySelector('i').className = inp.type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
      });
    });
  }

  /* ---- Init ---- */
  function init() {
    // Panel navigation
    document.getElementById('goto-signup')  ?.addEventListener('click', (e) => { e.preventDefault(); showPanel('signup-panel'); });
    document.getElementById('goto-signin')  ?.addEventListener('click', (e) => { e.preventDefault(); showPanel('signin-panel'); });
    document.getElementById('goto-forgot')  ?.addEventListener('click', (e) => { e.preventDefault(); showPanel('forgot-panel'); });
    document.getElementById('back-to-signin')?.addEventListener('click', () => showPanel('signin-panel'));

    // Forms
    document.getElementById('signin-form')?.addEventListener('submit', handleSignIn);
    document.getElementById('signup-form')?.addEventListener('submit', handleSignUp);
    document.getElementById('forgot-form')?.addEventListener('submit', handleForgotPw);
    document.getElementById('google-signin-btn')?.addEventListener('click', handleGoogleSignIn);
    document.getElementById('apple-signin-btn') ?.addEventListener('click', handleAppleSignIn);

    // Password strength meter
    document.getElementById('su-password')?.addEventListener('input', (e) => checkPwStrength(e.target.value));

    // Sign out
    document.getElementById('signout-btn')?.addEventListener('click', signOut);

    setupPwToggles();
  }

  return { init, signOut, showPanel };
})();
