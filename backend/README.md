# FRA-Vision Backend (Express + MySQL + JWT)

Features
- Central login for all roles (users table joined to roles table).
- Citizen self-registration (other roles created by MOTA Admin).
- JWT-based auth with role guards.
- Clean route separation: /api/auth, /api/users, /api/claims.
- CORS for local dev.
- MySQL using mysql2/promise.

Quick start
1) Copy this backend folder next to your frontend.
2) Create .env (see .env.example).
3) npm install
4) npm run dev
5) In frontend .env, set VITE_API_BASE_URL=http://localhost:4000

Endpoints
- POST /api/auth/login
- POST /api/auth/register/citizen
- GET  /api/auth/me

- GET  /api/roles                  (admin only)
- GET  /api/users                  (admin only)
- POST /api/users                  (admin only; create any non-citizen role)
- PATCH /api/users/:id/status      (admin only, activate/deactivate)

- GET  /api/claims                 (all authenticated; placeholder)
- GET  /api/claims/:id             (all authenticated; placeholder)
- POST /api/claims                 (citizen/ngo allowed to submit; placeholder)
- PUT  /api/claims/:id/geometry    (ONLY forest_revenue_officer or mota_admin)

DB required tables (you said they already exist)
- roles(id, code, name, created_at)
- users(id, role_id, organization_id, username, email, phone, password_hash, name, state_id, district_id, status, created_at, updated_at)

Seed admin (optional)
- Insert a MOTA Admin user manually or add a small seed script. Password hashing uses bcrypt.

Security notes
- JWT secret in .env (JWT_SECRET).
- Passwords hashed with bcrypt.