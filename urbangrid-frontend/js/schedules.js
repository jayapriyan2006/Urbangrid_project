/* ==========================================================================
   UrbanGrid — schedules.js
   Schedule Management. Backend rules:
     GET /api/schedules             -> OPERATOR, ADMIN, COMMUTER
     POST/PUT/DELETE /api/schedules -> ADMIN only
   Schedule links a Route + a Transport, so create/edit needs both lists.
   ========================================================================== */

let currentUser = null;
let scheduleModal = null;
let allSchedules = [];
let activeStatusFilter = "ALL";

(async function initSchedules() {
  if (!AuthHelper.requireAuth()) return;
  AppShell.render();
  currentUser = AuthHelper.getUser();

  scheduleModal = new bootstrap.Modal(document.getElementById("schedule-modal"));
  const canWrite = currentUser.role === "ROLE_ADMIN";

  document.getElementById("add-schedule-btn").classList.toggle("d-none", !canWrite);
  document.getElementById("add-schedule-btn").addEventListener("click", () => openScheduleModal());
  document.getElementById("schedule-form").addEventListener("submit", handleScheduleSubmit);

  document.querySelectorAll("#status-filter button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#status-filter button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeStatusFilter = btn.dataset.status;
      renderSchedulesTable();
    });
  });

  await loadSchedules();

  const params = new URLSearchParams(window.location.search);
  if (params.get("action") === "add" && canWrite) openScheduleModal();
})();

async function loadSchedules() {
  const wrap = document.getElementById("schedules-table-wrap");
  wrap.innerHTML = `<div class="text-center text-secondary py-5"><div class="spinner-border spinner-border-sm me-2"></div>Loading schedules…</div>`;
  try {
    const { data } = await Api.schedules.getAll();
    allSchedules = data;
    renderSchedulesTable();
  } catch (err) {
    wrap.innerHTML = `<div class="empty-state"><i class="bi bi-exclamation-circle"></i><p class="mb-0">${AlertHelper.fromError(err, "Couldn't load schedules.")}</p></div>`;
  }
}

let schedulesById = {};

function renderSchedulesTable() {
  const wrap = document.getElementById("schedules-table-wrap");
  const canWrite = currentUser.role === "ROLE_ADMIN";

  const filtered = activeStatusFilter === "ALL"
    ? allSchedules
    : allSchedules.filter(s => s.status === activeStatusFilter);

  if (!filtered || filtered.length === 0) {
    wrap.innerHTML = `<div class="empty-state"><i class="bi bi-calendar-x"></i><p class="mb-0">No schedules found.</p></div>`;
    return;
  }

  schedulesById = {};
  filtered.forEach(s => { schedulesById[s.id] = s; });

  wrap.innerHTML = `
    <div class="table-responsive-wrap">
      <table class="table table-urbangrid align-middle mb-0">
        <thead><tr>
          <th>ID</th><th>Route</th><th>Vehicle</th><th>Departure</th><th>Arrival</th><th>Status</th>
          ${canWrite ? '<th class="text-end">Actions</th>' : ""}
        </tr></thead>
        <tbody>
          ${filtered.map(s => `
            <tr>
              <td class="mono text-secondary">#${s.id}</td>
              <td>${s.route ? `${escapeHtml(s.route.source)} → ${escapeHtml(s.route.destination)}` : "—"}</td>
              <td>${s.transport ? `${escapeHtml(s.transport.transportNumber)} <span class="text-secondary small">(${FormatHelper.titleCase(s.transport.type)})</span>` : "—"}</td>
              <td class="cell-time">${FormatHelper.dateTime(s.departureTime)}</td>
              <td class="cell-time">${FormatHelper.dateTime(s.arrivalTime)}</td>
              <td><span class="badge-status ${FormatHelper.statusBadgeClass(s.status)}">${FormatHelper.titleCase(s.status)}</span></td>
              ${canWrite ? `
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-navy me-1" onclick="editSchedule(${s.id})"><i class="bi bi-pencil"></i></button>
                  <button class="btn btn-sm btn-outline-danger" onclick="deleteSchedule(${s.id})"><i class="bi bi-trash"></i></button>
                </td>` : ""}
            </tr>`).join("")}
        </tbody>
      </table>
    </div>`;
}

async function populateDropdowns(selectedRouteId, selectedTransportId) {
  const routeSelect = document.getElementById("schedule-route");
  const transportSelect = document.getElementById("schedule-transport");

  routeSelect.innerHTML = `<option value="">Loading routes…</option>`;
  transportSelect.innerHTML = `<option value="">Loading vehicles…</option>`;

  try {
    const [{ data: routes }, { data: transports }] = await Promise.all([
      Api.routes.getAll(),
      Api.transports.getAll()
    ]);

    routeSelect.innerHTML = `<option value="">Select a route…</option>` +
      routes.map(r => `<option value="${r.id}" ${r.id === selectedRouteId ? "selected" : ""}>${escapeHtml(r.routeName)} (${escapeHtml(r.source)} → ${escapeHtml(r.destination)})</option>`).join("");

    transportSelect.innerHTML = `<option value="">Select a vehicle…</option>` +
      transports.map(t => `<option value="${t.id}" ${t.id === selectedTransportId ? "selected" : ""}>${escapeHtml(t.transportNumber)} — ${FormatHelper.titleCase(t.type)}</option>`).join("");
  } catch (err) {
    AlertHelper.error(AlertHelper.fromError(err, "Couldn't load routes/vehicles for this form."));
  }
}

async function openScheduleModal(schedule = null) {
  const form = document.getElementById("schedule-form");
  ValidationHelper.resetForm(form);

  document.getElementById("schedule-modal-title").textContent = schedule ? "Edit Schedule" : "Add Schedule";
  document.getElementById("schedule-id").value = schedule ? schedule.id : "";
  document.getElementById("schedule-departure").value = schedule ? toDatetimeLocal(schedule.departureTime) : "";
  document.getElementById("schedule-arrival").value = schedule ? toDatetimeLocal(schedule.arrivalTime) : "";
  document.getElementById("schedule-status").value = schedule ? schedule.status : "ON_TIME";

  await populateDropdowns(schedule && schedule.route ? schedule.route.id : null, schedule && schedule.transport ? schedule.transport.id : null);

  scheduleModal.show();
}

function editSchedule(id) { openScheduleModal(schedulesById[id]); }

async function handleScheduleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  if (!ValidationHelper.validateForm(form)) return;

  const id = document.getElementById("schedule-id").value;
  const routeId = document.getElementById("schedule-route").value;
  const transportId = document.getElementById("schedule-transport").value;

  const payload = {
    departureTime: document.getElementById("schedule-departure").value,
    arrivalTime: document.getElementById("schedule-arrival").value,
    status: document.getElementById("schedule-status").value,
    route: { id: Number(routeId) },
    transport: { id: Number(transportId) }
  };

  const saveBtn = document.getElementById("schedule-save-btn");
  saveBtn.disabled = true;
  SpinnerHelper.show();

  try {
    if (id) {
      await Api.schedules.update(id, payload);
      AlertHelper.success("Schedule updated successfully.");
    } else {
      await Api.schedules.create(payload);
      AlertHelper.success("Schedule created successfully.");
    }
    scheduleModal.hide();
    await loadSchedules();
  } catch (err) {
    AlertHelper.error(AlertHelper.fromError(err, "Couldn't save this schedule."));
  } finally {
    saveBtn.disabled = false;
    SpinnerHelper.hide();
  }
}

function deleteSchedule(id) {
  ConfirmHelper.ask(`Delete schedule #${id}? This can't be undone.`, async () => {
    SpinnerHelper.show();
    try {
      await Api.schedules.remove(id);
      AlertHelper.success("Schedule deleted.");
      await loadSchedules();
    } catch (err) {
      AlertHelper.error(AlertHelper.fromError(err, "Couldn't delete this schedule."));
    } finally {
      SpinnerHelper.hide();
    }
  });
}

// Converts an ISO datetime string from the backend into the value format
// <input type="datetime-local"> expects: "YYYY-MM-DDTHH:mm"
function toDatetimeLocal(isoString) {
  if (!isoString) return "";
  return isoString.length >= 16 ? isoString.substring(0, 16) : isoString;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : str;
  return div.innerHTML;
}
