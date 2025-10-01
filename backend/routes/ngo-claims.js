import { Router } from "express";
import { pool } from "../db/pool.js";
import { authRequired, requireRoles } from "../middleware/auth.js";
import { generateClaimIdentifierSafe } from "../utils/claim-identifier.js";

export const ngoClaimsRouter = Router();

// All NGO claim routes require NGO or MOTA admin
ngoClaimsRouter.use(authRequired, requireRoles("ngo_user", "mota_admin","fro"));

// Helpers
function canAccess(user, row) {
  if (!row) return false;
  if (user.role_code === "mota_admin"|| "forest_revenue_officer") return true;
  return row.created_by_user_id === user.id && user.role_code === "ngo_user";
}

function parseMaybeJSON(v, fallback = null) {
  if (v == null) return fallback;
  if (typeof v === "object" && !Buffer.isBuffer(v)) return v; // already parsed
  try {
    if (Buffer.isBuffer(v)) return JSON.parse(v.toString("utf8"));
    if (typeof v === "string") return JSON.parse(v);
  } catch {
    // ignore
  }
  return fallback;
}

// Create a claim
// Body: JSON matching your New Claim payload (no geometry here; FRD owns that)
// Create a claim
ngoClaimsRouter.post("/claims", async (req, res) => {
  const u = req.user;
  const b = req.body || {};

  if (!b.type || !["IFR", "CR", "CFR", "Others"].includes(b.type)) {
    return res.status(400).json({ error: "Invalid claim type" });
  }
  if (!b.village) return res.status(400).json({ error: "village is required" });

  // Auto-generate claim_identifier if not provided
  const claimIdentifier =  await generateClaimIdentifierSafe(b.type || "IFR");

  const sql = `
    INSERT INTO claims (
      claim_identifier, type, source, applicant_category, residence_since_year,
      organization_id, created_by_user_id, claimant_user_id,
      state_id, district_id, block, gram_panchayat, village,
      khata_no, khasra_no,
      location_lat, location_lon, location_accuracy_m, location_source, location_captured_by_user_id, location_captured_at,
      claimed_area_ha, legacy_ref, ownership_check_status, ownership_check_notes,
      evidence_flags, notes, status
    ) VALUES (?,?,?,?,?,
      ?,?,?, ?,?,?,?,? , ?,? , ?,?,?,?, ?, NOW(),
      ?, ?, ?, ?, ?, ?, 'submitted'
    )`;
  const params = [
    claimIdentifier,
    b.type,
    b.source || "fresh_application",
    b.applicant_category || null,
    b.residence_since_year || null,

    u.role_code === "mota_admin" ? null : (u.organization_id || null),
    u.id,
    b.claimant_user_id || null,

    b.state_id || null,
    b.district_id || null,
    b.block || null,
    b.gram_panchayat || null,
    b.village,

    b.khata_no || null,
    b.khasra_no || null,

    b.location_lat ?? null,
    b.location_lon ?? null,
    b.location_accuracy_m ?? null,
    b.location_source || null,
    u.id,

    b.claimed_area_ha ?? null,
    b.legacy_ref || null,
    b.ownership_check_status || "unknown",
    b.ownership_check_notes || null,

    b.evidence_flags ? JSON.stringify(b.evidence_flags) : JSON.stringify({}),
    b.notes || null
  ];

  const [result] = await pool.query(sql, params);
  const claimId = result.insertId;

  if (Array.isArray(b.parties) && b.parties.length) {
    const values = b.parties
      .filter((p) => p && p.name && String(p.name).trim())
      .map((p) => [
        claimId,
        p.name,
        p.gender || null,
        p.tribe || null,
        p.id_type || null,
        p.id_number || null,
        p.relation || null,
        p.age ?? null
      ]);
    if (values.length) {
      await pool.query(
        `INSERT INTO claim_parties (claim_id, name, gender, tribe, id_type, id_number, relation, age) VALUES ?`,
        [values]
      );
    }
  }

  await pool.query(
    `INSERT INTO claim_status_history (claim_id, status, note, actor_user_id)
     VALUES (?, 'submitted', 'Created by NGO', ?)`,
    [claimId, u.id]
  );

  res.status(201).json({ id: claimId, claim_identifier: claimIdentifier });
});
// List my claims
ngoClaimsRouter.get("/claims", async (req, res) => {
  const u = req.user;
  const { status, q, page = "1", limit = "20" } = req.query;
  const p = Math.max(1, parseInt(page));
  const l = Math.min(100, Math.max(1, parseInt(limit)));
  const off = (p - 1) * l;

  const where = [];
  const params = [];

  if (u.role_code === "ngo_user") {
    where.push("c.created_by_user_id = ?");
    params.push(u.id);
  }
  if (status) {
    where.push("c.status = ?");
    params.push(String(status));
  }
  if (q) {
    where.push("(c.claim_identifier LIKE ? OR c.village LIKE ? OR c.legacy_ref LIKE ?)");
    const like = `%${q}%`;
    params.push(like, like, like);
  }

  const sql = `
    SELECT c.id, c.claim_identifier, c.type, c.source, c.village, c.block, c.gram_panchayat,
           c.claimed_area_ha, c.status, c.created_at, c.updated_at
    FROM claims c
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY c.updated_at DESC
    LIMIT ? OFFSET ?`;
  const [rows] = await pool.query(sql, [...params, l, off]);
  res.json(rows);
});

// Claim detail
ngoClaimsRouter.get("/claims/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [cr] = await pool.query(`SELECT * FROM claims WHERE id = ?`, [id]);
  const claim = cr[0];
  if (!claim) return res.status(404).json({ error: "Not found" });
  // if (!canAccess(req.user, claim)) return res.status(403).json({ error: "Forbidden" });

  const evidence_flags = parseMaybeJSON(claim.evidence_flags, {}) || {};
  const geometry = parseMaybeJSON(claim.geometry, null);

  const [parties] = await pool.query(`SELECT * FROM claim_parties WHERE claim_id = ? ORDER BY id ASC`, [id]);
  const [docs] = await pool.query(
    `SELECT id, doc_type, title, filename, mime, size_bytes, created_at
     FROM claim_documents WHERE claim_id = ? ORDER BY created_at DESC`,
    [id]
  );
  const [hist] = await pool.query(
    `SELECT h.*, u.username AS actor
     FROM claim_status_history h
     LEFT JOIN users u ON u.id = h.actor_user_id
     WHERE h.claim_id = ? ORDER BY h.created_at ASC`,
    [id]
  );

  res.json({
    ...claim,
    evidence_flags,
    geometry,
    parties,
    documents: docs,
    history: hist
  });
});

// Update claim metadata
ngoClaimsRouter.put("/claims/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [cr] = await pool.query(`SELECT * FROM claims WHERE id = ?`, [id]);
  const claim = cr[0];
  if (!claim) return res.status(404).json({ error: "Not found" });
  if (!canAccess(req.user, claim)) return res.status(403).json({ error: "Forbidden" });

  const b = req.body || {};
  const fields = [];
  const params = [];
  const set = (col, v, tx = (x) => x) => {
    if (v !== undefined) {
      fields.push(`${col} = ?`);
      params.push(tx(v));
    }
  };

  set("claim_identifier", b.claim_identifier || null);
  set("type", b.type);
  set("source", b.source);
  set("applicant_category", b.applicant_category || null);
  set("residence_since_year", b.residence_since_year ?? null);

  set("state_id", b.state_id ?? null);
  set("district_id", b.district_id ?? null);
  set("block", b.block ?? null);
  set("gram_panchayat", b.gram_panchayat ?? null);
  set("village", b.village);

  set("khata_no", b.khata_no ?? null);
  set("khasra_no", b.khasra_no ?? null);

  set("location_lat", b.location_lat ?? null);
  set("location_lon", b.location_lon ?? null);
  set("location_accuracy_m", b.location_accuracy_m ?? null);
  set("location_source", b.location_source ?? null);

  set("claimed_area_ha", b.claimed_area_ha ?? null);
  set("legacy_ref", b.legacy_ref ?? null);
  set("ownership_check_status", b.ownership_check_status ?? null);
  set("ownership_check_notes", b.ownership_check_notes ?? null);
  set("evidence_flags", b.evidence_flags, (v) => (v ? JSON.stringify(v) : JSON.stringify({})));
  set("notes", b.notes ?? null);

  if (fields.length) {
    await pool.query(`UPDATE claims SET ${fields.join(", ")}, updated_at = NOW() WHERE id = ?`, [...params, id]);
  }
  res.json({ success: true });
});

// Replace all parties
ngoClaimsRouter.post("/claims/:id/parties", async (req, res) => {
  const id = parseInt(req.params.id);
  const [cr] = await pool.query(`SELECT * FROM claims WHERE id = ?`, [id]);
  const claim = cr[0];
  if (!claim) return res.status(404).json({ error: "Not found" });
  if (!canAccess(req.user, claim)) return res.status(403).json({ error: "Forbidden" });

  const arr = Array.isArray(req.body) ? req.body : [];
  await pool.query(`DELETE FROM claim_parties WHERE claim_id = ?`, [id]);
  if (arr.length) {
    const values = arr
      .filter((p) => p && p.name && String(p.name).trim())
      .map((p) => [id, p.name, p.gender || null, p.tribe || null, p.id_type || null, p.id_number || null, p.relation || null, p.age ?? null]);
    if (values.length) {
      await pool.query(
        `INSERT INTO claim_parties (claim_id, name, gender, tribe, id_type, id_number, relation, age) VALUES ?`,
        [values]
      );
    }
  }
  res.json({ success: true });
});