import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthStore } from "@/store/authStore";
import { NGOClaimsApi } from "@/lib/api";
import ClaimPartiesManager from "@/components/Ngo/ClaimPartiesManager";
// If your hook file is spelled Persist, keep that spelling; this matches your file path
import { useFormPersist, clearPersistedForm } from "../../hooks/useFormPresist";

const FORM_PREFIX = "fra:edit-claim:";

// Normalize any string to a valid Select value (non-empty) or undefined for placeholder
const safeSelectValue = (v?: string | null) =>
  v && String(v).trim().length > 0 ? String(v) : undefined;

export default function ClaimEdit() {
  const { token } = useAuthStore();
  const { id } = useParams();
  const claimId = useMemo(() => Number(id), [id]);
  const navigate = useNavigate();

  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");

  const persistKey = `${FORM_PREFIX}${claimId}`;

  useEffect(() => {
    if (!token || !claimId) return;
    (async () => {
      try {
        const data = await NGOClaimsApi.get(token, claimId);
        const f = {
          type: safeSelectValue(data.type),
          source: safeSelectValue(data.source),
          applicant_category: safeSelectValue(data.applicant_category) ?? "ST",
          residence_since_year: data.residence_since_year ?? "",
          claim_identifier: data.claim_identifier ?? "",
          state_id: data.state_id ?? "",
          district_id: data.district_id ?? "",
          block: data.block ?? "",
          gram_panchayat: data.gram_panchayat ?? "",
          village: data.village ?? "",
          khata_no: data.khata_no ?? "",
          khasra_no: data.khasra_no ?? "",
          claimed_area_ha: data.claimed_area_ha ?? "",
          legacy_ref: data.legacy_ref ?? "",
          ownership_check_status: safeSelectValue(data.ownership_check_status) ?? "unknown",
          ownership_check_notes: data.ownership_check_notes ?? "",
          notes: data.notes ?? "",
          evidence_flags:
            data.evidence_flags ?? {
              id_proof: false,
              tribal_certificate: false,
              residence_proof: false,
              gram_sabha_resolution: false,
              survey_docs: false,
              map_available: false,
            },
          location_lat: data.location_lat ?? "",
          location_lon: data.location_lon ?? "",
          location_accuracy_m: data.location_accuracy_m ?? "",
          location_source: safeSelectValue(data.location_source) ?? "ngo",
        };
        setForm(f);
      } catch (e: any) {
        setError(e?.message || "Failed to load claim");
      }
    })();
  }, [token, claimId]);

  useFormPersist(persistKey, form, (v) => v && setForm(v));

  const setField = (k: string, v: any) => setForm((prev: any) => ({ ...prev, [k]: v }));

  async function save() {
    if (!token || !claimId || !form) return;
    setSaving(true);
    setError("");

    const lat = form.location_lat !== "" ? Number(form.location_lat) : null;
    const lon = form.location_lon !== "" ? Number(form.location_lon) : null;
    if ((lat !== null && (lat < -90 || lat > 90)) || (lon !== null && (lon < -180 || lon > 180))) {
      setError("Latitude/Longitude out of range");
      setSaving(false);
      return;
    }

    try {
      const payload = {
        type: safeSelectValue(form.type),
        source: safeSelectValue(form.source),
        applicant_category: safeSelectValue(form.applicant_category) ?? undefined,
        residence_since_year: form.residence_since_year !== "" ? Number(form.residence_since_year) : undefined,
        claim_identifier: form.claim_identifier || undefined,
        state_id: form.state_id !== "" ? Number(form.state_id) : undefined,
        district_id: form.district_id !== "" ? Number(form.district_id) : undefined,
        block: form.block || undefined,
        gram_panchayat: form.gram_panchayat || undefined,
        village: form.village || undefined,
        khata_no: form.khata_no || undefined,
        khasra_no: form.khasra_no || undefined,
        claimed_area_ha: form.claimed_area_ha !== "" ? Number(form.claimed_area_ha) : undefined,
        legacy_ref: form.legacy_ref || undefined,
        ownership_check_status: safeSelectValue(form.ownership_check_status) ?? undefined,
        ownership_check_notes: form.ownership_check_notes || undefined,
        notes: form.notes || undefined,
        evidence_flags: form.evidence_flags,
        location_lat: lat ?? undefined,
        location_lon: lon ?? undefined,
        location_accuracy_m: form.location_accuracy_m !== "" ? Number(form.location_accuracy_m) : undefined,
        location_source: safeSelectValue(form.location_source) ?? "ngo",
      };

      await NGOClaimsApi.update(token, claimId, payload);
      clearPersistedForm(persistKey);
      navigate(`/ngo/claim/${claimId}`);
    } catch (e: any) {
      setError(e?.message || "Failed to save claim");
    } finally {
      setSaving(false);
    }
  }

  if (!form) {
    return (
      <div className="container mx-auto p-6">
        Loading… {error && <span className="text-red-600 text-sm ml-2">{error}</span>}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Claim {form.claim_identifier || `#${claimId}`}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label>Claim Type</Label>
              <Select value={safeSelectValue(form.type)} onValueChange={(v) => setField("type", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
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
              <Select value={safeSelectValue(form.source)} onValueChange={(v) => setField("source", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="legacy_digitization">Legacy Digitization</SelectItem>
                  <SelectItem value="fresh_application">Fresh Application</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Applicant Category</Label>
              <Select
                value={safeSelectValue(form.applicant_category) ?? "ST"}
                onValueChange={(v) => setField("applicant_category", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ST">ST</SelectItem>
                  <SelectItem value="OTFD">OTFD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Residence since (Year)</Label>
              <Input
                type="number"
                value={form.residence_since_year}
                onChange={(e) => setField("residence_since_year", e.target.value)}
                placeholder="e.g., 1998"
              />
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
              <Input
                type="number"
                step="0.01"
                value={form.claimed_area_ha}
                onChange={(e) => setField("claimed_area_ha", e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Legacy Reference</Label>
              <Input
                value={form.legacy_ref}
                onChange={(e) => setField("legacy_ref", e.target.value)}
                placeholder="Register Vol-3 Page-57"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Latitude</Label>
              <Input
                type="number"
                step="0.000001"
                value={form.location_lat}
                onChange={(e) => setField("location_lat", e.target.value)}
              />
            </div>
            <div>
              <Label>Longitude</Label>
              <Input
                type="number"
                step="0.000001"
                value={form.location_lon}
                onChange={(e) => setField("location_lon", e.target.value)}
              />
            </div>
            <div>
              <Label>Accuracy (m)</Label>
              <Input
                type="number"
                value={form.location_accuracy_m}
                onChange={(e) => setField("location_accuracy_m", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Ownership Pre-check</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Select
                value={safeSelectValue(form.ownership_check_status)}
                onValueChange={(v) => setField("ownership_check_status", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="unknown" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unknown">Unknown</SelectItem>
                  <SelectItem value="checked">Checked</SelectItem>
                  <SelectItem value="no_private_patta">No Private Patta</SelectItem>
                  <SelectItem value="overlap_found">Overlap Found</SelectItem>
                </SelectContent>
              </Select>
              <div className="md:col-span-2">
                <Input
                  value={form.ownership_check_notes}
                  onChange={(e) => setField("ownership_check_notes", e.target.value)}
                  placeholder="RoR/Khasra verified; no private pattas overlapping; Patwari note attached."
                />
              </div>
            </div>
          </div>

          <div>
            <Label>Evidence Flags</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {Object.keys(form.evidence_flags || {}).map((k) => (
                <label key={k} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!form.evidence_flags[k]}
                    onChange={(e) =>
                      setField("evidence_flags", { ...form.evidence_flags, [k]: e.target.checked })
                    }
                  />
                  <span>{k.replace(/_/g, " ")}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} rows={3} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Parties</CardTitle>
        </CardHeader>
        <CardContent>
          {Number.isFinite(claimId) && <ClaimPartiesManager claimId={claimId} />}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}