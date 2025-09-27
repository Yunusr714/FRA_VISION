import express from "express";
import cors from "cors";
import morgan from "morgan";
import { config } from "./config/env";
import { authRouter } from "./routes/auth";
import { usersRouter } from "./routes/users";
import { claimsRouter } from "./routes/claims";

export const app = express();

app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/claims", claimsRouter);

// Fallback
app.use((_req, res) => res.status(404).json({ error: "Not found" }));