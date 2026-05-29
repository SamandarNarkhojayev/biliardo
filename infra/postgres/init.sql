-- Создаёт схемы под каждый сервис.
-- Каждый сервис имеет свою Prisma schema и пишет ТОЛЬКО в свою схему.
-- Это обеспечивает "DB per service" логически, без overhead отдельных Postgres-инстансов.

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS tournament;
CREATE SCHEMA IF NOT EXISTS payment;
CREATE SCHEMA IF NOT EXISTS club;
CREATE SCHEMA IF NOT EXISTS admin;

-- Права (для prod лучше создать отдельных пользователей под каждый сервис)
GRANT ALL ON SCHEMA auth TO billiard;
GRANT ALL ON SCHEMA tournament TO billiard;
GRANT ALL ON SCHEMA payment TO billiard;
GRANT ALL ON SCHEMA club TO billiard;
GRANT ALL ON SCHEMA admin TO billiard;
