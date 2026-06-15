/**
 * auth.js — Supabase Auth module for Ormidia Car Accessories
 * Self-injects nav user button + login/register modal on any page.
 * Exposes window.Auth API.
 */

(function () {
  const SUPABASE_URL      = 'https://gyeyxvfwhsbbhnjwlgbx.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_nSWYIf67QX6O78By4H3SMQ_YCi28s1S';

  let _supabase = null;
  let _currentUser = null;

  function getSupabase() {
    if (_supabase) return _supabase;
    if (window.supabase) {
      _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      return _supabase;
    }
    return null;
  }

  /* ─── STYLES ─── */
  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* ─── AUTH NAV BUTTON ─── */
      .auth-nav-btn {
        display: flex; align-items: center; gap: 8px;
        background: none; border: 1.5px solid #e4e7ec;
        border-radius: 4px; cursor: pointer; padding: 5px 12px;
        font-family: 'Rajdhani', sans-serif; font-size: 13px; font-weight: 700;
        letter-spacing: 1.5px; text-transform: uppercase; color: #374151;
        transition: all 0.2s;
      }
      .auth-nav-btn:hover { border-color: #D0021B; color: #D0021B; }
      .auth-nav-btn i { font-size: 15px; }

      .auth-avatar-btn {
        display: flex; align-items: center; gap: 8px;
        background: none; border: none; cursor: pointer; padding: 4px;
        font-family: 'Rajdhani', sans-serif;
        position: relative;
      }
      .auth-avatar {
        width: 36px; height: 36px; border-radius: 50%;
        background: linear-gradient(135deg, #D0021B, #a00015);
        color: #fff; font-size: 14px; font-weight: 700;
        display: flex; align-items: center; justify-content: center;
        letter-spacing: 0.5px; flex-shrink: 0;
        border: 2px solid rgba(208,2,27,0.2);
        transition: border-color 0.2s;
      }
      .auth-avatar-btn:hover .auth-avatar { border-color: #D0021B; }
      .auth-user-name {
        font-size: 13px; font-weight: 700; color: #374151;
        letter-spacing: 0.5px; max-width: 100px;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      @media (max-width: 768px) { .auth-user-name { display: none; } }

      /* ─── USER DROPDOWN ─── */
      .auth-dropdown {
        position: absolute; top: calc(100% + 8px); right: 0;
        background: #fff; border: 1px solid #e4e7ec;
        border-radius: 6px; box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        min-width: 200px; z-index: 5000;
        display: none; flex-direction: column; overflow: hidden;
      }
      .auth-dropdown.open { display: flex; }
      .auth-dropdown-header {
        padding: 14px 16px; background: #f7f8fa;
        border-bottom: 1px solid #e4e7ec;
      }
      .auth-dropdown-name {
        font-family: 'Rajdhani', sans-serif; font-size: 15px; font-weight: 700;
        color: #1a1a1a; letter-spacing: 0.3px;
      }
      .auth-dropdown-email {
        font-size: 12px; color: #6b7280; margin-top: 2px;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .auth-dropdown-item {
        display: flex; align-items: center; gap: 10px;
        padding: 11px 16px; cursor: pointer; background: none; border: none;
        width: 100%; text-align: left;
        font-family: 'Rajdhani', sans-serif; font-size: 14px; font-weight: 600;
        letter-spacing: 0.5px; text-transform: uppercase; color: #374151;
        transition: background 0.15s, color 0.15s; text-decoration: none;
      }
      .auth-dropdown-item:hover { background: #f7f8fa; color: #D0021B; }
      .auth-dropdown-item i { width: 16px; color: #9ca3af; font-size: 13px; }
      .auth-dropdown-item:hover i { color: #D0021B; }
      .auth-dropdown-item.logout { color: #6b7280; }
      .auth-dropdown-item.logout:hover { background: #fef2f2; color: #D0021B; }
      .auth-dropdown-divider { height: 1px; background: #e4e7ec; }

      /* ─── MODAL OVERLAY ─── */
      #authModal {
        display: none; position: fixed; inset: 0;
        background: rgba(0,0,0,0.55); backdrop-filter: blur(8px);
        z-index: 10000; align-items: center; justify-content: center; padding: 20px;
      }
      #authModal.open { display: flex; }

      /* ─── MODAL CARD ─── */
      .auth-card {
        background: #fff; border-radius: 10px;
        width: 100%; max-width: 440px;
        box-shadow: 0 32px 80px rgba(0,0,0,0.2);
        overflow: hidden;
        animation: authSlideUp 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
      }
      @keyframes authSlideUp {
        from { transform: translateY(30px) scale(0.96); opacity: 0; }
        to   { transform: translateY(0)    scale(1);    opacity: 1; }
      }

      /* ─── MODAL HEADER ─── */
      .auth-card-header {
        background: linear-gradient(135deg, #1a1a1a 60%, #2d1010);
        padding: 28px 32px 0;
        position: relative;
      }
      .auth-header-logo {
        display: flex; align-items: center; gap: 10px; margin-bottom: 20px;
      }
      .auth-header-logo-icon {
        width: 38px; height: 38px; border-radius: 50%;
        background: #D0021B; display: flex; align-items: center; justify-content: center;
        font-size: 16px; color: #fff;
      }
      .auth-header-brand {
        font-family: 'Bebas Neue', sans-serif; font-size: 20px;
        letter-spacing: 2px; color: #fff;
      }
      .auth-header-brand span { color: #D0021B; }
      .auth-close {
        position: absolute; top: 16px; right: 16px;
        background: rgba(255,255,255,0.1); border: none;
        width: 32px; height: 32px; border-radius: 4px;
        cursor: pointer; color: rgba(255,255,255,0.7); font-size: 16px;
        display: flex; align-items: center; justify-content: center;
        transition: background 0.2s, color 0.2s;
      }
      .auth-close:hover { background: #D0021B; color: #fff; }

      /* ─── TABS ─── */
      .auth-tabs {
        display: flex; gap: 0; border-bottom: none; margin-bottom: 0;
      }
      .auth-tab {
        flex: 1; padding: 12px 0; background: none; border: none;
        cursor: pointer; font-family: 'Rajdhani', sans-serif; font-size: 14px;
        font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
        color: rgba(255,255,255,0.5); transition: color 0.2s;
        border-bottom: 3px solid transparent; margin-bottom: -1px;
      }
      .auth-tab.active { color: #fff; border-bottom-color: #D0021B; }

      /* ─── MODAL BODY ─── */
      .auth-card-body { padding: 28px 32px 32px; }

      .auth-panel { display: none; }
      .auth-panel.active { display: block; }

      /* ─── FORM ─── */
      .auth-form-group {
        display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px;
      }
      .auth-label {
        font-family: 'Rajdhani', sans-serif; font-size: 11px; font-weight: 700;
        letter-spacing: 2px; text-transform: uppercase; color: #374151;
      }
      .auth-input-wrap { position: relative; }
      .auth-input-icon {
        position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
        color: #9ca3af; font-size: 14px; pointer-events: none; transition: color 0.2s;
      }
      .auth-input {
        width: 100%; padding: 11px 14px 11px 38px;
        border: 1.5px solid #e4e7ec; border-radius: 4px;
        font-family: 'Barlow Condensed', sans-serif; font-size: 16px; color: #1a1a1a;
        outline: none; transition: border-color 0.2s, box-shadow 0.2s;
        background: #fff;
      }
      .auth-input:focus { border-color: #D0021B; box-shadow: 0 0 0 3px rgba(208,2,27,0.1); }
      .auth-input:focus + .auth-input-icon { color: #D0021B; }
      .auth-input.error { border-color: #D0021B; background: #fef2f2; }

      /* password toggle */
      .auth-pw-toggle {
        position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
        background: none; border: none; cursor: pointer; color: #9ca3af; font-size: 14px;
        transition: color 0.2s; padding: 2px;
      }
      .auth-pw-toggle:hover { color: #D0021B; }

      .auth-error-msg {
        background: #fef2f2; border: 1px solid rgba(208,2,27,0.3);
        border-radius: 4px; padding: 10px 14px; margin-bottom: 16px;
        font-family: 'Rajdhani', sans-serif; font-size: 13px; font-weight: 600;
        letter-spacing: 0.3px; color: #D0021B;
        display: none; align-items: center; gap: 8px;
      }
      .auth-error-msg.show { display: flex; }

      .auth-success-msg {
        background: #f0fdf4; border: 1px solid #bbf7d0;
        border-radius: 4px; padding: 10px 14px; margin-bottom: 16px;
        font-family: 'Rajdhani', sans-serif; font-size: 13px; font-weight: 600;
        letter-spacing: 0.3px; color: #15803d;
        display: none; align-items: center; gap: 8px;
      }
      .auth-success-msg.show { display: flex; }

      /* ─── BUTTONS ─── */
      .auth-submit {
        width: 100%; padding: 13px; background: #D0021B; color: #fff;
        border: none; border-radius: 4px; cursor: pointer;
        font-family: 'Rajdhani', sans-serif; font-size: 16px; font-weight: 700;
        letter-spacing: 2px; text-transform: uppercase;
        display: flex; align-items: center; justify-content: center; gap: 8px;
        transition: background 0.2s, transform 0.15s;
        box-shadow: 0 4px 16px rgba(208,2,27,0.25);
        margin-top: 20px;
      }
      .auth-submit:hover:not(:disabled) { background: #e8021e; transform: translateY(-1px); }
      .auth-submit:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }

      .auth-switch {
        text-align: center; margin-top: 18px;
        font-family: 'Rajdhani', sans-serif; font-size: 13px; font-weight: 600;
        letter-spacing: 0.5px; color: #6b7280;
      }
      .auth-switch button {
        background: none; border: none; cursor: pointer;
        color: #D0021B; font-family: 'Rajdhani', sans-serif;
        font-size: 13px; font-weight: 700; letter-spacing: 0.5px;
        text-decoration: underline; padding: 0;
      }

      @keyframes spin { to { transform: rotate(360deg); } }
      .fa-spin-auth { animation: spin 0.8s linear infinite; display: inline-block; }
    `;
    document.head.appendChild(style);
  }

  /* ─── MODAL HTML ─── */
  function injectModal() {
    const modal = document.createElement('div');
    modal.id = 'authModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Sign in or register');
    modal.innerHTML = `
      <div class="auth-card">
        <!-- Header -->
        <div class="auth-card-header">
          <div class="auth-header-logo">
            <div class="auth-header-logo-icon"><i class="fas fa-car"></i></div>
            <div class="auth-header-brand">Ormidia <span>CA</span></div>
          </div>
          <button class="auth-close" id="authModalClose" aria-label="Close"><i class="fas fa-times"></i></button>
          <div class="auth-tabs">
            <button class="auth-tab active" id="tabLogin" onclick="Auth._switchTab('login')">Sign In</button>
            <button class="auth-tab" id="tabRegister" onclick="Auth._switchTab('register')">Register</button>
          </div>
        </div>

        <!-- Body -->
        <div class="auth-card-body">

          <!-- ─── LOGIN PANEL ─── -->
          <div class="auth-panel active" id="panelLogin">
            <div class="auth-error-msg" id="loginError"><i class="fas fa-circle-exclamation"></i><span id="loginErrorText"></span></div>
            <div class="auth-form-group">
              <label class="auth-label" for="loginEmail">Email</label>
              <div class="auth-input-wrap">
                <input class="auth-input" type="email" id="loginEmail" placeholder="you@example.com" autocomplete="email"/>
                <i class="fas fa-envelope auth-input-icon"></i>
              </div>
            </div>
            <div class="auth-form-group">
              <label class="auth-label" for="loginPassword">Password</label>
              <div class="auth-input-wrap">
                <input class="auth-input" type="password" id="loginPassword" placeholder="••••••••" autocomplete="current-password"/>
                <i class="fas fa-lock auth-input-icon"></i>
                <button type="button" class="auth-pw-toggle" onclick="Auth._togglePw('loginPassword', this)" tabindex="-1">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
            </div>
            <button class="auth-submit" id="loginBtn" onclick="Auth._doLogin()">
              <i class="fas fa-right-to-bracket"></i> Sign In
            </button>
            <div class="auth-switch">
              No account? <button onclick="Auth._switchTab('register')">Register now</button>
            </div>
          </div>

          <!-- ─── REGISTER PANEL ─── -->
          <div class="auth-panel" id="panelRegister">
            <div class="auth-error-msg" id="registerError"><i class="fas fa-circle-exclamation"></i><span id="registerErrorText"></span></div>
            <div class="auth-success-msg" id="registerSuccess"><i class="fas fa-circle-check"></i><span id="registerSuccessText"></span></div>
            <div class="auth-form-group">
              <label class="auth-label" for="regName">Full Name</label>
              <div class="auth-input-wrap">
                <input class="auth-input" type="text" id="regName" placeholder="Nikos Papadopoulos" autocomplete="name"/>
                <i class="fas fa-user auth-input-icon"></i>
              </div>
            </div>
            <div class="auth-form-group">
              <label class="auth-label" for="regEmail">Email</label>
              <div class="auth-input-wrap">
                <input class="auth-input" type="email" id="regEmail" placeholder="you@example.com" autocomplete="email"/>
                <i class="fas fa-envelope auth-input-icon"></i>
              </div>
            </div>
            <div class="auth-form-group">
              <label class="auth-label" for="regPassword">Password</label>
              <div class="auth-input-wrap">
                <input class="auth-input" type="password" id="regPassword" placeholder="Min. 6 characters" autocomplete="new-password"/>
                <i class="fas fa-lock auth-input-icon"></i>
                <button type="button" class="auth-pw-toggle" onclick="Auth._togglePw('regPassword', this)" tabindex="-1">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
            </div>
            <button class="auth-submit" id="registerBtn" onclick="Auth._doRegister()">
              <i class="fas fa-user-plus"></i> Create Account
            </button>
            <div class="auth-switch">
              Already have an account? <button onclick="Auth._switchTab('login')">Sign in</button>
            </div>
          </div>

        </div>
      </div>`;

    document.body.appendChild(modal);

    // Close on backdrop
    modal.addEventListener('click', (e) => { if (e.target === modal) Auth.closeModal(); });
    document.getElementById('authModalClose').addEventListener('click', () => Auth.closeModal());
    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) Auth.closeModal();
    });
    // Enter key submits
    ['loginEmail','loginPassword'].forEach(id => {
      document.getElementById(id)?.addEventListener('keydown', (e) => { if (e.key === 'Enter') Auth._doLogin(); });
    });
    ['regName','regEmail','regPassword'].forEach(id => {
      document.getElementById(id)?.addEventListener('keydown', (e) => { if (e.key === 'Enter') Auth._doRegister(); });
    });
  }

  /* ─── NAV BUTTON ─── */
  function injectNavButton() {
    const nav = document.querySelector('nav');
    if (!nav) return;

    const wrap = document.createElement('div');
    wrap.id = 'authNavWrap';
    wrap.style.cssText = 'position:relative;display:flex;align-items:center;';
    wrap.innerHTML = `
      <button class="auth-nav-btn" id="authNavSignIn" onclick="Auth.openModal('login')">
        <i class="fas fa-user"></i> Sign In
      </button>
      <button class="auth-avatar-btn" id="authNavUser" style="display:none" onclick="Auth._toggleDropdown()">
        <div class="auth-avatar" id="authNavAvatar">?</div>
        <span class="auth-user-name" id="authNavName"></span>
        <i class="fas fa-chevron-down" style="font-size:10px;color:#9ca3af;"></i>
        <div class="auth-dropdown" id="authDropdown">
          <div class="auth-dropdown-header">
            <div class="auth-dropdown-name" id="authDropName"></div>
            <div class="auth-dropdown-email" id="authDropEmail"></div>
          </div>
          <a href="orders.html" class="auth-dropdown-item">
            <i class="fas fa-receipt"></i> My Orders
          </a>
          <div class="auth-dropdown-divider"></div>
          <button class="auth-dropdown-item logout" onclick="Auth.logout()">
            <i class="fas fa-right-from-bracket"></i> Sign Out
          </button>
        </div>
      </button>`;

    // Insert before cart btn or hamburger
    const cartBtn = nav.querySelector('#cartNavBtn');
    const hamburger = nav.querySelector('.hamburger');
    if (cartBtn) nav.insertBefore(wrap, cartBtn);
    else if (hamburger) nav.insertBefore(wrap, hamburger);
    else nav.appendChild(wrap);

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
      if (!document.getElementById('authNavWrap')?.contains(e.target)) {
        document.getElementById('authDropdown')?.classList.remove('open');
      }
    });
  }

  /* ─── PUBLIC API ─── */
  const Auth = {
    openModal(tab = 'login') {
      Auth._switchTab(tab);
      document.getElementById('authModal')?.classList.add('open');
      document.body.style.overflow = 'hidden';
      // Focus first input
      setTimeout(() => {
        const input = document.getElementById(tab === 'login' ? 'loginEmail' : 'regName');
        input?.focus();
      }, 300);
    },

    closeModal() {
      document.getElementById('authModal')?.classList.remove('open');
      document.body.style.overflow = '';
      // Clear errors
      ['loginError','registerError','registerSuccess'].forEach(id => {
        document.getElementById(id)?.classList.remove('show');
      });
    },

    async logout() {
      const sb = getSupabase();
      if (sb) await sb.auth.signOut();
      _currentUser = null;
      Auth._updateNav(null);
      document.getElementById('authDropdown')?.classList.remove('open');
    },

    getUser() { return _currentUser; },

    /* ─── PRIVATE ─── */
    _switchTab(tab) {
      const isLogin = tab === 'login';
      document.getElementById('tabLogin')?.classList.toggle('active', isLogin);
      document.getElementById('tabRegister')?.classList.toggle('active', !isLogin);
      document.getElementById('panelLogin')?.classList.toggle('active', isLogin);
      document.getElementById('panelRegister')?.classList.toggle('active', !isLogin);
      // Clear errors
      ['loginError','registerError','registerSuccess'].forEach(id => {
        document.getElementById(id)?.classList.remove('show');
      });
    },

    _togglePw(inputId, btn) {
      const inp = document.getElementById(inputId);
      if (!inp) return;
      const isText = inp.type === 'text';
      inp.type = isText ? 'password' : 'text';
      btn.querySelector('i').className = isText ? 'fas fa-eye' : 'fas fa-eye-slash';
    },

    _toggleDropdown() {
      document.getElementById('authDropdown')?.classList.toggle('open');
    },

    async _doLogin() {
      const sb = getSupabase();
      if (!sb) return Auth._showError('login', 'Service unavailable. Please try again.');

      const email    = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;

      if (!email || !password) {
        return Auth._showError('login', 'Please enter your email and password.');
      }

      const btn = document.getElementById('loginBtn');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-circle-notch fa-spin-auth"></i> Signing in…';

      const { data, error } = await sb.auth.signInWithPassword({ email, password });

      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-right-to-bracket"></i> Sign In';

      if (error) {
        return Auth._showError('login', _friendlyError(error.message));
      }

      _currentUser = data.user;
      Auth._updateNav(data.user);
      Auth.closeModal();
    },

    async _doRegister() {
      const sb = getSupabase();
      if (!sb) return Auth._showError('register', 'Service unavailable. Please try again.');

      const name     = document.getElementById('regName').value.trim();
      const email    = document.getElementById('regEmail').value.trim();
      const password = document.getElementById('regPassword').value;

      if (!name)     return Auth._showError('register', 'Please enter your full name.');
      if (!email)    return Auth._showError('register', 'Please enter your email address.');
      if (!password || password.length < 6)
        return Auth._showError('register', 'Password must be at least 6 characters.');

      const btn = document.getElementById('registerBtn');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-circle-notch fa-spin-auth"></i> Creating account…';

      const { data, error } = await sb.auth.signUp({
        email, password,
        options: { data: { full_name: name } }
      });

      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';

      if (error) {
        return Auth._showError('register', _friendlyError(error.message));
      }

      // Supabase may need email confirmation
      if (data?.user && !data.session) {
        Auth._showSuccess('register', `Account created! Check your email (${email}) to confirm your account, then sign in.`);
      } else if (data?.session) {
        _currentUser = data.user;
        Auth._updateNav(data.user);
        Auth.closeModal();
      }
    },

    _showError(panel, msg) {
      const errEl = document.getElementById(panel === 'login' ? 'loginError' : 'registerError');
      const txtEl = document.getElementById(panel === 'login' ? 'loginErrorText' : 'registerErrorText');
      if (txtEl) txtEl.textContent = msg;
      errEl?.classList.add('show');
    },

    _showSuccess(panel, msg) {
      const el  = document.getElementById('registerSuccess');
      const txt = document.getElementById('registerSuccessText');
      if (txt) txt.textContent = msg;
      el?.classList.add('show');
      document.getElementById('registerError')?.classList.remove('show');
    },

    _updateNav(user) {
      const signInBtn  = document.getElementById('authNavSignIn');
      const userBtn    = document.getElementById('authNavUser');
      const avatarEl   = document.getElementById('authNavAvatar');
      const nameEl     = document.getElementById('authNavName');
      const dropName   = document.getElementById('authDropName');
      const dropEmail  = document.getElementById('authDropEmail');

      if (user) {
        const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
        const initials = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
        if (signInBtn) signInBtn.style.display = 'none';
        if (userBtn)   userBtn.style.display   = 'flex';
        if (avatarEl)  avatarEl.textContent     = initials;
        if (nameEl)    nameEl.textContent        = name.split(' ')[0];
        if (dropName)  dropName.textContent      = name;
        if (dropEmail) dropEmail.textContent     = user.email;
      } else {
        if (signInBtn) signInBtn.style.display = '';
        if (userBtn)   userBtn.style.display   = 'none';
      }
    },
  };

  function _friendlyError(msg) {
    if (!msg) return 'An error occurred. Please try again.';
    if (msg.includes('Invalid login')) return 'Incorrect email or password.';
    if (msg.includes('Email not confirmed')) return 'Please confirm your email before signing in.';
    if (msg.includes('already registered')) return 'An account with this email already exists. Try signing in.';
    if (msg.includes('Password should')) return 'Password must be at least 6 characters.';
    if (msg.includes('Unable to validate')) return 'Invalid email address.';
    if (msg.includes('rate limit')) return 'Too many attempts. Please wait a minute and try again.';
    return msg;
  }

  /* ─── BOOT ─── */
  function boot() {
    injectStyles();
    injectModal();
    injectNavButton();

    // Wait for Supabase SDK to load
    const tryInit = () => {
      const sb = getSupabase();
      if (!sb) { setTimeout(tryInit, 100); return; }

      // Listen to auth state changes
      sb.auth.onAuthStateChange((_event, session) => {
        _currentUser = session?.user || null;
        Auth._updateNav(_currentUser);
      });

      // Restore existing session
      sb.auth.getSession().then(({ data }) => {
        _currentUser = data?.session?.user || null;
        Auth._updateNav(_currentUser);
      });
    };
    tryInit();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.Auth = Auth;
})();
