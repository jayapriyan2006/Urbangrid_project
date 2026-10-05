-- ============================================================
--  UrbanGrid – MySQL Database Schema
--  Run this script once to initialise the database.
--  Spring Boot (ddl-auto=update) will keep tables in sync.
-- ============================================================

CREATE DATABASE IF NOT EXISTS urbangrid_db;
USE urbangrid_db;

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50)  NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role     VARCHAR(20)  NOT NULL DEFAULT 'ROLE_COMMUTER',
    full_name VARCHAR(100),
    email    VARCHAR(100) UNIQUE,
    phone    VARCHAR(20)
);

-- ── Routes ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS routes (
    id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
    route_name         VARCHAR(100) NOT NULL,
    source             VARCHAR(100) NOT NULL,
    destination        VARCHAR(100) NOT NULL,
    estimated_duration VARCHAR(50)
);

-- ── Transports ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transports (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    transport_number VARCHAR(50)  NOT NULL UNIQUE,
    type             VARCHAR(20)  NOT NULL,
    capacity         INT          NOT NULL DEFAULT 0
);

-- ── Schedules ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS schedules (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    departure_time DATETIME NOT NULL,
    arrival_time   DATETIME NOT NULL,
    status         VARCHAR(20) NOT NULL DEFAULT 'ON_TIME',
    transport_id   BIGINT,
    route_id       BIGINT,
    CONSTRAINT fk_schedule_transport FOREIGN KEY (transport_id) REFERENCES transports(id) ON DELETE SET NULL,
    CONSTRAINT fk_schedule_route     FOREIGN KEY (route_id)     REFERENCES routes(id)     ON DELETE SET NULL
);

-- ── Delay Alerts ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS delay_alerts (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    message     TEXT,
    alert_type  VARCHAR(30),
    created_at  DATETIME,
    schedule_id BIGINT,
    CONSTRAINT fk_alert_schedule FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE SET NULL
);

-- ============================================================
--  Sample Data
-- ============================================================

-- Default ADMIN user  (password: admin123)
INSERT IGNORE INTO users (username, password, role, full_name, email, phone) VALUES
('admin',    '$2a$10$eXample.BCryptHashForAdmin123.XxXxXxXxXxXxXxXxXxXxXxX', 'ROLE_ADMIN',    'System Admin',  'admin@urbangrid.com',    '9000000001'),
('operator1','$2a$10$eXample.BCryptHashForOp1.XxXxXxXxXxXxXxXxXxXxXxXxXxX', 'ROLE_OPERATOR', 'John Operator', 'operator@urbangrid.com', '9000000002'),
('commuter1','$2a$10$eXample.BCryptHashForC1.XxXxXxXxXxXxXxXxXxXxXxXxXxXx', 'ROLE_COMMUTER', 'Jane Commuter', 'commuter@urbangrid.com', '9000000003');

-- NOTE: The BCrypt hashes above are placeholders.
-- Use the DataLoader (src/main/java/.../DataLoader.java) which
-- runs on startup and inserts properly hashed demo users.

-- Sample Routes
INSERT IGNORE INTO routes (route_name, source, destination, estimated_duration) VALUES
('Express-101', 'Central Station',  'Airport',       '45 mins'),
('Metro-202',   'City Mall',        'Tech Park',     '30 mins'),
('City-303',    'North Terminal',   'South Terminal','60 mins'),
('Ring-404',    'East Junction',    'West Junction', '50 mins');

-- Sample Transports
INSERT IGNORE INTO transports (transport_number, type, capacity) VALUES
('BUS-001',   'BUS',   55),
('BUS-002',   'BUS',   60),
('TRAIN-101', 'TRAIN', 300),
('METRO-201', 'METRO', 200);

-- Sample Schedules (relative times — adjust as needed)
INSERT IGNORE INTO schedules (departure_time, arrival_time, status, transport_id, route_id) VALUES
('2024-06-01 08:00:00', '2024-06-01 08:45:00', 'ON_TIME',  1, 1),
('2024-06-01 09:00:00', '2024-06-01 09:30:00', 'ON_TIME',  2, 2),
('2024-06-01 10:00:00', '2024-06-01 11:00:00', 'DELAYED',  3, 3),
('2024-06-01 11:00:00', '2024-06-01 11:50:00', 'ON_TIME',  4, 4);

-- Sample Delay Alerts
INSERT IGNORE INTO delay_alerts (message, alert_type, created_at, schedule_id) VALUES
('Bus BUS-001 delayed by 20 minutes due to traffic.',  'DELAY',        NOW(), 3),
('Metro-201 maintenance scheduled for tomorrow.',      'MAINTENANCE',  NOW(), NULL);
