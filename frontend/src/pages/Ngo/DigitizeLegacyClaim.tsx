import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthStore } from "@/store/authStore";
import { NGOClaimsApi, NGOScanApi } from "@/lib/api";
import { useNavigate } from "react-router-dom";

type Extracted = any;

export default function DigitizeLegacyClaim() {
  const { token } = useAuthStore();
  const navigate = useNavigate();

  // Upload/Job state
  const [file, setFile] = useState<File | null>(null);
  const [docId, setDocId] = useState<number | null>(null);
  const [jobId, setJobId] = useState<number | null>(null);
  const [jobStatus, setJobStatus] = useState<string>("-");
  const [extractedRaw, setExtractedRaw] = useState<string>("");

  // Blockchain
  const [network, setNetwork] = useState("polygon");
  const [txId, setTxId] = useState("");
  const [notarized, setNotarized] = useState<string>("");

  // Mapping/editor form
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
      map_available: false,
      gram_sabha_resolution: false
    },
    parties: [{ name: "", gender: "", tribe: "", id_type: "", id_number: "", relation: "", age: "" }],
    location_lat: "",
    location_lon: "",
    location_accuracy_m: "",
    location_source: "ngo"
  });

  const canCreateClaim = useMemo(() => {
    return !!form.village && !!form.type;
  }, [form]);

  function setField(k: string, v: any) {
    setForm((prev: any) => ({ ...prev, [k]: v }));
  }

  function updateParty(idx: number, k: string, v: any) {
    setForm((prev: any) => {
      const arr = [...prev.parties];
      arr[idx] = { ...arr[idx], [k]: v };
      return { ...prev, parties: arr };
    });
  }

  function addParty() {
    setForm((prev: any) => ({
      ...prev,
      parties: [
        ...prev.parties,
        { name: "", gender: "", tribe: "", id_type: "", id_number: "", relation: "", age: "" }
      ]
    }));
  }

  function removeParty(idx: number) {
    setForm((prev: any) => ({ ...prev, parties: prev.parties.filter((_: any, i: number) => i !== idx) }));
  }

  // Upload scanned doc
  async function upload() {
    if (!token || !file) return;
    const res = await NGOScanApi.uploadScan(token, file, { doc_type: "claim_form_scan" });
    setDocId(res.doc_id);
  }

  // Start ML extraction
  async function startExtract() {
    if (!token || !docId) return;
    const res = await NGOScanApi.startExtraction(token, docId);
    setJobId(res.job_id);
    setJobStatus(res.status || "running");
  }

  // Poll job status
  async function refresh() {
    if (!token || !jobId) return;
    const res = await NGOScanApi.jobStatus(token, jobId);
    setJobStatus(res.status);
    if (res.status === "succeeded" && res.extracted_json) {
      let obj: Extracted | null = null;
      try {
        obj = JSON.parse(res.extracted_json);
        setExtractedRaw(JSON.stringify(obj, null, 2));
      } catch {
        setExtractedRaw(res.extracted_json);
      }
      if (obj) applyExtractedToForm(obj);
    }
  }

  // Manual paste for testing
  function applyPasted() {
    try {
      const obj = JSON.parse(extractedRaw);
      applyExtractedToForm(obj);
    } catch {
      // ignore
    }
  }

  // Simple mapper: adjust based on your ML schema
  function applyExtractedToForm(e: Extracted) {
    setForm((prev: any) => ({
      ...prev,
      applicant_category: e.applicant_category || prev.applicant_category,
      claim_identifier: e.claim_identifier || prev.claim_identifier,
      state_id: e.state_id ?? prev.state_id,
      district_id: e.district_id ?? prev.district_id,
      block: e.block ?? prev.block,
      gram_panchayat: e.gram_panchayat ?? prev.gram_panchayat,
      village: e.village ?? prev.village,
      khata_no: e.khata_no ?? prev.khata_no,
      khasra_no: e.khasra_no ?? prev.khasra_no,
      claimed_area_ha: e.claimed_area_ha ?? prev.claimed_area_ha,
      legacy_ref: e.legacy_ref ?? prev.legacy_ref,
      notes: e.notes ?? prev.notes,
      residence_since_year: e.residence_since_year ?? prev.residence_since_year,
      evidence_flags: typeof e.evidence_flags === "object" ? { ...prev.evidence_flags, ...e.evidence_flags } : prev.evidence_flags,
      location_lat: e.location_lat ?? prev.location_lat,
      location_lon: e.location_lon ?? prev.location_lon,
      parties: Array.isArray(e.parties) && e.parties.length ? e.parties : prev.parties
    }));
  }

  // Create a new claim from the curated form
  async function createClaim() {
    if (!token) return;
    const lat = form.location_lat ? Number(form.location_lat) : undefined;
    const lon = form.location_lon ? Number(form.location_lon) : undefined;
    const payload = {
      type: form.type,
      source: "legacy_digitization",
      applicant_category: form.applicant_category || undefined,
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
      location_lat: lat,
      location_lon: lon,
      location_accuracy_m: form.location_accuracy_m ? Number(form.location_accuracy_m) : undefined,
      location_source: form.location_source || "ngo"
    };
    const res = await NGOClaimsApi.create(token, payload);
    if (jobId) {
      // Optional: link extracted fields to the new claim record on server
      try {
        await NGOScanApi.ingestExtracted(token, res.id, jobId);
      } catch {}
    }
    navigate(`/ngo/claim/${res.id}`);
  }

  // Attach extraction to an existing claim
  const [attachId, setAttachId] = useState<string>("");
  async function attachToExisting() {
    if (!token || !jobId) return;
    if (!attachId) return;
    const cid = Number(attachId);
    await NGOScanApi.ingestExtracted(token, cid, jobId);
    navigate(`/ngo/claim/${cid}`);
  }

  // Notarize the uploaded scan (optional)
  async function notarize() {
    if (!token || !docId || !network || !txId) return;
    const r = await NGOScanApi.notarize(token, docId, { network, tx_id: txId });
    setNotarized(`${r.tx_id} (${r.network})`);
  }

  useEffect(() => {
    let t: any;
    if (jobId && (jobStatus === "running" || jobStatus === "pending")) {
      t = setInterval(refresh, 3000);
    }
    return () => t && clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, jobStatus]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Digitize Legacy Claim (Scan)</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>1) Upload Scanned FRA Claim Form</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <Label>Scan (PDF/JPG/PNG)</Label>
              <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={upload} disabled={!file}>Upload</Button>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">Document ID: {docId ?? "-"}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>2) Run ML Extraction</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Button onClick={startExtract} disabled={!docId || !!jobId}>Start Extraction</Button>
            <Button variant="outline" onClick={refresh} disabled={!jobId}>Check Status</Button>
            <span className="text-sm text-muted-foreground">Job: {jobId ?? "-"} | Status: {jobStatus}</span>
          </div>
          <div className="space-y-2">
            <Label>Extracted JSON (review/edit if needed)</Label>
            <Textarea rows={8} value={extractedRaw} onChange={(e) => setExtractedRaw(e.target.value)} placeholder='{"village":"...","khata_no":"..."}' />
            <div className="flex gap-2">
              <Button variant="outline" onClick={applyPasted}>Apply to mapping form</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>3) Curate Mapped Fields (will be saved into the claim)</CardTitle></CardHeader>
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
            <div>
              <Label>Legacy Claim ID</Label>
              <Input value={form.claim_identifier} onChange={(e) => setField("claim_identifier", e.target.value)} placeholder="LEG-IFR-XXXX" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label>State ID</Label>
              <Input type="number" value={form.state_id} onChange={(e) => setField("state_id", e.target.value)} />
            </div>
            <div>
              <Label>District ID</Label>
              <Input type="number" value={form.district_id} onChange={(e) => setField("district_id", e.target.value)} />
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
              <Input type="number" step="0.000001" value={form.location_lat} onChange={(e) => setField("location_lat", e.target.value)} />
            </div>
            <div>
              <Label>Longitude</Label>
              <Input type="number" step="0.000001" value={form.location_lon} onChange={(e) => setField("location_lon", e.target.value)} />
            </div>
            <div>
              <Label>Ownership Pre-check</Label>
              <Select value={form.ownership_check_status} onValueChange={(v) => setField("ownership_check_status", v)}>
                <SelectTrigger><SelectValue placeholder="unknown" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unknown">Unknown</SelectItem>
                  <SelectItem value="checked">Checked</SelectItem>
                  <SelectItem value="no_private_patta">No Private Patta</SelectItem>
                  <SelectItem value="overlap_found">Overlap Found</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Ownership Notes</Label>
            <Input value={form.ownership_check_notes} onChange={(e) => setField("ownership_check_notes", e.target.value)} placeholder="RoR/Khasra verified; no private pattas overlapping" />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea rows={3} value={form.notes} onChange={(e) => setField("notes", e.target.value)} />
          </div>

          <div>
            <Label>Parties</Label>
            <div className="space-y-3">
              {form.parties.map((p: any, idx: number) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-3 border p-3 rounded">
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
                    <Button variant="ghost" onClick={() => removeParty(idx)} disabled={form.parties.length === 1}>Remove</Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addParty}>Add Party</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>4) Save</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3 flex-wrap">
            <Button onClick={createClaim} disabled={!canCreateClaim}>Create New Claim from Extracted Data</Button>
            <div className="flex items-center gap-2">
              <Input type="number" placeholder="Existing Claim ID" value={attachId} onChange={(e) => setAttachId(e.target.value)} />
              <Button variant="outline" onClick={attachToExisting} disabled={!jobId || !attachId}>Attach Extracted Data to Existing</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Optional: Blockchain Notarization</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="Network (e.g., polygon)" value={network} onChange={(e) => setNetwork(e.target.value)} />
            <Input placeholder="Transaction ID" value={txId} onChange={(e) => setTxId(e.target.value)} />
            <Button variant="outline" onClick={notarize} disabled={!docId || !network || !txId}>Record Receipt</Button>
          </div>
          <div className="text-xs text-muted-foreground">Doc: {docId ?? "-"} | Notarized: {notarized || "-"}</div>
        </CardContent>
      </Card>
    </div>
  );
}