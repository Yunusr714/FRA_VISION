const API_BASE = import.meta.env.VITE_API_BASE_URL;

export type ClaimRow = {
  id: number;
  claim_identifier?: string | null;
  type?: string | null;
  source?: string | null;
  village?: string | null;
  gram_panchayat?: string | null;
  block?: string | null;
  claimed_area_ha?: number | null;
  status: string;
  geometry_status?: string | null;
  created_at?: string;
  updated_at?: string;
};

export const ClaimsApi = {
  listAll: async (token: string, params: { status?: string; q?: string; page?: number; limit?: number } = {}): Promise<ClaimRow[]> => {
    const sp = new URLSearchParams();
    if (params.status) sp.set("status", params.status);
    if (params.q) sp.set("q", params.q);
    if (params.page) sp.set("page", String(params.page));
    if (params.limit) sp.set("limit", String(params.limit));
    const res = await fetch(`${API_BASE}/api/claims${sp.toString() ? `?${sp.toString()}` : ""}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`GET /api/claims failed ${res.status}${t ? `: ${t}` : ""}`);
    }
    return res.json();
  },

  getOne: async (token: string, id: number): Promise<any> => {
    const res = await fetch(`${API_BASE}/api/claims/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`GET /api/claims/${id} failed ${res.status}${t ? `: ${t}` : ""}`);
    }
    return res.json();
  }
};