import jwt from "jsonwebtoken";
import { config } from "../config/env.js";

export function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing Authorization header" });
  try {
    const payload = jwt.verify(token, config.jwt.secret);
    req.user = {
      id: payload.sub,
      username: payload.username,
      role_code: payload.role,
      name: payload.name,
      email: payload.email,
      district_id: payload.district_id ?? null,
      state_id: payload.state_id ?? null
    };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (!roles.includes(req.user.role_code)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    next();
  };
}

// FDA = forest_revenue_officer; allow admin override
export const requireClaimEditor = requireRoles("forest_revenue_officer", "mota_admin");