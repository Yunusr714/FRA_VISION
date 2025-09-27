import { Router } from "express";
import { pool } from "../db/pool";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { config } from "../config/env";
import { hashPassword, verifyPassword } from "../utils/password";
import { authRequired } from "../middleware/auth";

export const authRouter = Router();

const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6)
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });
  const { username, password } = parsed.data;

  const [rows] = await pool.query(
    `SELECT u.id, u.username, u.email, u.name, u.password_hash, u.state_id, u.district_id, u.status,
            r.code AS role_code, r.name AS role_name
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.username = ? LIMIT 1`,
    [username]
  );
  const list = rows as any[];
  if (list.length === 0) return res.status(401).json({ error: "Invalid credentials" });

  const user = list[0];
  if (user.status !== "active") return res.status(403).json({ error: "User inactive" });

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    {
      sub: user.id,
      role: user.role_code,
      username: user.username,
      name: user.name,
      email: user.email,
      district_id: user.district_id,
      state_id: user.state_id
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  const userPayload = {
    id: user.id,
    username: user.username,
    role: user.role_code,
    email: user.email,
    name: user.name,
    district: user.district_id ?? null,
    state: user.state_id ?? null
  };

  res.json({ token, user: userPayload });
});

const citizenRegisterSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6).max(32),
  state_id: z.number().int().optional().nullable(),
  district_id: z.number().int().optional().nullable()
});

authRouter.post("/register/citizen", async (req, res) => {
  const parsed = citizenRegisterSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  const { username, password, name, email, phone, state_id, district_id } = parsed.data;

  // Look up citizen role_id
  const [roleRows] = await pool.query("SELECT id FROM roles WHERE code = 'citizen_user' LIMIT 1");
  const role = (roleRows as any[])[0];
  if (!role) return res.status(500).json({ error: "Role 'citizen_user' missing" });

  // Uniqueness checks
  const [existsRows] = await pool.query(
    "SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1",
    [username, email]
  );
  if ((existsRows as any[]).length > 0) {
    return res.status(409).json({ error: "Username or email already exists" });
  }

  const password_hash = await hashPassword(password);
  const [result] = await pool.query(
    `INSERT INTO users (role_id, organization_id, username, email, phone, password_hash, name, state_id, district_id, status, created_at, updated_at)
     VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())`,
    [role.id, username, email, phone, password_hash, name, state_id ?? null, district_id ?? null]
  );

  const userId = (result as any).insertId;

  // Auto-login after registration
  const token = jwt.sign(
    { sub: userId, role: "citizen_user", username, name, email, district_id, state_id },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  res.status(201).json({
    token,
    user: {
      id: userId,
      username,
      role: "citizen_user",
      email,
      name,
      district: district_id ?? null,
      state: state_id ?? null
    }
  });
});

authRouter.get("/me", authRequired, async (req, res) => {
  res.json({ user: req.user });
});