import { Router } from "express";
import { pool } from "../db/pool.js";
import { authRequired, requireRoles } from "../middleware/auth.js";

export const atlasRouter = Router();

atlasRouter.use(
  authRequired,
  requireRoles(
    "ngo_user",
    "forest_revenue_officer",
    "district_officer",
    "mota_admin",
    "citizen_user"
  )
);

function rowToFeature(row) {
  const props = {
    id: row.id,
    claim_identifier: row.claim_identifier || null,
    status: row.status,
    type: row.type,
    source: row.source,
    village: row.village,
    gram_panchayat: row.gram_panchayat,
    block: row.block,
    claimed_area_ha: row.claimed_area_ha,
    schemeScore: 0,
  };

  if (row.geometry) {
    try {
      const geom =
        typeof row.geometry === "string"
          ? JSON.parse(row.geometry)
          : row.geometry;
      return { type: "Feature", geometry: geom, properties: props };
    } catch {
      // ignore, fallback to point
    }
  }

  if (row.location_lon != null && row.location_lat != null) {
    return {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [Number(row.location_lon), Number(row.location_lat)],
      },
      properties: props,
    };
  }

  return null;
}

atlasRouter.get("/claims", async (req, res) => {
  try {
    const u = req.user;
    const params = [];
    const where = [];

    if (u.role_code === "ngo_user") {
      where.push("created_by_user_id = ?");
      params.push(u.id);
    } else if (u.role_code === "citizen_user") {
      where.push("claimant_user_id = ?");
      params.push(u.id);
    }
    // TODO: add district_officer scoping by district_id if needed

    const [rows] = await pool.query(
      `
      SELECT id, claim_identifier, status, type, source, village, gram_panchayat, block,
             claimed_area_ha, location_lat, location_lon, geometry
      FROM claims
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY updated_at DESC
      LIMIT 5000
      `,
      params
    );

    const features = [];
    for (const row of rows) {
      const f = rowToFeature(row);
      if (f) features.push(f);
    }

    res.json({ type: "FeatureCollection", features });
  } catch (err) {
    console.error("Error fetching claims:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
