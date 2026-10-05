/* ==========================================================================
   UrbanGrid — routes.js
   Route Management. Backend rules:
     GET /api/routes            -> OPERATOR, ADMIN only
     GET /api/routes/search     -> OPERATOR, ADMIN, COMMUTER
     POST/PUT/DELETE /api/routes -> ADMIN only
   ========================================================================== */

let currentUser = null;
let routeModal = null;

(async function initRoutes() {
  if (!AuthHelper.requireAuth()) return;
  AppShell.render();
  currentUser = AuthHelper.getUser();

  routeModal = new bootstrap.Modal(document.getElementById("route-modal"));

  const canWrite = currentUser.role === "ROLE_ADMIN";
  const canListAll = currentUser.role === "ROLE_ADMIN" || currentUser.role === "ROLE_OPERATOR";

  document.getElementById("add-route-btn").classList.toggle("d-none", !canWrite);
  document.getElementById("add-route-btn").addEventListener("click", () => openRouteModal());
  document.getElementById("route-form").addEventListener("submit", handleRouteSubmit);
  document.getElementById("search-form").addEventListener("submit", handleSearch);
  document.getElementById("clear-search-btn").addEventListener("click", () => {
    document.getElementById("search-form").reset();
    document.getElementById("clear-search-btn").classList.add("d-none");
    document.getElementById("table-title").innerHTML = '<i class="bi bi-signpost-split me-2"></i>All routes';
    if (canListAll) loadAllRoutes();
  });

  if (canListAll) {
    await loadAllRoutes();
  } else {
    // COMMUTER: backend forbids listing all routes — search only.
    document.getElementById("routes-table-wrap").innerHTML = `
      <div class="empty-state">
        <i class="bi bi-search"></i>
        <p class="mb-0">Search by source and destination above to find routes.</p>
      </div>`;
  }

  // Auto-open "Add" modal if linked from a dashboard quick action.
  const params = new URLSearchParams(window.location.search);
  if (params.get("action") === "add" && canWrite) openRouteModal();
})();

async function loadAllRoutes() {
  const wrap = document.getElementById("routes-table-wrap");
  wrap.innerHTML = `<div class="text-center text-secondary py-5"><div class="spinner-border spinner-border-sm me-2"></div>Loading routes…</div>`;
  try {
    const { data } = await Api.routes.getAll();
    renderRoutesTable(data);
  } catch (err) {
    wrap.innerHTML = `<div class="empty-state"><i class="bi bi-exclamation-circle"></i><p class="mb-0">${AlertHelper.fromError(err, "Couldn't load routes.")}</p></div>`;
  }
}

async function handleSearch(e) {
  e.preventDefault();
  const form = e.target;
  if (!ValidationHelper.validateForm(form)) return;

  const source = document.getElementById("search-source").value.trim();
  const destination = document.getElementById("search-destination").value.trim();

  const wrap = document.getElementById("routes-table-wrap");
  wrap.innerHTML = `<div class="text-center text-secondary py-5"><div class="spinner-border spinner-border-sm me-2"></div>Searching…</div>`;

  try {
    const { data } = await Api.routes.search(source, destination);
    document.getElementById("table-title").innerHTML =
      `<i class="bi bi-signpost-split me-2"></i>Results for "${escapeHtml(source)}" → "${escapeHtml(destination)}"`;
    document.getElementById("clear-search-btn").classList.remove("d-none");
    renderRoutesTable(data);
  } catch (err) {
    wrap.innerHTML = `<div class="empty-state"><i class="bi bi-exclamation-circle"></i><p class="mb-0">${AlertHelper.fromError(err, "Search failed.")}</p></div>`;
  }
}

let routesById = {};

function renderRoutesTable(routes) {
  const wrap = document.getElementById("routes-table-wrap");
  const canWrite = currentUser.role === "ROLE_ADMIN";

  if (!routes || routes.length === 0) {
    wrap.innerHTML = `<div class="empty-state"><i class="bi bi-signpost"></i><p class="mb-0">No routes found.</p></div>`;
    return;
  }

  routesById = {};
  routes.forEach(r => { routesById[r.id] = r; });

  wrap.innerHTML = `
    <div class="table-responsive-wrap">
      <table class="table table-urbangrid align-middle mb-0">
        <thead><tr>
          <th>ID</th><th>Route name</th><th>Source</th><th>Destination</th><th>Duration</th>
          ${canWrite ? '<th class="text-end">Actions</th>' : ""}
        </tr></thead>
        <tbody>
          ${routes.map(r => `
            <tr>
              <td class="mono text-secondary">#${r.id}</td>
              <td class="fw-semibold">${escapeHtml(r.routeName)}</td>
              <td>${escapeHtml(r.source)}</td>
              <td>${escapeHtml(r.destination)}</td>
              <td class="mono">${escapeHtml(r.estimatedDuration || "—")}</td>
              ${canWrite ? `
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-navy me-1" onclick="editRoute(${r.id})"><i class="bi bi-pencil"></i></button>
                  <button class="btn btn-sm btn-outline-danger" onclick="deleteRoute(${r.id})"><i class="bi bi-trash"></i></button>
                </td>` : ""}
            </tr>`).join("")}
        </tbody>
      </table>
    </div>`;
}

function openRouteModal(route = null) {
  const form = document.getElementById("route-form");
  ValidationHelper.resetForm(form);

  document.getElementById("route-modal-title").textContent = route ? "Edit Route" : "Add Route";
  document.getElementById("route-id").value = route ? route.id : "";
  document.getElementById("route-name").value = route ? route.routeName : "";
  document.getElementById("route-source").value = route ? route.source : "";
  document.getElementById("route-destination").value = route ? route.destination : "";
  document.getElementById("route-duration").value = route ? (route.estimatedDuration || "") : "";

  routeModal.show();
}

function editRoute(id) { openRouteModal(routesById[id]); }

async function handleRouteSubmit(e) {
  e.preventDefault();
  const form = e.target;
  if (!ValidationHelper.validateForm(form)) return;

  const id = document.getElementById("route-id").value;
  const payload = {
    routeName: document.getElementById("route-name").value.trim(),
    source: document.getElementById("route-source").value.trim(),
    destination: document.getElementById("route-destination").value.trim(),
    estimatedDuration: document.getElementById("route-duration").value.trim()
  };

  const saveBtn = document.getElementById("route-save-btn");
  saveBtn.disabled = true;
  SpinnerHelper.show();

  try {
    if (id) {
      await Api.routes.update(id, payload);
      AlertHelper.success("Route updated successfully.");
    } else {
      await Api.routes.create(payload);
      AlertHelper.success("Route created successfully.");
    }
    routeModal.hide();
    await loadAllRoutes();
  } catch (err) {
    AlertHelper.error(AlertHelper.fromError(err, "Couldn't save this route."));
  } finally {
    saveBtn.disabled = false;
    SpinnerHelper.hide();
  }
}

function deleteRoute(id) {
  const name = routesById[id] ? routesById[id].routeName : `#${id}`;
  ConfirmHelper.ask(`Delete route "${name}"? This can't be undone.`, async () => {
    SpinnerHelper.show();
    try {
      await Api.routes.remove(id);
      AlertHelper.success("Route deleted.");
      await loadAllRoutes();
    } catch (err) {
      AlertHelper.error(AlertHelper.fromError(err, "Couldn't delete this route."));
    } finally {
      SpinnerHelper.hide();
    }
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : str;
  return div.innerHTML;
}
