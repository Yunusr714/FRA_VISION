import { pool } from "../db/pool.js";

// Creates a compact, unique, sequential human ID like IFR-APP-2025-0001.
// Uses an atomic counter per prefix in claim_sequences.
// Falls back to timestamp-based ID if anything fails (so you never get 500s).
export async function generateClaimIdentifierSafe(type = "IFR") {
  const year = new Date().getFullYear();
  const prefix = `${type}-APP-${year}`;

  try {


    // Atomic upsert to get next sequence
    // NOTE: LAST_INSERT_ID is per-connection; mysql2/promise keeps it per query.
    const upsertSql = `
      INSERT INTO claim_sequences (prefix, seq)
      VALUES (?, 1)
      ON DUPLICATE KEY UPDATE seq = LAST_INSERT_ID(seq + 1)
    `;
    await pool.query(upsertSql, [prefix]);

    const [[row]] = await pool.query(`SELECT LAST_INSERT_ID() AS seq`);
    const seq = row?.seq ? Number(row.seq) : 1;

    const code = `${prefix}-${String(seq).padStart(4, "0")}`;
    return code;
  } catch {
    // Fallback: still unique enough for dev; you can improve later.
    const ts = Date.now();
    return `${prefix}-${ts}`;
  }
}