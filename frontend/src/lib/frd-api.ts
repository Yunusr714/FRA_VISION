const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const FRDApi = {
  updateGeometry: async (
    token: string,
    claimId: number,
    geometry: any,
    options?: { submit?: boolean; verify?: boolean; note?: string }
  ) => {
    const res = await fetch(`${API_BASE}/api/frd/claims/${claimId}/geometry`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ geometry, ...(options || {}) })
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`Update geometry failed ${res.status}${t ? `: ${t}` : ""}`);
    }
    return res.json();
  }
};