import { Router } from "express";
import { authRequired, requireClaimEditor } from "../middleware/auth";

// NOTE: Replace placeholders with your actual claims persistence later
export const claimsRouter = Router();

// All authenticated can list/read
claimsRouter.use(authRequired);

claimsRouter.get("/", async (_req, res) => {
  // TODO: fetch claims list from DB or tiles/GeoJSON service
  res.json([]);
});

claimsRouter.get("/:id", async (req, res) => {
  // TODO: fetch specific claim
  res.json({ id: req.params.id, details: "Not implemented yet" });
});

// Citizen/NGO could submit new claim requests (optional; keep for future)
claimsRouter.post("/", async (_req, res) => {
//TODO: accept geometry + attributes as a new claim request
  res.status(201).json({ success: true, id: "CLAIM-PLACEHOLDER" });
});

// ONLY FDA (forest_revenue_officer) or admin can modify existing geometry
claimsRouter.put("/:id/geometry", requireClaimEditor, async (req, res) => {
  // TODO: update geometry for claim (req.body.geometry)
  res.json({ success: true, id: req.params.id });
});