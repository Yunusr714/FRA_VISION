const API_BASE = import.meta.env.VITE_API_BASE_URL;

async function api(path: string, opts: any = {}) {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = opts.headers || {};
  if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;
  const res = await fetch(url, { method: opts.method || "GET", headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
  if (!res.ok) {
    let detail = "";
    try { detail = await res.text(); } catch {}
    throw new Error(`API ${res.status} ${res.statusText}${detail ? `: ${detail}` : ""}`);
  }
  try { return await res.json(); } catch { return undefined; }
}

export const NGOClaimPartiesApi = {
  list: (token: string, claimId: number) => api(`/api/ngo/claims/${claimId}/parties`, { token }),
  add: (token: string, claimId: number, party: any) =>
    api(`/api/ngo/claims/${claimId}/parties/add`, { token, method: "POST", body: party }),
  update: (token: string, claimId: number, partyId: number, party: any) =>
    api(`/api/ngo/claims/${claimId}/parties/${partyId}`, { token, method: "PUT", body: party }),
  remove: (token: string, claimId: number, partyId: number) =>
    api(`/api/ngo/claims/${claimId}/parties/${partyId}`, { token, method: "DELETE" })
};