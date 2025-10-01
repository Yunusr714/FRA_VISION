import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthStore } from "@/store/authStore";
import { NGOClaimsApi } from "@/lib/api";
import { NGOClaimsDocsApi } from "@/lib/ngo-docs-api";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { useFormPersist, clearPersistedForm } from "../hooks/useFormPresist";

const EVIDENCE_TYPES = [
  { key: "id_proof", label: "ID Proof (Aadhaar/Voter ID/PAN)" },
  { key: "tribal_certificate", label: "Tribal Certificate" },
  { key: "residence_proof", label: "Residence Proof" },
  { key: "gram_sabha_resolution", label: "Gram Sabha Resolution" },
  { key: "survey_docs", label: "Survey Documents" },
  { key: "other", label: "Other Supporting Document" }
] as const;

const FORM_KEY = "fra:new-claim-ngo";

export default function NewClaimNGO() {
  const { token } = useAuthStore();
  const navigate = useNavigate();

  const [form, setForm] = useState<any>({
    type: "IFR",
    source: "legacy_digitization",
    applicant_category: "ST",
    residence_since_year: "",
    claim_identifier: "",
    state_id: "",
    district_id: "",
    block: "",
    gram_panchayat: "",
    village: "",
    khata_no: "",
    khasra_no: "",
    claimed_area_ha: "",
    legacy_ref: "",
    ownership_check_status: "unknown",
    ownership_check_notes: "",
    notes: "",
    evidence_flags: {
      id_proof: false,
      residence_proof: false,
      tribal_certificate: false,
      survey_docs: false,
      gram_sabha_resolution: false,
      map_available: false
    },
    parties: [{ name: "", gender: "", tribe: "", id_type: "", id_number: "", relation: "", age: "" }],
    location_lat: "",
    location_lon: "",
    location_accuracy_m: "",
    location_source: "ngo"
  });

  useFormPersist(FORM_KEY, form, setForm);

  const [evidenceFiles, setEvidenceFiles] = useState<Record<string, File[]>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");

  const setField = (k: string, v: any) => setForm((prev: any) => ({ ...prev, [k]: v }));
  const updateParty = (idx: number, k: string, v: any) =>
    setForm((prev: any) => {
      const arr = [...prev.parties];
      arr[idx] = { ...arr[idx], [k]: v };
      return { ...prev, parties: arr };
    });
  const addParty = () =>
    setForm((prev: any) => ({
      ...prev,
      parties: [
        ...prev.parties,
        { name: "", gender: "", tribe: "", id_type: "", id_number: "", relation: "", age: "" }
      ]
    }));
  const removeParty = (idx: number) =>
    setForm((prev: any) => ({ ...prev, parties: prev.parties.filter((_: any, i: number) => i !== idx) }));

  function onEvidenceChange(type: string, files: FileList | null) {
    if (!files) return;
    setEvidenceFiles((prev) => ({ ...prev, [type]: Array.from(files) }));
    setForm((prev: any) => ({
      ...prev,
      evidence_flags: { ...prev.evidence_flags, [type]: files.length > 0 }
    }));
  }
  function removeStaged(type: string, index: number) {
    setEvidenceFiles((prev) => {
      const arr = (prev[type] || []).slice();
      arr.splice(index, 1);
      return { ...prev, [type]: arr };
    });
  }

  async function submit() {
    if (!token) {
      setError("Not authenticated. Please log in again.");
      return;
    }
    setSaving(true);
    setError("");

    const lat = form.location_lat ? Number(form.location_lat) : null;
    const lon = form.location_lon ? Number(form.location_lon) : null;
    if ((lat !== null && (lat < -90 || lat > 90)) || (lon !== null && (lon < -180 || lon > 180))) {
      setError("Latitude/Longitude out of range");
      setSaving(false);
      return;
    }

    try {
      const payload = {
        type: form.type,
        source: form.source,
        applicant_category: form.applicant_category,
        residence_since_year: form.residence_since_year ? Number(form.residence_since_year) : undefined,
        claim_identifier: form.claim_identifier || undefined,
        state_id: form.state_id ? Number(form.state_id) : undefined,
        district_id: form.district_id ? Number(form.district_id) : undefined,
        block: form.block || undefined,
        gram_panchayat: form.gram_panchayat || undefined,
        village: form.village,
        khata_no: form.khata_no || undefined,
        khasra_no: form.khasra_no || undefined,
        claimed_area_ha: form.claimed_area_ha ? Number(form.claimed_area_ha) : undefined,
        legacy_ref: form.legacy_ref || undefined,
        ownership_check_status: form.ownership_check_status || undefined,
        ownership_check_notes: form.ownership_check_notes || undefined,
        notes: form.notes || undefined,
        evidence_flags: form.evidence_flags,
        parties: form.parties.filter((p: any) => p.name?.trim()),
        location_lat: lat ?? undefined,
        location_lon: lon ?? undefined,
        location_accuracy_m: form.location_accuracy_m ? Number(form.location_accuracy_m) : undefined,
        location_source: form.location_source || "ngo"
      };

      const res = await NGOClaimsApi.create(token, payload);
      const claimId = res.id;

      const types = Object.keys(evidenceFiles);
      for (const type of types) {
        for (const f of evidenceFiles[type]) {
          await NGOClaimsDocsApi.upload(token, claimId, f, type, f.name);
        }
      }

      clearPersistedForm(FORM_KEY);
      navigate(`/ngo/claim/${claimId}`);
    } catch (e: any) {
      setError(e?.message || "Failed to create claim");
    } finally {
      setSaving(false);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setField("location_lat", pos.coords.latitude.toFixed(6));
        setField("location_lon", pos.coords.longitude.toFixed(6));
        setField("location_accuracy_m", Math.round(pos.coords.accuracy));
        setField("location_source", "gps");
      },
      () => {}
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">New Claim (NGO)</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Basic Details</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label>Claim Type</Label>
              <Select value={form.type} onValueChange={(v) => setField("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="IFR">IFR</SelectItem>
                  <SelectItem value="CR">CR</SelectItem>
                  <SelectItem value="CFR">CFR</SelectItem>
                  <SelectItem value="Others">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Source</Label>
              <Select value={form.source} onValueChange={(v) => setField("source", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="legacy_digitization">Legacy Digitization</SelectItem>
                  <SelectItem value="fresh_application">Fresh Application</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Applicant Category</Label>
              <Select value={form.applicant_category} onValueChange={(v) => setField("applicant_category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ST">ST</SelectItem>
                  <SelectItem value="OTFD">OTFD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Residence since (Year)</Label>
              <Input type="number" value={form.residence_since_year} onChange={(e) => setField("residence_since_year", e.target.value)} placeholder="e.g., 1998" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label>State ID</Label>
              <Input type="number" value={form.state_id} onChange={(e) => setField("state_id", e.target.value)} placeholder="e.g., 1" />
            </div>
            <div>
              <Label>District ID</Label>
              <Input type="number" value={form.district_id} onChange={(e) => setField("district_id", e.target.value)} placeholder="e.g., 1" />
            </div>
            <div>
              <Label>Block</Label>
              <Input value={form.block} onChange={(e) => setField("block", e.target.value)} />
            </div>
            <div>
              <Label>Gram Panchayat</Label>
              <Input value={form.gram_panchayat} onChange={(e) => setField("gram_panchayat", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Village</Label>
              <Input value={form.village} onChange={(e) => setField("village", e.target.value)} />
            </div>
            <div>
              <Label>Khata No.</Label>
              <Input value={form.khata_no} onChange={(e) => setField("khata_no", e.target.value)} />
            </div>
            <div>
              <Label>Khasra No.</Label>
              <Input value={form.khasra_no} onChange={(e) => setField("khasra_no", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Claimed Area (ha)</Label>
              <Input type="number" step="0.01" value={form.claimed_area_ha} onChange={(e) => setField("claimed_area_ha", e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>Legacy Reference</Label>
              <Input value={form.legacy_ref} onChange={(e) => setField("legacy_ref", e.target.value)} placeholder="Register Vol-3 Page-57" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Latitude</Label>
              <Input type="number" step="0.000001" value={form.location_lat} onChange={(e) => setField("location_lat", e.target.value)} placeholder="22.004800" />
            </div>
            <div>
              <Label>Longitude</Label>
              <Input type="number" step="0.000001" value={form.location_lon} onChange={(e) => setField("location_lon", e.target.value)} placeholder="78.004500" />
            </div>
            <div className="flex items-end gap-2">
              <Button type="button" variant="outline" onClick={useMyLocation}>Use my location</Button>
              <Input type="number" placeholder="Accuracy (m)" value={form.location_accuracy_m} onChange={(e) => setField("location_accuracy_m", e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Ownership Pre-check</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Select value={form.ownership_check_status} onValueChange={(v) => setField("ownership_check_status", v)}>
                <SelectTrigger><SelectValue placeholder="unknown" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unknown">Unknown</SelectItem>
                  <SelectItem value="checked">Checked</SelectItem>
                  <SelectItem value="no_private_patta">No Private Patta</SelectItem>
                  <SelectItem value="overlap_found">Overlap Found</SelectItem>
                </SelectContent>
              </Select>
              <div className="md:col-span-2">
                <Input value={form.ownership_check_notes} onChange={(e) => setField("ownership_check_notes", e.target.value)} placeholder="RoR/Khasra verified; no private pattas overlapping; Patwari note attached." />
              </div>
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} rows={3} />
          </div>
        </CardContent>
      </Card>

      {/* Parties (Claimants) */}
      <Card>
        <CardHeader><CardTitle>Parties (Claimants)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {form.parties.map((p: any, idx: number) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end border p-3 rounded">
              <div className="md:col-span-2">
                <Label>Name</Label>
                <Input value={p.name} onChange={(e) => updateParty(idx, "name", e.target.value)} />
              </div>
              <div>
                <Label>Gender</Label>
                <Select value={p.gender} onValueChange={(v) => updateParty(idx, "gender", v)}>
                  <SelectTrigger><SelectValue placeholder="-" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tribe</Label>
                <Input value={p.tribe} onChange={(e) => updateParty(idx, "tribe", e.target.value)} />
              </div>
              <div>
                <Label>ID Type</Label>
                <Input value={p.id_type} onChange={(e) => updateParty(idx, "id_type", e.target.value)} placeholder="Aadhaar / VoterID" />
              </div>
              <div>
                <Label>ID Number</Label>
                <Input value={p.id_number} onChange={(e) => updateParty(idx, "id_number", e.target.value)} />
              </div>
              <div>
                <Label>Relation</Label>
                <Input value={p.relation} onChange={(e) => updateParty(idx, "relation", e.target.value)} placeholder="Head / Member" />
              </div>
              <div>
                <Label>Age</Label>
                <Input type="number" value={p.age} onChange={(e) => updateParty(idx, "age", e.target.value)} />
              </div>
              <div className="md:col-span-6 flex justify-end">
                <Button variant="ghost" onClick={() => removeParty(idx)} disabled={form.parties.length === 1}>
                  Remove
                </Button>
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={addParty}>Add Party</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Evidence Uploads (PDF/JPG/PNG)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {EVIDENCE_TYPES.map((t) => (
            <div key={t.key} className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div className="md:col-span-2">
                  <Label>{t.label}</Label>
                  <Input type="file" accept=".pdf,.jpg,.jpeg,.png" multiple onChange={(e) => onEvidenceChange(t.key, e.target.files)} />
                </div>
                <div className="text-xs text-muted-foreground">
                  {evidenceFiles[t.key]?.length ? `${evidenceFiles[t.key].length} file(s) selected` : "No files selected"}
                </div>
              </div>
              {evidenceFiles[t.key]?.length ? (
                <div className="grid gap-2 md:grid-cols-3">
                  {evidenceFiles[t.key].map((file, idx) => {
                    const url = URL.createObjectURL(file);
                    const isImage = /image\/(png|jpe?g|gif|webp)/i.test(file.type);
                    const isPdf = file.type === "application/pdf";
                    return (
                      <div key={idx} className="border rounded p-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="truncate mr-2" title={file.name}>{file.name}</span>
                          <Button variant="ghost" size="sm" onClick={() => removeStaged(t.key, idx)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {isImage && <img src={url} alt={file.name} className="mt-2 max-h-40 object-contain w-full" onLoad={() => URL.revokeObjectURL(url)} />}
                        {isPdf && <div className="mt-2 text-xs text-muted-foreground">PDF selected — preview after upload.</div>}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ))}
          <div className="text-xs text-muted-foreground">
            Tip: Attach clear scans; sensitive docs are stored as restricted-access by default.
          </div>
        </CardContent>
      </Card>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="flex justify-end">
        <Button onClick={submit} disabled={saving}>{saving ? "Saving..." : "Create Claim"}</Button>
      </div>
    </div>
  );
}