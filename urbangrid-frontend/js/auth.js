/* ==========================================================================
   UrbanGrid — auth.js
   Everything about the logged-in session: login, register, logout,
   page protection, and role-aware sidebar rendering.
   ========================================================================== */

const AuthHelper = {
  /* ---- Session storage ---- */
  saveSession(jwtResponse) {
    // jwtResponse: { accessToken, type, id, username, email, role }
    StorageHelper.set(StorageHelper.KEYS.TOKEN, jwtResponse.accessToken);
    StorageHelper.set(StorageHelper.KEYS.USER, {
      id: jwtResponse.id,
      username: jwtResponse.username,
      email: jwtResponse.email,
      role: jwtResponse.role
    });
  },

  getToken() {
    return StorageHelper.get(StorageHelper.KEYS.TOKEN);
  },

  getUser() {
    return StorageHelper.getJSON(StorageHelper.KEYS.USER);
  },

  clearSession() {
    StorageHelper.remove(StorageHelper.KEYS.TOKEN);
    StorageHelper.remove(StorageHelper.KEYS.USER);
  },

  isLoggedIn() {
    const token = this.getToken();
    if (!token) return false;
    if (JwtHelper.isExpired(token)) {
      this.clearSession();
      return false;
    }
    return true;
  },

  hasRole(...roles) {
    const user = this.getUser();
    return !!user && roles.includes(user.role);
  },

  /* ---- Actions ---- */
  async login(username, password) {
    const response = await Api.auth.login(username, password);
    this.saveSession(response.data);
    return response.data;
  },

  async register(payload) {
    const response = await Api.auth.register(payload);
    return response.data;
  },

  logout() {
    this.clearSession();
    window.location.href = "login.html";
  },

  /* ---- Page guards ---- */
  // Call at the top of every protected page.
  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = "login.html";
      return false;
    }
    return true;
  },

  // Call on pages restricted to specific roles (e.g. admin-only pages).
  requireRole(...roles) {
    if (!this.requireAuth()) return false;
    if (!this.hasRole(...roles)) {
      window.location.href = "dashboard.html";
      return false;
    }
    return true;
  },

  // login.html / register.html should bounce logged-in users to the dashboard.
  redirectIfLoggedIn() {
    if (this.isLoggedIn()) {
      window.location.href = "dashboard.html";
    }
  }
};

/* ==========================================================================
   Shared app shell: sidebar + topbar, injected on every protected page.
   Each page includes a <div id="app-shell-mount"></div> and sets
   window.UG_ACTIVE_PAGE + window.UG_PAGE_TITLE before calling this.
   ========================================================================== */
const AppShell = {
  NAV_ITEMS: [
    { page: "dashboard", label: "Dashboard", href: "dashboard.html", icon: "bi-speedometer2", roles: ["ROLE_ADMIN", "ROLE_OPERATOR", "ROLE_COMMUTER"] },
    { page: "routes", label: "Routes", href: "routes.html", icon: "bi-signpost-split", roles: ["ROLE_ADMIN", "ROLE_OPERATOR", "ROLE_COMMUTER"] },
    { page: "schedules", label: "Schedules", href: "schedules.html", icon: "bi-calendar3", roles: ["ROLE_ADMIN", "ROLE_OPERATOR", "ROLE_COMMUTER"] },
    { page: "vehicles", label: "Vehicles", href: "vehicles.html", icon: "bi-bus-front", roles: ["ROLE_ADMIN", "ROLE_OPERATOR", "ROLE_COMMUTER"] },
    { page: "alerts", label: "Alerts", href: "alerts.html", icon: "bi-bell", roles: ["ROLE_ADMIN", "ROLE_OPERATOR", "ROLE_COMMUTER"] },
    { page: "users", label: "Users", href: "users.html", icon: "bi-people", roles: ["ROLE_ADMIN"] }
  ],

  render() {
    const mount = document.getElementById("app-shell-mount");
    if (!mount) return;

    const user = AuthHelper.getUser();
    const activePage = window.UG_ACTIVE_PAGE || "";
    const pageTitle = window.UG_PAGE_TITLE || "";

    const navHtml = this.NAV_ITEMS
      .filter(item => user && item.roles.includes(user.role))
      .map(item => `
        <a href="${item.href}" class="nav-link ${item.page === activePage ? "active" : ""}">
          <i class="bi ${item.icon}"></i><span>${item.label}</span>
        </a>`)
      .join("");

    mount.innerHTML = `
      <div class="sidebar-backdrop" id="sidebar-backdrop"></div>
      <aside class="app-sidebar" id="app-sidebar">
        <div class="brand"><span class="dot"></span> UrbanGrid</div>
        <nav class="nav flex-column mt-2">${navHtml}</nav>
        <div class="sidebar-footer">
          <span class="role-chip">${user ? FormatHelper.titleCase(user.role.replace("ROLE_", "")) : ""}</span>
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="fw-semibold small text-white">${user ? user.username : ""}</div>
              <div class="small" style="color: rgba(255,255,255,0.5);">${user ? user.email : ""}</div>
            </div>
            <button class="btn btn-sm btn-outline-light" id="logout-btn" title="Log out">
              <i class="bi bi-box-arrow-right"></i>
            </button>
          </div>
        </div>
      </aside>
      <div class="app-main">
        <header class="app-topbar">
          <div class="d-flex align-items-center gap-2">
            <button class="sidebar-toggle" id="sidebar-toggle"><i class="bi bi-list"></i></button>
            <h1 class="page-title">${pageTitle}</h1>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="badge-status badge-role d-none d-sm-inline-flex">
              <i class="bi bi-person-badge me-1"></i>${user ? user.username : ""}
            </span>
            <button class="btn btn-sm btn-outline-navy" id="logout-btn-top">
              <i class="bi bi-box-arrow-right me-1"></i>Logout
            </button>
          </div>
        </header>
        <main class="app-content" id="app-content-mount"></main>
      </div>`;

    // Move existing page content into the mounted main area.
    const pageBody = document.getElementById("page-body");
    if (pageBody) {
      document.getElementById("app-content-mount").appendChild(pageBody);
      pageBody.classList.remove("d-none");
    }

    // Logout handlers
    ["logout-btn", "logout-btn-top"].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener("click", () => AuthHelper.logout());
    });

    // Mobile sidebar toggle
    const toggleBtn = document.getElementById("sidebar-toggle");
    const sidebar = document.getElementById("app-sidebar");
    const backdrop = document.getElementById("sidebar-backdrop");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        sidebar.classList.toggle("open");
        backdrop.classList.toggle("show");
      });
      backdrop.addEventListener("click", () => {
        sidebar.classList.remove("open");
        backdrop.classList.remove("show");
      });
    }
  }
};
