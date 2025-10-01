import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthStore } from "@/store/authStore";
import { NGOClaimsApi } from "@/lib/api";
import { NGOClaimsDocsApi } from "@/lib/ngo-docs-api";
import { Eye, Trash2, ArrowLeft } from "lucide-react";

const DOC_TYPES = [
  { key: "id_proof", label: "ID Proof" },
  { key: "tribal_certificate", label: "Tribal Certificate" },
  { key: "residence_proof", label: "Residence Proof" },
  { key: "gram_sabha_resolution", label: "Gram Sabha Resolution" },
  { key: "survey_docs", label: "Survey Documents" },
  { key: "map_scan", label: "Map Scan" },
  { key: "other", label: "Other" }
] as const;

export default function ClaimDetailPreview() {
  const { id: idParam } = useParams();
  const id = useMemo(() => Number(idParam), [idParam]);
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const [claim, setClaim] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const [docType, setDocType] = useState<string>("id_proof");
  const [files, setFiles] = useState<FileList | null>(null);

  async function load() {
    if (!token || !id) return;
    setLoading(true);
    setError("");
    try {
      const data = await NGOClaimsApi.get(token, id);
      setClaim(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load claim");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [token, id]);

  async function upload() {
    if (!token || !id || !files || !docType) return;
    for (const f of Array.from(files)) {
      await NGOClaimsDocsApi.upload(token, id, f, docType, f.name);
    }
    setFiles(null);
    await load();
  }
  async function preview(docId: number, filename?: string) {
    if (!token) return;
    const blob = await NGOClaimsDocsApi.previewBlob(token, docId);
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (win) win.document.title = filename || "document";
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
  async function removeDoc(docId: number) {
    if (!token || !id) return;
    if (!confirm("Remove this document?")) return;
    await NGOClaimsDocsApi.remove(token, id, docId);
    await load();
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-2xl font-bold">Claim {claim?.claim_identifier || `#${id}`}</h1>
        </div>
        <div className="flex gap-2">
          {claim?.status && <Badge variant="secondary">{claim.status}</Badge>}
          {claim?.geometry_status && <Badge variant="outline">{claim.geometry_status}</Badge>}
        </div>
      </div>

      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && claim && (
        <>
          <Card>
            <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3 text-sm">
              <div><span className="font-medium">Type:</span> {claim.type}</div>
              <div><span className="font-medium">Source:</span> {claim.source}</div>
              <div><span className="font-medium">Applicant Category:</span> {claim.applicant_category || "-"}</div>
              <div><span className="font-medium">Residence since:</span> {claim.residence_since_year || "-"}</div>
              <div className="md:col-span-2"><span className="font-medium">Legacy Ref:</span> {claim.legacy_ref || "-"}</div>
              <div><span className="font-medium">Claimed Area (ha):</span> {claim.claimed_area_ha ?? "-"}</div>
              <div className="md:col-span-3"><span className="font-medium">Location:</span> {claim.village || "-"}, {claim.gram_panchayat || "-"}, {claim.block || "-"} | State #{claim.state_id || "-"} Dist #{claim.district_id || "-"}</div>
              <div className="md:col-span-3"><span className="font-medium">Lat/Lon:</span> {claim.location_lat ?? "-"}, {claim.location_lon ?? "-"}</div>
              <div className="md:col-span-3"><span className="font-medium">Khata/Khasra:</span> {claim.khata_no || "-"} / {claim.khasra_no || "-"}</div>
              <div className="md:col-span-3"><span className="font-medium">Ownership Check:</span> {claim.ownership_check_status || "-"} — {claim.ownership_check_notes || ""}</div>
              <div className="md:col-span-3"><span className="font-medium">Notes:</span> {claim.notes || "-"}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Parties (Claimants)</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {claim.parties?.length ? claim.parties.map((p: any, i: number) => (
                <div key={i} className="grid gap-2 md:grid-cols-6 text-sm border rounded p-2">
                  <div className="md:col-span-2"><span className="font-medium">Name:</span> {p.name}</div>
                  <div><span className="font-medium">Gender:</span> {p.gender || "-"}</div>
                  <div><span className="font-medium">Tribe:</span> {p.tribe || "-"}</div>
                  <div><span className="font-medium">ID:</span> {p.id_type || "-"} {p.id_number || ""}</div>
                  <div><span className="font-medium">Relation:</span> {p.relation || "-"}</div>
                  <div><span className="font-medium">Age:</span> {p.age ?? "-"}</div>
                </div>
              )) : <div className="text-sm text-muted-foreground">No parties added.</div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Evidence Documents</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div>
                  <Label>Document Type</Label>
                  <Select value={docType} onValueChange={setDocType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DOC_TYPES.map((d) => (
                        <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label>File(s)</Label>
                  <Input type="file" accept=".pdf,.jpg,.jpeg,.png" multiple onChange={(e) => setFiles(e.target.files)} />
                </div>
                <div className="md:col-span-3">
                  <Button onClick={upload} disabled={!files || !files.length}>Upload</Button>
                </div>
              </div>

              {claim.documents?.length ? claim.documents.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between border rounded p-2 text-sm">
                  <div className="flex-1">
                    <div className="font-medium">{d.title || d.filename}</div>
                    <div className="text-muted-foreground">{d.doc_type} • {d.mime} • {(d.size_bytes/1024).toFixed(1)} KB • {new Date(d.created_at).toLocaleString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => preview(d.id, d.title)}><Eye className="h-4 w-4 mr-1" /> Preview</Button>
                    <Button variant="destructive" size="sm" onClick={() => removeDoc(d.id)}><Trash2 className="h-4 w-4 mr-1" /> Remove</Button>
                  </div>
                </div>
              )) : <div className="text-sm text-muted-foreground">No documents uploaded.</div>}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}