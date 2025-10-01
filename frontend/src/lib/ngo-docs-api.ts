const API_BASE = import.meta.env.VITE_API_BASE_URL;

async function rawFetch(path: string, options: any = {}): Promise<Response> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = options.headers || {};
  if (options.token) headers["Authorization"] = `Bearer ${options.token}`;
  return fetch(url, { method: options.method || "GET", headers, body: options.body });
}

export const NGOClaimsDocsApi = {
  upload: async (token: string, claimId: number, file: File, doc_type: string, title?: string) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("doc_type", doc_type);
    if (title) fd.append("title", title);
    const res = await rawFetch(`/api/ngo/claims/${claimId}/documents`, { token, method: "POST", body: fd, headers: {} });
    if (!res.ok) throw new Error(`Upload failed ${res.status}`);
    return res.json();
  },
  list: async (token: string, claimId: number) => {
    const res = await rawFetch(`/api/ngo/claims/${claimId}/documents`, { token });
    if (!res.ok) throw new Error(`List failed ${res.status}`);
    return res.json();
  },
  remove: async (token: string, claimId: number, docId: number) => {
    const res = await rawFetch(`/api/ngo/claims/${claimId}/documents/${docId}`, { token, method: "DELETE" });
    if (!res.ok) throw new Error(`Delete failed ${res.status}`);
    return res.json();
  },
  previewBlob: async (token: string, docId: number) => {
    const res = await rawFetch(`/api/ngo/documents/${docId}/preview`, { token });
    if (!res.ok) throw new Error(`Preview failed ${res.status}`);
    return res.blob();
  }
};