import { Router } from "express";
import { authRequired, requireClaimEditor } from "../middleware/auth.js";

export const claimsRouter = Router();

claimsRouter.use(authRequired);

claimsRouter.get("/", async (_req, res) => {
  res.json([]);
});

claimsRouter.get("/:id", async (req, res) => {
  res.json({ id: req.params.id, details: "Not implemented yet" });
});

claimsRouter.post("/", async (_req, res) => {
  res.status(201).json({ success: true, id: "CLAIM-PLACEHOLDER" });
});

claimsRouter.put("/:id/geometry", requireClaimEditor, async (req, res) => {
  res.json({ success: true, id: req.params.id });
});