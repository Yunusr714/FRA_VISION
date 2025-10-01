const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const AtlasApi = {
  getClaimsFC: async (token: string) => {
    const res = await fetch(`${API_BASE}/api/atlas/claims`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Atlas feed failed ${res.status}`);
    return res.json(); // GeoJSON FeatureCollection
  }
};