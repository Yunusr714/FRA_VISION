import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { NGOClaimsDocsApi } from "@/lib/ngo-docs-api";
import { Trash2, Eye } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import ClaimPartiesManager from "@/components/Ngo/ClaimPartiesManager";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

type Props = { claimId: number };

export default function ClaimDocumentsManager({ claimId }: Props) {
  const { token } = useAuthStore();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!token) return;
    setLoading(true);
    try {
      const rows = await NGOClaimsDocsApi.list(token, claimId);
      setDocs(rows);
    } finally { setLoading(false); }
  }

  async function preview(docId: number, filename?: string) {
    if (!token) return;
    try {
      const blob = await NGOClaimsDocsApi.previewBlob(token, docId);
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      if (win) {
        // best effort to set tab title
        win.document.title = filename || "document";
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      alert("Preview failed");
    }
  }

  async function remove(docId: number) {
    if (!token) return;
    if (!confirm("Remove this document?")) return;
    await NGOClaimsDocsApi.remove(token, claimId, docId);
    await load();
  }

  useEffect(() => { load(); }, [token, claimId]);

  if (!token) return null;

  return (
    <div className="space-y-2">
      <div className="font-medium">Uploaded Documents</div>
      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
      <Card>
  <CardHeader><CardTitle>Manage Parties</CardTitle></CardHeader>
  <CardContent>
    {Number.isFinite(id) && <ClaimPartiesManager claimId={id} />}
  </CardContent>
</Card>
      {docs.map((d) => (
        <div key={d.id} className="flex items-center justify-between border rounded p-2 text-sm">
          <div className="flex-1">
            <div className="font-medium">{d.title || d.filename}</div>
            <div className="text-muted-foreground">{d.doc_type} • {d.mime} • {(d.size_bytes/1024).toFixed(1)} KB</div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => preview(d.id, d.title)}><Eye className="h-4 w-4 mr-1" /> Preview</Button>
            <Button variant="destructive" size="sm" onClick={() => remove(d.id)}><Trash2 className="h-4 w-4 mr-1" /> Remove</Button>
          </div>
        </div>
      ))}
      {docs.length === 0 && <div className="text-sm text-muted-foreground">No documents uploaded yet.</div>}
    </div>
  );
}