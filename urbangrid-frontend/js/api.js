/* ==========================================================================
   UrbanGrid — api.js
   Axios instance, interceptors, and a thin wrapper around every backend
   endpoint. This is the ONLY file that should know request/response shapes.
   Production Railway backend URL below.
   ========================================================================== */

const API_BASE_URL =
  (typeof window !== "undefined" && window.UG_API_BASE_URL) ||
  "https://urbangridproject-production.up.railway.app/api";

// Single Axios instance used everywhere.
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" }
});

/* ---------- Request interceptor: attach JWT to every request ---------- */
apiClient.interceptors.request.use(
  (config) => {
    const token = (typeof AuthHelper !== "undefined" && AuthHelper.getToken)
      ? AuthHelper.getToken()
      : localStorage.getItem("ug_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ---------- Response interceptor: handle 401 / 403 / errors ---------- */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;

      if (status === 401) {
        // Token missing/expired/invalid — force re-login.
        if (typeof AuthHelper !== "undefined") {
          AuthHelper.clearSession();
        } else {
          localStorage.removeItem("ug_token");
          localStorage.removeItem("ug_user");
        }
        if (!window.location.pathname.endsWith("login.html")) {
          window.location.href = "login.html";
        }
      } else if (status === 403) {
        // Authenticated, but role doesn't permit this action.
        if (typeof AlertHelper !== "undefined") {
          AlertHelper.toast("You don't have permission to do that.", "danger");
        }
      }
    }
    return Promise.reject(error);
  }
);

/* ==========================================================================
   API wrapper — one function per backend endpoint.
   Every path/method/body below matches the Spring Boot controllers exactly.
   ========================================================================== */
const Api = {
  /* ---- Auth (public) ---- */
  auth: {
    // POST /api/auth/login  { username, password } -> JwtResponse
    login: (username, password) =>
      apiClient.post("/auth/login", { username, password }),

    // POST /api/auth/register  { username, password, email, fullName, role? } -> string message
    register: (payload) => apiClient.post("/auth/register", payload)
  },

  /* ---- Routes ---- */
  routes: {
    // GET /api/routes -> List<Route>   (OPERATOR, ADMIN)
    getAll: () => apiClient.get("/routes"),

    // GET /api/routes/{id} -> Route    (OPERATOR, ADMIN)
    getById: (id) => apiClient.get(`/routes/${id}`),

    // GET /api/routes/search?source=&destination= -> List<Route> (OPERATOR, ADMIN, COMMUTER)
    search: (source, destination) =>
      apiClient.get("/routes/search", { params: { source, destination } }),

    // POST /api/routes  Route -> string  (ADMIN)
    create: (route) => apiClient.post("/routes", route),

    // PUT /api/routes/{id}  Route -> string  (ADMIN)
    update: (id, route) => apiClient.put(`/routes/${id}`, route),

    // DELETE /api/routes/{id} -> string  (ADMIN)
    remove: (id) => apiClient.delete(`/routes/${id}`)
  },

  /* ---- Schedules ---- */
  schedules: {
    // GET /api/schedules -> List<Schedule>  (OPERATOR, ADMIN, COMMUTER)
    getAll: () => apiClient.get("/schedules"),

    // POST /api/schedules  Schedule -> Schedule  (ADMIN)
    create: (schedule) => apiClient.post("/schedules", schedule),

    // PUT /api/schedules/{id}  Schedule -> Schedule  (ADMIN)
    update: (id, schedule) => apiClient.put(`/schedules/${id}`, schedule),

    // DELETE /api/schedules/{id} -> string  (ADMIN)
    remove: (id) => apiClient.delete(`/schedules/${id}`)
  },

  /* ---- Transports ("Vehicles") — backend only supports list + create ---- */
  transports: {
    // GET /api/transports -> List<Transport>  (any authenticated user)
    getAll: () => apiClient.get("/transports"),

    // POST /api/transports  Transport -> Transport  (any authenticated user)
    create: (transport) => apiClient.post("/transports", transport)
  },

  /* ---- Alerts ("Maintenance / Delay Alerts") — list + create only ---- */
  alerts: {
    // GET /api/alerts -> List<DelayAlert>  (any authenticated user)
    getAll: () => apiClient.get("/alerts"),

    // POST /api/alerts  DelayAlert -> DelayAlert  (any authenticated user)
    create: (alert) => apiClient.post("/alerts", alert)
  },

  /* ---- Reports (dashboard) ---- */
  reports: {
    // GET /api/reports/stats -> Map<String, Long>
    stats: () => apiClient.get("/reports/stats"),

    // GET /api/reports/volume -> List<Map>
    volume: () => apiClient.get("/reports/volume"),

    // GET /api/reports/share -> List<Map>
    share: () => apiClient.get("/reports/share")
  },

  /* ---- Admin: Users ---- */
  users: {
    // GET /api/admin/users -> List<User>  (ADMIN)
    getAll: () => apiClient.get("/admin/users"),

    // GET /api/admin/users/operators -> List<User>  (ADMIN)
    getOperators: () => apiClient.get("/admin/users/operators"),

    // DELETE /api/admin/users/{id} -> 204 No Content  (ADMIN)
    remove: (id) => apiClient.delete(`/admin/users/${id}`)
  }
};
