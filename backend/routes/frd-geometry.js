import { Router } from "express";
import { pool } from "../db/pool.js";
import { authRequired, requireRoles } from "../middleware/auth.js";

export const frdGeometryRouter = Router();

frdGeometryRouter.use(
  authRequired,
  requireRoles("forest_revenue_officer", "mota_admin")
);

async function getClaim(id) {
  const [[row]] = await pool.query(`SELECT * FROM claims WHERE id = ?`, [id]);
  return row || null;
}

function isPolygonish(g) {
  return (
    g &&
    typeof g === "object" &&
    (g.type === "Polygon" || g.type === "MultiPolygon") &&
    Array.isArray(g.coordinates)
  );
}

frdGeometryRouter.put("/claims/:id/geometry", async (req, res) => {
  const id = Number(req.params.id);
  const { geometry, note, submit, verify } = req.body || {};

  if (!isPolygonish(geometry)) {
    return res
      .status(400)
      .json({ error: "Valid GeoJSON Polygon/MultiPolygon is required" });
  }

  const claim = await getClaim(id);
  if (!claim) {
    return res.status(404).json({ error: "Claim not found" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let geometry_status = "draft";
    let geomVerifiedBy = null;
    let verifiedAt = null;

    if (verify) {
      geometry_status = "verified";
      geomVerifiedBy = req.user.id;
      verifiedAt = new Date();
    } else if (submit) {
      geometry_status = "submitted_for_review";
    }

    await conn.query(
      `
      UPDATE claims
      SET geometry = ?, geometry_status = ?, geometry_source = 'frd_survey',
          geometry_by_user_id = ?, geometry_verified_by = ?, geometry_verified_at = ?,
          updated_at = NOW()
      WHERE id = ?
      `,
      [
        JSON.stringify(geometry),
        geometry_status,
        req.user.id,
        geomVerifiedBy,
        verifiedAt,
        id,
      ]
    );

    await conn.query(
      `INSERT INTO claim_status_history (claim_id, status, note, actor_user_id) VALUES (?, ?, ?, ?)`,
      [
        id,
        verify
          ? "geometry_verified"
          : submit
          ? "geometry_submitted_for_review"
          : "geometry_drafted",
        note ||
          (verify
            ? "Geometry verified by FRD"
            : submit
            ? "Geometry submitted for review"
            : "Geometry updated (draft)"),
        req.user.id,
      ]
    );

    await conn.commit();
    res.json({ success: true, geometry_status });
  } catch (e) {
    console.error("Geometry update error:", e);
    await conn.rollback();
    res.status(500).json({ error: "Failed to update geometry" });
  } finally {
    conn.release();
  }
});
