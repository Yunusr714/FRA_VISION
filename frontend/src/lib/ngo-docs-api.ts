const API_BASE = import.meta.env.VITE_API_BASE_URL;

async function apiFetch<T>(path: string, options: any = {}): Promise<T> {
  if (!API_BASE) throw new Error("API base URL not configured (VITE_API_BASE_URL)");
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = options.headers || {};
  if (options.token) headers["Authorization"] = `Bearer ${options.token}`;
  const res = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body
  });
  if (!res.ok) {
    let detail = "";
    try { detail = await res.text(); } catch {}
    throw new Error(`API ${res.status} ${res.statusText}${detail ? `: ${detail}` : ""}`);
  }
  try { return await res.json(); } catch { return undefined as unknown as T; }
}

export const NGOClaimsDocsApi = {
  upload: (token: string, claimId: number, file: File, doc_type: string, title?: string) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("doc_type", doc_type);
    if (title) fd.append("title", title);
    return apiFetch<{ id: number }>(`/api/ngo/claims/${claimId}/documents`, {
      token, method: "POST", body: fd, headers: {}
    });
  },
  list: (token: string, claimId: number) =>
    apiFetch<any[]>(`/api/ngo/claims/${claimId}/documents`, { token }),
  remove: (token: string, claimId: number, docId: number) =>
    apiFetch(`/api/ngo/claims/${claimId}/documents/${docId}`, { token, method: "DELETE" })
};