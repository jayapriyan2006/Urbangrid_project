/* ==========================================================================
   UrbanGrid — alerts.js
   DelayAlert feed (covers delay / cancellation / maintenance). Backend:
     GET  /api/alerts  -> any authenticated user
     POST /api/alerts  -> any authenticated user
   createdAt is stamped server-side; no PUT/DELETE exist.
   ========================================================================== */

let alertModal = null;
let allAlerts = [];
let activeTypeFilter = "ALL";

(async function initAlerts() {
  if (!AuthHelper.requireAuth()) return;
  AppShell.render();

  alertModal = new bootstrap.Modal(document.getElementById("alert-modal"));

  document.getElementById("add-alert-btn").addEventListener("click", async () => {
    ValidationHelper.resetForm(document.getElementById("alert-form"));
    await populateScheduleDropdown();
    alertModal.show();
  });
  document.getElementById("alert-form").addEventListener("submit", handleAlertSubmit);

  document.querySelectorAll("#type-filter button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#type-filter button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeTypeFilter = btn.dataset.type;
      renderAlertsTable();
    });
  });

  await loadAlerts();

  const params = new URLSearchParams(window.location.search);
  if (params.get("action") === "add") {
    await populateScheduleDropdown();
    alertModal.show();
  }
})();

async function loadAlerts() {
  const wrap = document.getElementById("alerts-table-wrap");
  wrap.innerHTML = `<div class="text-center text-secondary py-5"><div class="spinner-border spinner-border-sm me-2"></div>Loading alerts…</div>`;
  try {
    const { data } = await Api.alerts.getAll();
    allAlerts = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    renderAlertsTable();
  } catch (err) {
    wrap.innerHTML = `<div class="empty-state"><i class="bi bi-exclamation-circle"></i><p class="mb-0">${AlertHelper.fromError(err, "Couldn't load alerts.")}</p></div>`;
  }
}

function renderAlertsTable() {
  const wrap = document.getElementById("alerts-table-wrap");
  const filtered = activeTypeFilter === "ALL" ? allAlerts : allAlerts.filter(a => a.alertType === activeTypeFilter);

  if (!filtered || filtered.length === 0) {
    wrap.innerHTML = `<div class="empty-state"><i class="bi bi-bell-slash"></i><p class="mb-0">No alerts found.</p></div>`;
    return;
  }

  const typeBadge = { DELAY: "badge-delayed", CANCELLATION: "badge-cancelled", MAINTENANCE: "badge-role" };
  const typeIcon = { DELAY: "bi-clock-history", CANCELLATION: "bi-x-octagon", MAINTENANCE: "bi-tools" };

  wrap.innerHTML = `
    <div class="table-responsive-wrap">
      <table class="table table-urbangrid align-middle mb-0">
        <thead><tr><th>ID</th><th>Type</th><th>Message</th><th>Schedule</th><th>Posted</th></tr></thead>
        <tbody>
          ${filtered.map(a => `
            <tr>
              <td class="mono text-secondary">#${a.id}</td>
              <td><span class="badge-status ${typeBadge[a.alertType] || "badge-role"}"><i class="bi ${typeIcon[a.alertType] || "bi-bell"} me-1"></i>${FormatHelper.titleCase(a.alertType)}</span></td>
              <td>${escapeHtml(a.message)}</td>
              <td class="text-secondary small">${a.schedule ? `#${a.schedule.id}` : "—"}</td>
              <td class="cell-time">${FormatHelper.dateTime(a.createdAt)}</td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>`;
}

async function populateScheduleDropdown() {
  const select = document.getElementById("alert-schedule");
  select.innerHTML = `<option value="">Loading schedules…</option>`;
  try {
    const { data } = await Api.schedules.getAll();
    select.innerHTML = `<option value="">Not linked to a specific schedule</option>` +
      data.map(s => `<option value="${s.id}">#${s.id} — ${s.route ? escapeHtml(s.route.source) + " → " + escapeHtml(s.route.destination) : "Schedule"} (${FormatHelper.dateTime(s.departureTime)})</option>`).join("");
  } catch (err) {
    select.innerHTML = `<option value="">Not linked to a specific schedule</option>`;
  }
}

async function handleAlertSubmit(e) {
  e.preventDefault();
  const form = e.target;
  if (!ValidationHelper.validateForm(form)) return;

  const scheduleId = document.getElementById("alert-schedule").value;
  const payload = {
    alertType: document.getElementById("alert-type").value,
    message: document.getElementById("alert-message").value.trim()
  };
  if (scheduleId) payload.schedule = { id: Number(scheduleId) };

  const saveBtn = document.getElementById("alert-save-btn");
  saveBtn.disabled = true;
  SpinnerHelper.show();

  try {
    await Api.alerts.create(payload);
    AlertHelper.success("Alert posted successfully.");
    alertModal.hide();
    await loadAlerts();
  } catch (err) {
    AlertHelper.error(AlertHelper.fromError(err, "Couldn't post this alert."));
  } finally {
    saveBtn.disabled = false;
    SpinnerHelper.hide();
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : str;
  return div.innerHTML;
}
