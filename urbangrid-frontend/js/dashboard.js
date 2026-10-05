/* ==========================================================================
   UrbanGrid — dashboard.js
   ========================================================================== */

(async function initDashboard() {
  if (!AuthHelper.requireAuth()) return;
  AppShell.render();

  const user = AuthHelper.getUser();
  renderQuickActions(user.role);

  document.getElementById("updated-at").textContent =
    "Updated " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  SpinnerHelper.show();
  try {
    await Promise.all([loadStats(), loadVolumeChart(), loadShareChart(), loadRecentAlerts()]);
  } finally {
    SpinnerHelper.hide();
  }
})();

function renderQuickActions(role) {
  const container = document.getElementById("quick-actions");
  const actions = [];

  // Add Route / Add Schedule: backend restricts POST to ADMIN only.
  if (role === "ROLE_ADMIN") {
    actions.push({ href: "routes.html?action=add", icon: "bi-signpost-split", label: "Add Route", cls: "btn-teal" });
    actions.push({ href: "schedules.html?action=add", icon: "bi-calendar-plus", label: "Add Schedule", cls: "btn-teal" });
    actions.push({ href: "users.html", icon: "bi-people", label: "Manage Users", cls: "btn-outline-navy" });
  }
  // Vehicles & Alerts: backend allows any authenticated user to create.
  actions.push({ href: "vehicles.html?action=add", icon: "bi-bus-front", label: "Add Vehicle", cls: "btn-outline-navy" });
  actions.push({ href: "alerts.html?action=add", icon: "bi-megaphone", label: "Post Alert", cls: "btn-outline-navy" });

  container.innerHTML = actions.map(a => `
    <a href="${a.href}" class="btn ${a.cls}">
      <i class="bi ${a.icon}"></i>${a.label}
    </a>`).join("");
}

async function loadStats() {
  try {
    const { data } = await Api.reports.stats();
    document.getElementById("stat-routes").textContent = data.totalRoutes ?? 0;
    document.getElementById("stat-schedules").textContent = data.totalSchedules ?? 0;
    document.getElementById("stat-transports").textContent = data.totalTransports ?? 0;
    document.getElementById("stat-alerts").textContent = data.totalAlerts ?? 0;
    document.getElementById("stat-users").textContent = data.totalUsers ?? 0;
  } catch (err) {
    AlertHelper.error(AlertHelper.fromError(err, "Couldn't load dashboard stats."));
  }
}

async function loadVolumeChart() {
  const canvas = document.getElementById("volume-chart");
  try {
    const { data } = await Api.reports.volume();
    new Chart(canvas, {
      type: "bar",
      data: {
        labels: data.map(d => d.day),
        datasets: [{
          label: "Schedules",
          data: data.map(d => d.schedules),
          backgroundColor: "#1e9e8b",
          borderRadius: 6,
          maxBarThickness: 48
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
      }
    });
  } catch (err) {
    canvas.parentElement.innerHTML = emptyChartMessage("Couldn't load schedule volume.");
  }
}

async function loadShareChart() {
  const canvas = document.getElementById("share-chart");
  try {
    const { data } = await Api.reports.share();
    new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: data.map(d => FormatHelper.titleCase(d.type)),
        datasets: [{
          data: data.map(d => d.count),
          backgroundColor: ["#1e9e8b", "#f2a93b", "#0f1b2d"]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } } }
      }
    });
  } catch (err) {
    canvas.parentElement.innerHTML = emptyChartMessage("Couldn't load fleet mix.");
  }
}

function emptyChartMessage(msg) {
  return `<div class="empty-state py-4"><i class="bi bi-bar-chart"></i><p class="mb-0 small">${msg}</p></div>`;
}

async function loadRecentAlerts() {
  const wrap = document.getElementById("recent-activity-wrap");
  try {
    const { data } = await Api.alerts.getAll();
    const recent = [...data]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);

    if (recent.length === 0) {
      wrap.innerHTML = `<div class="empty-state"><i class="bi bi-bell-slash"></i><p class="mb-0">No alerts yet. Nothing to report.</p></div>`;
      return;
    }

    const iconMap = { DELAY: "bi-clock-history", CANCELLATION: "bi-x-octagon", MAINTENANCE: "bi-tools" };

    wrap.innerHTML = `<ul class="activity-list">` + recent.map(a => `
      <li>
        <span class="activity-icon"><i class="bi ${iconMap[a.alertType] || "bi-bell"}"></i></span>
        <div>
          <div class="fw-semibold">${FormatHelper.titleCase(a.alertType) || "Alert"}</div>
          <div class="text-secondary small">${escapeHtml(a.message || "")}</div>
        </div>
        <span class="activity-time">${FormatHelper.dateTime(a.createdAt)}</span>
      </li>`).join("") + `</ul>`;
  } catch (err) {
    wrap.innerHTML = `<div class="empty-state"><i class="bi bi-exclamation-circle"></i><p class="mb-0">${AlertHelper.fromError(err, "Couldn't load recent alerts.")}</p></div>`;
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
