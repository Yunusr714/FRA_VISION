import { Router } from "express";
import { pool } from "../db/pool";
import { z } from "zod";
import { authRequired, requireRoles } from "../middleware/auth";
import { hashPassword } from "../utils/password";

export const usersRouter = Router();

// Admin only
usersRouter.use(authRequired, requireRoles("mota_admin"));

usersRouter.get("/", async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.username, u.email, u.name, u.phone, u.state_id, u.district_id, u.status,
            r.code as role, u.created_at
     FROM users u
     JOIN roles r ON r.id = u.role_id
     ORDER BY u.created_at DESC`
  );
  res.json(rows);
});

const createUserSchema = z.object({
  role_code: z.enum([
    "mota_admin",
    "district_officer",
    "forest_revenue_officer",
    "pda_planner",
    "ngo_user",
    "citizen_user"
  ]),
  username: z.string().min(3),
  password: z.string().min(6),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6).max(32),
  state_id: z.number().int().optional().nullable(),
  district_id: z.number().int().optional().nullable()
});

usersRouter.post("/", async (req, res) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  const { role_code, username, password, name, email, phone, state_id, district_id } =
    parsed.data;

  const [roleRows] = await pool.query("SELECT id FROM roles WHERE code = ? LIMIT 1", [
    role_code
  ]);
  const role = (roleRows as any[])[0];
  if (!role) return res.status(400).json({ error: "Unknown role_code" });

  const [exists] = await pool.query(
    "SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1",
    [username, email]
  );
  if ((exists as any[]).length > 0) {
    return res.status(409).json({ error: "Username or email already exists" });
  }

  const password_hash = await hashPassword(password);
  await pool.query(
    `INSERT INTO users (role_id, organization_id, username, email, phone, password_hash, name, state_id, district_id, status, created_at, updated_at)
     VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())`,
    [role.id, username, email, phone, password_hash, name, state_id ?? null, district_id ?? null]
  );

  res.status(201).json({ success: true });
});

usersRouter.patch("/:id/status", async (req, res) => {
  const id = Number(req.params.id);
  const status = req.body?.status;
  if (!["active", "inactive"].includes(status)) {
    return res.status(400).json({ error: "status must be 'active' or 'inactive'" });
  }
  await pool.query("UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?", [
    status,
    id
  ]);
  res.json({ success: true });
});