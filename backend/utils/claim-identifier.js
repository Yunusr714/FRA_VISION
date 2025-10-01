// Returns the base ID: TYPE-APP-YYYYMMDD (no DB needed)
export async function generateClaimIdentifierSafe(type = "IFR") {
  const t = String(type || "IFR").toUpperCase();
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const datePart = `${yyyy}${mm}${dd}`;
  return `${t}-APP-${datePart}`;
}