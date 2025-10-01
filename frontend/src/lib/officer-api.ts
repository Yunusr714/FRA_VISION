const API_BASE = import.meta.env.VITE_API_BASE_URL;

async function api(path: string, opts: any = {}) {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = opts.headers || {};
  if (!headers["Content-Type"]) headers["Content-Type"] = "application/json";
  if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;
  const res = await fetch(url, { method: opts.method || "POST", headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
  if (!res.ok) {
    let detail = "";
    try { detail = await res.text(); } catch {}
    throw new Error(`API ${res.status} ${res.statusText}${detail ? `: ${detail}` : ""}`);
  }
  try { return await res.json(); } catch { return undefined; }
}

export const OfficerApi = {
  setStatus: (token: string, claimId: number, status: "draft"|"submitted"|"under_verification"|"approved"|"rejected", note?: string) =>
    api(`/api/officer/claims/${claimId}/status`, { token, body: { status, note } }),
  requestDocs: (token: string, claimId: number, note?: string) =>
    api(`/api/officer/claims/${claimId}/request-docs`, { token, body: { note } }),
  assignSurvey: (token: string, claimId: number, note?: string) =>
    api(`/api/officer/claims/${claimId}/assign-survey`, { token, body: { note } })
};