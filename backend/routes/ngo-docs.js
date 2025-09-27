import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { pool } from "../db/pool.js";
import { authRequired, requireRoles } from "../middleware/auth.js";

const uploadDir = path.resolve("uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const safe = file.originalname.replace(/[^\w.-]/g, "_");
    cb(null, `${ts}_${safe}`);
  }
});
const upload = multer({ storage });

export const ngoDocsRouter = Router();
ngoDocsRouter.use(authRequired, requireRoles("ngo_user", "mota_admin"));

/**
 * POST /api/ngo/claims/:id/documents
 * multipart/form-data:
 *  - file: (required) PDF/JPG/PNG
 *  - doc_type: one of id_proof, residence_proof, tribal_certificate, gram_sabha_resolution, survey_docs, other
 *  - title: optional
 */
ngoDocsRouter.post("/claims/:id/documents", upload.single("file"), async (req, res) => {
  const claimId = parseInt(req.params.id);
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const { doc_type, title } = req.body || {};
  if (!doc_type) return res.status(400).json({ error: "doc_type required" });

  // ensure claim exists and is owned by this NGO (or admin)
  const [rows] = await pool.query("SELECT id, created_by_user_id FROM claims WHERE id = ?", [claimId]);
  const claim = rows[0];
  if (!claim) return res.status(404).json({ error: "Claim not found" });
  if (req.user.role_code !== "mota_admin" && claim.created_by_user_id !== req.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const f = req.file;
  const [result] = await pool.query(
    `INSERT INTO claim_documents (claim_id, doc_type, title, filename, mime, size_bytes, uploaded_by, access_level)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'restricted')`,
    [claimId, doc_type, title || f.originalname, f.filename, f.mimetype, f.size, req.user.id]
  );
  res.status(201).json({ id: result.insertId, doc_type, title: title || f.originalname, filename: f.filename, mime: f.mimetype, size: f.size });
});

/**
 * GET /api/ngo/claims/:id/documents
 */
ngoDocsRouter.get("/claims/:id/documents", async (req, res) => {
  const claimId = parseInt(req.params.id);
  const [rows] = await pool.query(
    `SELECT id, doc_type, title, filename, mime, size_bytes, created_at FROM claim_documents WHERE claim_id = ? ORDER BY created_at DESC`,
    [claimId]
  );
  res.json(rows);
});

/**
 * DELETE /api/ngo/claims/:id/documents/:docId
 */
ngoDocsRouter.delete("/claims/:id/documents/:docId", async (req, res) => {
  const claimId = parseInt(req.params.id);
  const docId = parseInt(req.params.docId);

  const [rows] = await pool.query(
    `SELECT d.*, c.created_by_user_id FROM claim_documents d
     JOIN claims c ON c.id = d.claim_id
     WHERE d.id = ? AND d.claim_id = ?`,
    [docId, claimId]
  );
  const doc = rows[0];
  if (!doc) return res.status(404).json({ error: "Not found" });
  if (req.user.role_code !== "mota_admin" && doc.created_by_user_id !== req.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // delete file from disk (best-effort)
  try {
    const filePath = path.join(uploadDir, doc.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {}

  await pool.query("DELETE FROM claim_documents WHERE id = ?", [docId]);
  res.json({ success: true });
});