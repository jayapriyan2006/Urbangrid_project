# UrbanGrid Frontend

A vanilla HTML5 / CSS3 / Bootstrap 5 / Axios frontend for the UrbanGrid Spring Boot backend.

## Running it

1. Production Spring Boot backend is deployed at: `https://urbangridproject-production.up.railway.app`.
2. Open `frontend/` in VS Code and start **Live Server** on `login.html` (or `index.html`), or deploy directly to Vercel/Netlify.
   No build step, no npm install — everything is loaded from CDNs.
3. If your backend runs on a different host/port, set `window.UG_API_BASE_URL` or change `API_BASE_URL` at the top of `js/api.js`.

## Login

Use an account created via the Register page, or create one directly against the backend.
New accounts default to the `Commuter` role unless another role is picked at signup.

## How backend modules map to pages

The requested module list (Vehicle / Driver / Route / Schedule / Maintenance Management) didn't
line up exactly with what the backend implements, so here's the honest mapping — no invented
endpoints, no placeholder data:

| Requested module | Page | Backend reality |
|---|---|---|
| Route Management | `routes.html` | Full CRUD (`GET/POST/PUT/DELETE /api/routes`, plus `/search`). Matches as requested. |
| Schedule Management | `schedules.html` | Full CRUD (`GET/POST/PUT/DELETE /api/schedules`). Matches as requested. |
| Vehicle Management | `vehicles.html` | Backed by `Transport` (`/api/transports`). Backend only has `GET`/`POST` — **no edit or delete endpoint exists**, so this page only supports list + add. |
| Maintenance Management | `alerts.html` | There's no dedicated maintenance entity. The closest real thing is `DelayAlert` (`/api/alerts`), whose `alertType` includes `MAINTENANCE` alongside `DELAY` and `CANCELLATION`. Built as a general alert feed with type filtering, list + add only (no edit/delete endpoints). |
| Driver Management | *(not built)* | No `Driver` entity or controller exists anywhere in the backend. Rather than invent one, this page was left out. |
| — | `users.html` | Bonus page: the backend has `/api/admin/users` (list, list operators, delete) that wasn't in the original module list, so it was added for Admins. |

## Roles & access

The UI reflects the backend's `@PreAuthorize` rules — it hides actions a role can't perform, but
the backend is still the source of truth (a `403` from the API shows a toast either way):

- **Admin**: full access everywhere, including Users.
- **Operator**: can view routes/schedules, but can't create/edit/delete them (Admin-only in the backend). Can still add vehicles and post alerts (open to any authenticated user).
- **Commuter**: can't list all routes (`GET /api/routes` is Operator/Admin-only) — only route *search* is available. Can view schedules, add vehicles, and post alerts.

## Project structure

```
frontend/
  index.html          redirects to dashboard or login based on session
  login.html
  register.html
  dashboard.html
  routes.html
  schedules.html
  vehicles.html
  alerts.html
  users.html           (Admin only)
css/
  style.css            design tokens, sidebar/topbar, shared components
  dashboard.css
  responsive.css
js/
  api.js               Axios instance + interceptors + one function per backend endpoint
  auth.js              session handling, page guards, sidebar rendering
  utils.js             localStorage, JWT decode, toasts, spinner, confirm dialogs
  dashboard.js / routes.js / schedules.js / vehicles.js / alerts.js / users.js
```

## Notes

- JWT is stored in `localStorage` and attached to every request via an Axios request interceptor.
- A response interceptor catches `401` (clears the token, redirects to `login.html`) and `403`
  (shows a toast — you're logged in, just not allowed to do that).
- The `User` entity's backend response includes the password hash (no `@JsonIgnore` on that
  field) — the Users page deliberately never renders it.
