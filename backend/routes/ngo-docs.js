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

function canAccess(user, row) {
  if (!row) return false;
  if (user.role_code === "mota_admin") return true;
  return row.created_by_user_id === user.id && user.role_code === "ngo_user";
}

ngoDocsRouter.post("/claims/:id/documents", upload.single("file"), async (req, res) => {
  const claimId = Number(req.params.id);
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const { doc_type, title } = req.body || {};
  if (!doc_type) return res.status(400).json({ error: "doc_type required" });

  const [[claim]] = await pool.query(`SELECT id, created_by_user_id FROM claims WHERE id = ?`, [claimId]);
  if (!claim) return res.status(404).json({ error: "Claim not found" });
  if (!canAccess(req.user, claim)) return res.status(403).json({ error: "Forbidden" });

  const f = req.file;
  const [r] = await pool.query(
    `INSERT INTO claim_documents (claim_id, doc_type, title, filename, mime, size_bytes, uploaded_by, access_level)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'restricted')`,
    [claimId, doc_type, title || f.originalname, f.filename, f.mimetype, f.size, req.user.id]
  );
  res.status(201).json({ id: r.insertId });
});

ngoDocsRouter.get("/claims/:id/documents", async (req, res) => {
  const claimId = Number(req.params.id);
  const [rows] = await pool.query(
    `SELECT id, doc_type, title, filename, mime, size_bytes, created_at
     FROM claim_documents WHERE claim_id = ? ORDER BY created_at DESC`,
    [claimId]
  );
  res.json(rows);
});

ngoDocsRouter.get("/documents/:docId/preview", async (req, res) => {
  const docId = Number(req.params.docId);
  const [[doc]] = await pool.query(
    `SELECT d.*, c.created_by_user_id
     FROM claim_documents d
     JOIN claims c ON c.id = d.claim_id
     WHERE d.id = ?`,
    [docId]
  );
  if (!doc) return res.status(404).json({ error: "Not found" });
  if (!canAccess(req.user, doc)) return res.status(403).json({ error: "Forbidden" });

  const filePath = path.join(uploadDir, doc.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File missing" });

  res.setHeader("Content-Type", doc.mime || "application/octet-stream");
  res.setHeader("Content-Disposition", `inline; filename="${doc.title || doc.filename}"`);
  fs.createReadStream(filePath).pipe(res);
});

ngoDocsRouter.delete("/claims/:id/documents/:docId", async (req, res) => {
  const claimId = Number(req.params.id);
  const docId = Number(req.params.docId);

  const [[doc]] = await pool.query(
    `SELECT d.*, c.created_by_user_id
     FROM claim_documents d
     JOIN claims c ON c.id = d.claim_id
     WHERE d.id = ? AND d.claim_id = ?`,
    [docId, claimId]
  );
  if (!doc) return res.status(404).json({ error: "Not found" });
  if (!canAccess(req.user, doc)) return res.status(403).json({ error: "Forbidden" });

  await pool.query(`DELETE FROM claim_documents WHERE id = ?`, [docId]);
  try {
    const filePath = path.join(uploadDir, doc.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {}
  res.json({ success: true });
});