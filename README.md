# 🚌 UrbanGrid — Urban Public Transport Management System

UrbanGrid is a Spring Boot-based Urban Public Transport Management System that provides secure REST APIs for managing buses, routes, drivers, schedules, passengers, and bookings. Built with Java, Spring Security, JWT, JPA, Hibernate, and MySQL using a scalable layered architecture.

---

## 📁 Project Structure

```
urbangrid/
├── backend/                          ← Spring Boot (Java 17 + Maven)
│   ├── pom.xml
│   └── src/main/java/com/urbangrid/
│       ├── UrbanGridApplication.java
│       ├── DataLoader.java           ← Seeds demo users on startup
│       ├── entity/                   ← JPA Entities
│       │   ├── User.java
│       │   ├── Route.java
│       │   ├── Transport.java
│       │   ├── Schedule.java
│       │   └── DelayAlert.java
│       ├── repository/               ← Spring Data JPA Repositories
│       ├── service/                  ← Business Logic (RouteService)
│       ├── controller/               ← REST Controllers
│       ├── security/                 ← JWT + Spring Security
│       │   ├── JwtUtils.java
│       │   ├── AuthTokenFilter.java
│       │   ├── UserDetailsImpl.java
│       │   ├── UserDetailsServiceImpl.java
│       │   └── WebSecurityConfig.java
│       ├── dto/                      ← Request/Response DTOs
│       └── exception/                ← Global Exception Handling
│
└── frontend/                         ← Vanilla JS / HTML Frontend
```

---

## ⚙️ Prerequisites

| Tool        | Version  |
|-------------|----------|
| Java        | 17+      |
| Maven       | 3.8+     |
| MySQL       | 8.0+     |

---

## 🗄️ Step 1 — Database Setup

```sql
-- Run in MySQL Workbench or terminal:
CREATE DATABASE urbangrid_db;
```

> Spring Boot's `ddl-auto=update` will create all tables automatically on first run.
> The `DataLoader.java` seeds three demo users with hashed passwords on startup.

---

## 🔧 Step 2 — Configure Database Credentials

Open `backend/src/main/resources/application.properties` and update:

```properties
spring.datasource.username=root     # ← your MySQL username
spring.datasource.password=root     # ← your MySQL password
```

---

## 🚀 Step 3 — Run the Backend

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

Backend starts at: **http://localhost:8081**

Watch for these startup messages:
```
✅ Demo ADMIN    user created: admin    / admin123
✅ Demo OPERATOR user created: operator1 / op123
✅ Demo COMMUTER user created: commuter1 / com123
```

---

## 💻 Step 4 — Run the Frontend

Open `urbangrid-frontend/index.html` or `login.html` in your web browser.

---

## 👤 Demo Accounts

| Role      | Username   | Password  |
|-----------|------------|-----------|
| ADMIN     | admin      | admin123  |
| OPERATOR  | operator1  | op123     |
| COMMUTER  | commuter1  | com123    |

---

## 🔐 Role Permissions

| Feature              | ADMIN | OPERATOR | COMMUTER |
|----------------------|-------|----------|----------|
| Dashboard stats      | ✅    | ✅       | ✅       |
| View Routes          | ✅    | ✅       | —        |
| Create/Edit Routes   | ✅    | —        | —        |
| View Schedules       | ✅    | ✅       | ✅       |
| Create/Edit Schedules| ✅    | —        | —        |
| Manage Transports    | ✅    | —        | —        |
| Broadcast Alerts     | ✅    | ✅       | —        |
| View Alerts          | ✅    | ✅       | ✅       |
| Manage Users         | ✅    | —        | —        |

---

## 🌐 API Endpoints Reference

### Auth (Public)
```
POST  /api/auth/login           → { accessToken, id, username, email, role }
POST  /api/auth/register        → "User registered successfully!"
```

### Routes (ADMIN / OPERATOR)
```
GET    /api/routes              → List<Route>
GET    /api/routes/{id}         → Route
POST   /api/routes              → "Route created successfully." (201)
PUT    /api/routes/{id}         → "Route updated successfully."
DELETE /api/routes/{id}         → "Route deleted successfully."
GET    /api/routes/search?source=&destination= → List<Route>
```

### Schedules (ADMIN / OPERATOR)
```
GET    /api/schedules           → List<Schedule>
POST   /api/schedules           → Schedule
PUT    /api/schedules/{id}      → Schedule
DELETE /api/schedules/{id}      → "Schedule deleted successfully."
```

### Transports (Authenticated)
```
GET    /api/transports          → List<Transport>
POST   /api/transports          → Transport
```

### Alerts (Authenticated)
```
GET    /api/alerts              → List<DelayAlert>
POST   /api/alerts              → DelayAlert
```

### Admin — Users (ADMIN only)
```
GET    /api/admin/users         → List<User>
GET    /api/admin/users/operators → List<User>
DELETE /api/admin/users/{id}    → 204 No Content
```

### Reports (Authenticated)
```
GET    /api/reports/stats       → { totalRoutes, totalSchedules, totalUsers, totalTransports, totalAlerts }
GET    /api/reports/volume      → weekly volume data
GET    /api/reports/share       → transport type distribution
```

---

## 🏗️ Technology Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Backend     | Spring Boot 3.2, Java 17/21, Maven|
| Database    | MySQL 8, Spring Data JPA          |
| Security    | Spring Security, JWT (jjwt 0.11)  |
| Frontend    | HTML5, CSS3, JavaScript, Axios    |
| Utilities   | Lombok                            |

---

## 🐞 Common Issues

### Port 8081 already in use
```bash
# Find and kill the process
lsof -i :8081
kill -9 <PID>
```

### MySQL connection refused
- Ensure MySQL service is running: `sudo service mysql start`
- Check credentials in `application.properties`

---

## 📝 Notes for Evaluators

- **Constructor injection** used throughout (no `@Autowired` field injection)
- **Lombok** used on entities to eliminate boilerplate getters/setters/builders
- **Service Interface + Impl** pattern demonstrated for `RouteService`
- **Global exception handling** via `@ControllerAdvice` with consistent JSON error format
- **JWT stateless auth** — no server-side sessions
- **Role-based UI** — sidebar and buttons adapt based on logged-in user's role
- **DataLoader** seeds the database on first run so demo works immediately

