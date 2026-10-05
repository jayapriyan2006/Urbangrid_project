/* ==========================================================================
   UrbanGrid — users.js
   Admin-only user directory. Backend:
     GET    /api/admin/users            -> ADMIN
     GET    /api/admin/users/operators  -> ADMIN
     DELETE /api/admin/users/{id}       -> ADMIN, 204 No Content
   Note: the User entity does not exclude "password" from its JSON response,
   so the API technically returns the hash — this UI deliberately never
   renders it.
   ========================================================================== */

let currentUser = null;
let activeRoleFilter = "ALL";

(async function initUsers() {
  if (!AuthHelper.requireRole("ROLE_ADMIN")) return;
  AppShell.render();
  currentUser = AuthHelper.getUser();

  document.querySelectorAll("#role-filter button").forEach(btn => {
    btn.addEventListener("click", async () => {
      document.querySelectorAll("#role-filter button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeRoleFilter = btn.dataset.role;
      await loadUsers();
    });
  });

  await loadUsers();
})();

async function loadUsers() {
  const wrap = document.getElementById("users-table-wrap");
  wrap.innerHTML = `<div class="text-center text-secondary py-5"><div class="spinner-border spinner-border-sm me-2"></div>Loading users…</div>`;
  try {
    const { data } = activeRoleFilter === "ROLE_OPERATOR"
      ? await Api.users.getOperators()
      : await Api.users.getAll();
    renderUsersTable(data);
  } catch (err) {
    wrap.innerHTML = `<div class="empty-state"><i class="bi bi-exclamation-circle"></i><p class="mb-0">${AlertHelper.fromError(err, "Couldn't load users.")}</p></div>`;
  }
}

let usersById = {};

function renderUsersTable(users) {
  const wrap = document.getElementById("users-table-wrap");

  if (!users || users.length === 0) {
    wrap.innerHTML = `<div class="empty-state"><i class="bi bi-person-x"></i><p class="mb-0">No users found.</p></div>`;
    return;
  }

  usersById = {};
  users.forEach(u => { usersById[u.id] = u; });

  wrap.innerHTML = `
    <div class="table-responsive-wrap">
      <table class="table table-urbangrid align-middle mb-0">
        <thead><tr><th>ID</th><th>Username</th><th>Full name</th><th>Email</th><th>Phone</th><th>Role</th><th class="text-end">Actions</th></tr></thead>
        <tbody>
          ${users.map(u => `
            <tr>
              <td class="mono text-secondary">#${u.id}</td>
              <td class="fw-semibold">${escapeHtml(u.username)}</td>
              <td>${escapeHtml(u.fullName || "—")}</td>
              <td>${escapeHtml(u.email || "—")}</td>
              <td>${escapeHtml(u.phone || "—")}</td>
              <td><span class="badge-status badge-role">${FormatHelper.titleCase((u.role || "").replace("ROLE_", ""))}</span></td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-danger" ${u.id === currentUser.id ? `disabled title="You can&#39;t delete your own account."` : ""}
                  onclick="deleteUser(${u.id})">
                  <i class="bi bi-trash"></i>
                </button>
              </td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>`;
}

function deleteUser(id) {
  const username = usersById[id] ? usersById[id].username : `#${id}`;
  ConfirmHelper.ask(`Delete user "${username}"? This can't be undone.`, async () => {
    SpinnerHelper.show();
    try {
      await Api.users.remove(id);
      AlertHelper.success("User deleted.");
      await loadUsers();
    } catch (err) {
      AlertHelper.error(AlertHelper.fromError(err, "Couldn't delete this user."));
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
