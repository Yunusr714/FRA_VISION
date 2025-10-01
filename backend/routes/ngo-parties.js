import { Router } from "express";
import { pool } from "../db/pool.js";
import { authRequired, requireRoles } from "../middleware/auth.js";

export const ngoPartiesRouter = Router();
ngoPartiesRouter.use(authRequired, requireRoles("ngo_user", "mota_admin"));

function canAccess(user, row) {
  if (!row) return false;
  if (user.role_code === "mota_admin") return true;
  return row.created_by_user_id === user.id && user.role_code === "ngo_user";
}

// List parties for a claim
ngoPartiesRouter.get("/claims/:id/parties", async (req, res) => {
  const claimId = Number(req.params.id);
  const [[claim]] = await pool.query(`SELECT id, created_by_user_id FROM claims WHERE id = ?`, [claimId]);
  if (!claim) return res.status(404).json({ error: "Claim not found" });
  if (!canAccess(req.user, claim)) return res.status(403).json({ error: "Forbidden" });

  const [rows] = await pool.query(`SELECT * FROM claim_parties WHERE claim_id = ? ORDER BY id ASC`, [claimId]);
  res.json(rows);
});

// Add a party
// Body: { name (required), gender?, tribe?, id_type?, id_number?, relation?, age? }
ngoPartiesRouter.post("/claims/:id/parties/add", async (req, res) => {
  const claimId = Number(req.params.id);
  const b = req.body || {};
  const [[claim]] = await pool.query(`SELECT id, created_by_user_id FROM claims WHERE id = ?`, [claimId]);
  if (!claim) return res.status(404).json({ error: "Claim not found" });
  if (!canAccess(req.user, claim)) return res.status(403).json({ error: "Forbidden" });

  if (!b.name || !String(b.name).trim()) return res.status(400).json({ error: "name is required" });
  const [r] = await pool.query(
    `INSERT INTO claim_parties (claim_id, name, gender, tribe, id_type, id_number, relation, age)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [claimId, b.name.trim(), b.gender || null, b.tribe || null, b.id_type || null, b.id_number || null, b.relation || null, b.age ?? null]
  );
  res.status(201).json({ id: r.insertId });
});

// Update a party
// Body: any subset of { name, gender, tribe, id_type, id_number, relation, age }
ngoPartiesRouter.put("/claims/:id/parties/:partyId", async (req, res) => {
  const claimId = Number(req.params.id);
  const partyId = Number(req.params.partyId);
  const [[row]] = await pool.query(
    `SELECT p.*, c.created_by_user_id FROM claim_parties p JOIN claims c ON c.id = p.claim_id WHERE p.id = ? AND p.claim_id = ?`,
    [partyId, claimId]
  );
  if (!row) return res.status(404).json({ error: "Party not found" });
  if (!canAccess(req.user, row)) return res.status(403).json({ error: "Forbidden" });

  const b = req.body || {};
  const fields = [];
  const params = [];
  const set = (col, v) => { if (v !== undefined) { fields.push(`${col} = ?`); params.push(v === "" ? null : v); } };

  set("name", b.name);
  set("gender", b.gender);
  set("tribe", b.tribe);
  set("id_type", b.id_type);
  set("id_number", b.id_number);
  set("relation", b.relation);
  set("age", b.age);

  if (!fields.length) return res.json({ success: true, message: "No changes" });
  await pool.query(`UPDATE claim_parties SET ${fields.join(", ")} WHERE id = ?`, [...params, partyId]);
  res.json({ success: true });
});

// Delete a party
ngoPartiesRouter.delete("/claims/:id/parties/:partyId", async (req, res) => {
  const claimId = Number(req.params.id);
  const partyId = Number(req.params.partyId);
  const [[row]] = await pool.query(
    `SELECT p.*, c.created_by_user_id FROM claim_parties p JOIN claims c ON c.id = p.claim_id WHERE p.id = ? AND p.claim_id = ?`,
    [partyId, claimId]
  );
  if (!row) return res.status(404).json({ error: "Party not found" });
  if (!canAccess(req.user, row)) return res.status(403).json({ error: "Forbidden" });

  await pool.query(`DELETE FROM claim_parties WHERE id = ?`, [partyId]);
  res.json({ success: true });
});