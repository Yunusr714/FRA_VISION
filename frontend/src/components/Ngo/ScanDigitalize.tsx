import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/store/authStore";
import { NGOScanApi } from "@/lib/api";

type Props = {
  claimId?: number;
  onApplied?: (data: any) => void; // push extracted fields into parent form
};

export default function ScanDigitize({ claimId, onApplied }: Props) {
  const { token } = useAuthStore();
  const [file, setFile] = useState<File | null>(null);
  const [docId, setDocId] = useState<number | null>(null);
  const [jobId, setJobId] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("");
  const [extracted, setExtracted] = useState<string>(""); // pretty JSON
  const [network, setNetwork] = useState("polygon");
  const [txId, setTxId] = useState("");
  const [notarized, setNotarized] = useState<string>("");

  async function upload() {
    if (!token || !file) return;
    const res = await NGOScanApi.uploadScan(token, file, { claim_id: claimId, doc_type: "claim_form_scan" });
    setDocId(res.doc_id);
  }

  async function startExtract() {
    if (!token || !docId) return;
    const res = await NGOScanApi.startExtraction(token, docId, claimId || undefined);
    setJobId(res.job_id);
    setStatus(res.status);
  }

  async function refresh() {
    if (!token || !jobId) return;
    const res = await NGOScanApi.jobStatus(token, jobId);
    setStatus(res.status);
    if (res.status === "succeeded" && res.extracted_json) {
      try { setExtracted(JSON.stringify(JSON.parse(res.extracted_json), null, 2)); }
      catch { setExtracted(res.extracted_json); }
    }
  }

  async function applyToForm() {
    if (!token || !jobId || !claimId) {
      // Allow parent to parse extracted JSON directly if claim not yet created
      if (onApplied && extracted) {
        try { onApplied(JSON.parse(extracted)); } catch {}
      }
      return;
    }
    await NGOScanApi.ingestExtracted(token, claimId, jobId);
    // Parent can reload claim details
  }

  async function doNotarize() {
    if (!token || !docId || !network || !txId) return;
    const res = await NGOScanApi.notarize(token, docId, { network, tx_id: txId });
    setNotarized(`${res.tx_id} (${res.network})`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scan & Digitize (Legacy FRA Claim)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <Label>Upload scanned form (PDF/JPG/PNG)</Label>
            <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={upload} disabled={!file}>Upload</Button>
          </div>
        </div>
        {docId && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-end gap-2">
              <Button onClick={startExtract} disabled={!!jobId}>Start ML Extraction</Button>
              <Button variant="outline" onClick={refresh} disabled={!jobId}>Check Status</Button>
              <span className="text-sm text-muted-foreground">Status: {status || "-"}</span>
            </div>
          </div>
        )}
        {extracted && (
          <div className="space-y-2">
            <Label>Extracted Fields (review/edit before applying)</Label>
            <Textarea rows={8} value={extracted} onChange={(e) => setExtracted(e.target.value)} />
            <div className="flex gap-2">
              <Button onClick={applyToForm}>Apply to Form</Button>
            </div>
          </div>
        )}
        {docId && (
          <div className="space-y-2">
            <Label>Blockchain Notarization (optional)</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input placeholder="Network (e.g., polygon)" value={network} onChange={(e) => setNetwork(e.target.value)} />
              <Input placeholder="Transaction ID" value={txId} onChange={(e) => setTxId(e.target.value)} />
              <Button variant="outline" onClick={doNotarize}>Record Receipt</Button>
            </div>
            {notarized && <div className="text-xs text-muted-foreground">Notarized: {notarized}</div>}
          </div>)}
      </CardContent>
    </Card>
  );
}