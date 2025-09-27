import express from "express";
import cors from "cors";
import morgan from "morgan";
import { config } from "./config/env.js";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { claimsRouter } from "./routes/claims.js";
import { ngoDocsRouter } from "./routes/ngo-docs.js";

export const app = express();

app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: "20mb" }));
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/claims", claimsRouter);
app.use("/api/ngo", ngoDocsRouter);

app.use((_req, res) => res.status(404).json({ error: "Not found" }));