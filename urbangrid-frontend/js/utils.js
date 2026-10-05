/* ==========================================================================
   UrbanGrid — utils.js
   Small, framework-free helpers shared across every page.
   ========================================================================== */

/* ---------- LocalStorage helper ---------- */
const StorageHelper = {
  KEYS: {
    TOKEN: "ug_token",
    USER: "ug_user"
  },
  set(key, value) {
    localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
  },
  get(key) {
    return localStorage.getItem(key);
  },
  getJSON(key) {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  },
  remove(key) {
    localStorage.removeItem(key);
  }
};

/* ---------- JWT helper ---------- */
const JwtHelper = {
  // Decodes the payload of a JWT without verifying the signature
  // (verification happens server-side; this is only for reading claims
  // like expiry on the client).
  decode(token) {
    try {
      const payload = token.split(".")[1];
      const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
      return JSON.parse(decoded);
    } catch (e) {
      return null;
    }
  },
  isExpired(token) {
    const claims = this.decode(token);
    if (!claims || !claims.exp) return false; // can't tell — let the server decide
    return Date.now() >= claims.exp * 1000;
  }
};

/* ---------- Alert / toast helper ---------- */
const AlertHelper = {
  ensureContainer() {
    let container = document.getElementById("ug-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "ug-toast-container";
      container.className = "toast-container position-fixed top-0 end-0 p-3";
      container.style.zIndex = 2100;
      document.body.appendChild(container);
    }
    return container;
  },

  // type: "success" | "danger" | "warning" | "info"
  toast(message, type = "success") {
    const container = this.ensureContainer();
    const id = "toast-" + Date.now();
    const iconMap = {
      success: "bi-check-circle-fill",
      danger: "bi-x-circle-fill",
      warning: "bi-exclamation-triangle-fill",
      info: "bi-info-circle-fill"
    };
    const el = document.createElement("div");
    el.id = id;
    el.className = `toast align-items-center text-bg-${type} border-0`;
    el.setAttribute("role", "alert");
    el.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          <i class="bi ${iconMap[type] || iconMap.info} me-2"></i>${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>`;
    container.appendChild(el);
    const toast = new bootstrap.Toast(el, { delay: 4000 });
    toast.show();
    el.addEventListener("hidden.bs.toast", () => el.remove());
  },

  success(message) { this.toast(message, "success"); },
  error(message) { this.toast(message, "danger"); },
  warning(message) { this.toast(message, "warning"); },

  // Extracts a readable message from a backend error response.
  // GlobalExceptionHandler returns { message: "..." }; fall back gracefully.
  fromError(error, fallback = "Something went wrong. Please try again.") {
    if (error && error.response && error.response.data) {
      const data = error.response.data;
      if (typeof data === "string") return data;
      if (data.message) return data.message;
    }
    if (error && error.message === "Network Error") {
      return "Can't reach the backend server. Please check your internet connection or server availability.";
    }
    return fallback;
  }
};

/* ---------- Spinner helper ---------- */
const SpinnerHelper = {
  ensureOverlay() {
    let overlay = document.getElementById("ug-spinner-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "ug-spinner-overlay";
      overlay.className = "ug-spinner-overlay d-none";
      overlay.innerHTML = `
        <div class="ug-spinner-box">
          <div class="spinner-border spinner-border-sm text-teal" role="status"></div>
          <span>Loading…</span>
        </div>`;
      document.body.appendChild(overlay);
    }
    return overlay;
  },
  show() { this.ensureOverlay().classList.remove("d-none"); },
  hide() { this.ensureOverlay().classList.add("d-none"); }
};

/* ---------- Formatting helpers ---------- */
const FormatHelper = {
  dateTime(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleString(undefined, {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    });
  },
  statusBadgeClass(status) {
    switch ((status || "").toUpperCase()) {
      case "ON_TIME": return "badge-ontime";
      case "DELAYED": return "badge-delayed";
      case "CANCELLED": return "badge-cancelled";
      default: return "badge-role";
    }
  },
  titleCase(value) {
    if (!value) return "";
    return value.toString().toLowerCase().replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  }
};

/* ---------- Simple form validation helper ---------- */
const ValidationHelper = {
  // Applies Bootstrap's built-in validation styles to a <form>.
  // Returns true if valid.
  validateForm(formEl) {
    formEl.classList.add("was-validated");
    return formEl.checkValidity();
  },
  resetForm(formEl) {
    formEl.classList.remove("was-validated");
    formEl.reset();
  }
};

/* ---------- Confirmation dialog helper (Bootstrap modal based) ---------- */
const ConfirmHelper = {
  ensureModal() {
    let modal = document.getElementById("ug-confirm-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "ug-confirm-modal";
      modal.className = "modal fade";
      modal.tabIndex = -1;
      modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title"><i class="bi bi-exclamation-triangle text-danger me-2"></i>Confirm</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body" id="ug-confirm-body">Are you sure?</div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-navy" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-danger" id="ug-confirm-ok">Delete</button>
            </div>
          </div>
        </div>`;
      document.body.appendChild(modal);
    }
    return modal;
  },
  // Shows a confirm dialog; calls onConfirm() if the user confirms.
  ask(message, onConfirm, okLabel = "Delete") {
    const modal = this.ensureModal();
    modal.querySelector("#ug-confirm-body").textContent = message;
    const okBtn = modal.querySelector("#ug-confirm-ok");
    okBtn.textContent = okLabel;
    const bsModal = new bootstrap.Modal(modal);
    const handler = () => {
      bsModal.hide();
      okBtn.removeEventListener("click", handler);
      onConfirm();
    };
    okBtn.addEventListener("click", handler);
    bsModal.show();
  }
};
