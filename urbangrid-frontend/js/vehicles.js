/* ==========================================================================
   UrbanGrid — vehicles.js
   Transport ("Vehicle") management. Backend only exposes:
     GET  /api/transports  -> any authenticated user
     POST /api/transports  -> any authenticated user
   No PUT/DELETE exist on the backend, so there is no edit/delete UI.
   ========================================================================== */

let vehicleModal = null;
let allVehicles = [];
let activeTypeFilter = "ALL";

(async function initVehicles() {
  if (!AuthHelper.requireAuth()) return;
  AppShell.render();

  vehicleModal = new bootstrap.Modal(document.getElementById("vehicle-modal"));

  document.getElementById("add-vehicle-btn").addEventListener("click", () => {
    ValidationHelper.resetForm(document.getElementById("vehicle-form"));
    vehicleModal.show();
  });
  document.getElementById("vehicle-form").addEventListener("submit", handleVehicleSubmit);

  document.querySelectorAll("#type-filter button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#type-filter button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeTypeFilter = btn.dataset.type;
      renderVehiclesTable();
    });
  });

  await loadVehicles();

  const params = new URLSearchParams(window.location.search);
  if (params.get("action") === "add") vehicleModal.show();
})();

async function loadVehicles() {
  const wrap = document.getElementById("vehicles-table-wrap");
  wrap.innerHTML = `<div class="text-center text-secondary py-5"><div class="spinner-border spinner-border-sm me-2"></div>Loading vehicles…</div>`;
  try {
    const { data } = await Api.transports.getAll();
    allVehicles = data;
    renderVehiclesTable();
  } catch (err) {
    wrap.innerHTML = `<div class="empty-state"><i class="bi bi-exclamation-circle"></i><p class="mb-0">${AlertHelper.fromError(err, "Couldn't load vehicles.")}</p></div>`;
  }
}

function renderVehiclesTable() {
  const wrap = document.getElementById("vehicles-table-wrap");
  const filtered = activeTypeFilter === "ALL" ? allVehicles : allVehicles.filter(v => v.type === activeTypeFilter);

  if (!filtered || filtered.length === 0) {
    wrap.innerHTML = `<div class="empty-state"><i class="bi bi-bus-front"></i><p class="mb-0">No vehicles found.</p></div>`;
    return;
  }

  const typeIcon = { BUS: "bi-bus-front", TRAIN: "bi-train-front", METRO: "bi-subway" };

  wrap.innerHTML = `
    <div class="table-responsive-wrap">
      <table class="table table-urbangrid align-middle mb-0">
        <thead><tr><th>ID</th><th>Vehicle number</th><th>Type</th><th>Capacity</th></tr></thead>
        <tbody>
          ${filtered.map(v => `
            <tr>
              <td class="mono text-secondary">#${v.id}</td>
              <td class="fw-semibold"><i class="bi ${typeIcon[v.type] || "bi-truck"} me-2 text-secondary"></i>${escapeHtml(v.transportNumber)}</td>
              <td><span class="badge-status badge-role">${FormatHelper.titleCase(v.type)}</span></td>
              <td class="mono">${v.capacity}</td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>`;
}

async function handleVehicleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  if (!ValidationHelper.validateForm(form)) return;

  const payload = {
    transportNumber: document.getElementById("vehicle-number").value.trim(),
    type: document.getElementById("vehicle-type").value,
    capacity: Number(document.getElementById("vehicle-capacity").value)
  };

  const saveBtn = document.getElementById("vehicle-save-btn");
  saveBtn.disabled = true;
  SpinnerHelper.show();

  try {
    await Api.transports.create(payload);
    AlertHelper.success("Vehicle added successfully.");
    vehicleModal.hide();
    await loadVehicles();
  } catch (err) {
    AlertHelper.error(AlertHelper.fromError(err, "Couldn't add this vehicle. The vehicle number may already be in use."));
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
