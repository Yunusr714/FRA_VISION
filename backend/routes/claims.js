import { Router } from "express";
import { pool } from "../db/pool.js";
import { authRequired, requireRoles } from "../middleware/auth.js";

// Visible to NGO, FRD, District Officer, Admin (NOT citizen)
export const claimsRouter = Router();

claimsRouter.use(
  authRequired,
  requireRoles("ngo_user", "forest_revenue_officer", "district_officer", "mota_admin","pda_planner")
);

// List claims
claimsRouter.get("/", async (req, res) => {
  try {
    const u = req.user;
    const { status, q, page = "1", limit = "20" } = req.query;

    const p = Math.max(1, parseInt(String(page), 10));
    const l = Math.min(100, Math.max(1, parseInt(String(limit), 10)));
    const off = (p - 1) * l;

    const where = [];
    const params = [];

    switch (u.role_code) {
      case "ngo_user":
        where.push("c.created_by_user_id = ?");
        params.push(u.id);
        break;
      case "district_officer":
        // Optionally scope by district_id if present on user
        // where.push("c.district_id = ?");
        // params.push(u.district_id);
        break;
      case "forest_revenue_officer":
      case "mota_admin":
      default:
        break;
    }

    if (status) {
      const st = String(status).replace("-", "_");
      where.push("c.status = ?");
      params.push(st);
    }

    if (q) {
      const like = `%${q}%`;
      where.push(
        "(c.claim_identifier LIKE ? OR c.village LIKE ? OR c.gram_panchayat LIKE ? OR c.block LIKE ?)"
      );
      params.push(like, like, like, like);
    }

    const [rows] = await pool.query(
      `
      SELECT
        c.id,
        c.claim_identifier,
        c.type,
        c.source,
        c.village,
        c.gram_panchayat,
        c.block,
        c.claimed_area_ha,
        c.status,
        c.geometry_status,
        c.created_at,
        c.updated_at
      FROM claims c
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY c.updated_at DESC
      LIMIT ? OFFSET ?
      `,
      [...params, l, off]
    );

    res.json(rows);
  } catch (err) {
    console.error("Error fetching claims:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get one claim with parties, documents, history
claimsRouter.get("/:id", async (req, res) => {
  try {
    const u = req.user;
    const id = Number(req.params.id);

    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const [[claim]] = await pool.query(
      `SELECT * FROM claims WHERE id = ?`,
      [id]
    );

    if (!claim) {
      return res.status(404).json({ error: "Claim not found" });
    }

    // Access control
    if (u.role_code === "ngo_user" && claim.created_by_user_id !== u.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    // Optionally enforce district scope for district_officer here

    // Load parties
    const [parties] = await pool.query(
      `SELECT id, claim_id, name, gender, tribe, id_type, id_number, relation, age, created_at
       FROM claim_parties
       WHERE claim_id = ?
       ORDER BY id ASC`,
      [id]
    );

    // Load documents (metadata only)
    const [documents] = await pool.query(
      `SELECT id, claim_id, title, filename, mime, size_bytes, doc_type, created_at
       FROM claim_documents
       WHERE claim_id = ?
       ORDER BY created_at ASC`,
      [id]
    );

    // History with actor name (if users table has 'name')
    const [history] = await pool.query(
      `SELECT h.status, h.note, h.created_at, u.name AS actor
       FROM claim_status_history h
       LEFT JOIN users u ON u.id = h.actor_user_id
       WHERE h.claim_id = ?
       ORDER BY h.created_at ASC`,
      [id]
    );

    const out = {
      ...claim,
      parties,
      documents,
      history,
    };

    res.json(out);
  } catch (err) {
    console.error("Error fetching claim:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
