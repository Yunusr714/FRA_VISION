const API_BASE: string | undefined = (import.meta as any).env?.VITE_API_BASE_URL;

export type ApiOptions = { method?: string; body?: any; token?: string | null; headers?: Record<string,string>; };

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  if (!API_BASE) throw new Error("API base URL not configured (VITE_API_BASE_URL)");
  const url = `${API_BASE}${path}`;
  const headers: Record<string,string> = { ...(options.headers || {}) };
  if (!headers["Content-Type"] && !(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
  if (options.token) headers["Authorization"] = `Bearer ${options.token}`;
  const res = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body
      ? options.body instanceof FormData
        ? options.body
        : JSON.stringify(options.body)
      : undefined
  });
  if (!res.ok) { let detail=""; try { detail = await res.text(); } catch {} throw new Error(`API ${res.status} ${res.statusText}${detail ? `: ${detail}` : ""}`); }
  try { return await res.json(); } catch { return undefined as unknown as T; }
}

export const NGOClaimsApi = {
  list: (token: string, params?: { status?: string; q?: string; page?: number; limit?: number }) => {
    const sp = new URLSearchParams();
    if (params?.status) sp.set("status", params.status);
    if (params?.q) sp.set("q", params.q);
    if (params?.page) sp.set("page", String(params.page));
    if (params?.limit) sp.set("limit", String(params.limit));
    const qs = sp.toString() ? `?${sp.toString()}` : "";
    return apiFetch<any[]>(`/api/ngo/claims${qs}`, { token });
  },
  get: (token: string, id: number) => apiFetch<any>(`/api/ngo/claims/${id}`, { token }),
  create: (token: string, body: any) => apiFetch<{ id: number; claim_identifier: string }>(`/api/ngo/claims`, { token, method: "POST", body }),
  update: (token: string, id: number, body: any) => apiFetch(`/api/ngo/claims/${id}`, { token, method: "PUT", body }),
  replaceParties: (token: string, id: number, parties: any[]) => apiFetch(`/api/ngo/claims/${id}/parties`, { token, method: "POST", body: parties })
};

export const NGOScanApi = {
  uploadScan: (token: string, file: File, fields?: { claim_id?: number; doc_type?: string }) => {
    const fd = new FormData();
    fd.append("scan", file);
    if (fields?.claim_id) fd.append("claim_id", String(fields.claim_id));
    if (fields?.doc_type) fd.append("doc_type", fields.doc_type);
    return apiFetch<{ doc_id: number; filename: string; mime: string; size: number }>(`/api/ngo/scan/upload`, {
      token, method: "POST", body: fd, headers: {}
    });
  },
  startExtraction: (token: string, doc_id: number, claim_id?: number) =>
    apiFetch<{ job_id: number; status: string }>(`/api/ngo/extract/start`, { token, method: "POST", body: { doc_id, claim_id } }),
  jobStatus: (token: string, job_id: number) =>
    apiFetch<any>(`/api/ngo/extract/${job_id}`, { token }),
  completeJob: (token: string, job_id: number, payload: { extracted_json: any; confidence?: any; error_text?: string }) =>
    apiFetch(`/api/ngo/extract/${job_id}/complete`, { token, method: "POST", body: payload }),
  ingestExtracted: (token: string, claim_id: number, job_id: number) =>
    apiFetch(`/api/ngo/claims/${claim_id}/ingest-extracted`, { token, method: "POST", body: { job_id } }),
  notarize: (token: string, doc_id: number, data: { network: string; tx_id: string }) =>
    apiFetch(`/api/ngo/docs/${doc_id}/notarize`, { token, method: "POST", body: data })
};


export const AuthApi = {
  login: (username: string, password: string) =>
    apiFetch<{ token: string; user: any }>(`/api/auth/login`, {
      method: "POST",
      body: { username, password }
    }),
  me: (token: string) => apiFetch<any>(`/api/auth/me`, { token }),
  registerCitizen: (payload: {
    username: string;
    password: string;
    name: string;
    email: string;
    phone: string;
    state_id?: number | null;
    district_id?: number | null;
  }) =>
    apiFetch<{ token: string; user: any }>(`/api/auth/register/citizen`, {
      method: "POST",
      body: payload
    })
};

export const UsersApi = {
  list: (token: string) => apiFetch<any[]>(`/api/users`, { token }),
  create: (token: string, body: any) =>
    apiFetch(`/api/users`, { token, method: "POST", body }),
  setStatus: (token: string, id: number, status: "active" | "inactive") =>
    apiFetch(`/api/users/${id}/status`, { token, method: "PATCH", body: { status } })
};

export const ClaimsApi = {
  list: (token?: string | null) =>
    apiFetch<any[]>(`/api/claims`, { token: token || undefined }),
  detail: (id: string, token?: string | null) =>
    apiFetch<any>(`/api/claims/${id}`, { token: token || undefined }),
  updateGeometry: (id: string, geometry: any, token: string) =>
    apiFetch(`/api/claims/${id}/geometry`, {
      token,
      method: "PUT",
      body: { geometry }
    })
};
export const GeoApi = {
  states: () => apiFetch<any[]>(`/api/auth/geo/states`),
  districts: (state_id?: number) =>
    apiFetch<any[]>(`/api/auth/geo/districts${state_id ? `?state_id=${state_id}` : ''}`),
};
