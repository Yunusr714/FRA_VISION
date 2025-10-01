import { Router } from "express";
import { pool } from "../db/pool.js";
import { authRequired, requireRoles } from "../middleware/auth.js";

export const officerClaimsRouter = Router();

// Only officers/admins can change statuses
officerClaimsRouter.use(authRequired, requireRoles("district_officer", "mota_admin", "forest_revenue_officer"));

async function getClaimOr404(id) {
  const [[row]] = await pool.query(`SELECT * FROM claims WHERE id = ?`, [id]);
  return row || null;
}

async function addHistory(claimId, status, note, userId) {
  await pool.query(
    `INSERT INTO claim_status_history (claim_id, status, note, actor_user_id) VALUES (?, ?, ?, ?)`,
    [claimId, status, note || null, userId || null]
  );
}

// POST /api/officer/claims/:id/status
// Body: { status: 'draft'|'submitted'|'under_verification'|'approved'|'rejected', note? }
officerClaimsRouter.post("/claims/:id/status", async (req, res) => {
  const id = Number(req.params.id);
  const { status, note } = req.body || {};
  const allowed = new Set(["draft", "submitted", "under_verification", "approved", "rejected","fraud"]);
  if (!allowed.has(status)) return res.status(400).json({ error: "Invalid status" });

  const claim = await getClaimOr404(id);
  if (!claim) return res.status(404).json({ error: "Claim not found" });

  await pool.query(`UPDATE claims SET status = ?, updated_at = NOW() WHERE id = ?`, [status, id]);
  await addHistory(id, status, note || `Status changed to ${status}`, req.user.id);
  res.json({ success: true, status });
});

// POST /api/officer/claims/:id/request-docs
// Body: { note: string }
officerClaimsRouter.post("/claims/:id/request-docs", async (req, res) => {
  const id = Number(req.params.id);
  const { note } = req.body || {};
  const claim = await getClaimOr404(id);
  if (!claim) return res.status(404).json({ error: "Claim not found" });

  if (claim.status !== "approved" && claim.status !== "rejected") {
    await pool.query(`UPDATE claims SET status = 'under_verification', updated_at = NOW() WHERE id = ?`, [id]);
  }
  await addHistory(id, "request_documents", note || "Requested more documents", req.user.id);
  res.json({ success: true });
});

// POST /api/officer/claims/:id/assign-survey
// Body: { note?: string }
officerClaimsRouter.post("/claims/:id/assign-survey", async (req, res) => {
  const id = Number(req.params.id);
  const { note } = req.body || {};
  const claim = await getClaimOr404(id);
  if (!claim) return res.status(404).json({ error: "Claim not found" });

  await pool.query(
    `UPDATE claims
     SET geometry_status = IF(geometry_status='not_provided','draft',geometry_status),
         updated_at = NOW()
     WHERE id = ?`,
    [id]
  );
  await addHistory(id, "assign_survey", note || "Assigned field survey", req.user.id);
  res.json({ success: true });
});