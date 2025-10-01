import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  HelpCircle,
  Eye,
  Trash2,
  Map as MapIcon,
  UploadCloud,
  AlertTriangle,
  ClipboardList
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { NGOClaimsDocsApi } from '@/lib/ngo-docs-api';
import { OfficerApi } from '@/lib/officer-api';
import { ClaimsApi } from '@/lib/claims-api';

const ClaimDetail = () => {
  // Route: /claims/view/:id
  const { id } = useParams();
  const claimId = useMemo(() => Number(id), [id]);
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const { eli5Mode } = useAppStore();

  const [claim, setClaim] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [docType, setDocType] = useState<string>("id_proof");
  const [files, setFiles] = useState<FileList | null>(null);

  const role = user?.role;
  const isNGO = role === 'ngo_user';
  const isFRD = role === 'forest_revenue_officer';
  const isOfficer = role === 'district_officer' || role === 'mota_admin';
  const isAdmin = role === 'mota_admin';
  const isPDA = role === 'pda_planner';

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      approved: 'bg-success/10 text-success',
      submitted: 'bg-gray-100 text-gray-800',
      under_verification: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800',
      fraud: 'bg-fuchsia-100 text-fuchsia-800',
    };
    return map[status?.replace('-', '_')] || 'border';
  };

  async function load() {
    if (!token || !claimId) return;
    setLoading(true);
    setError("");
    try {
      const data = await ClaimsApi.getOne(token, claimId);
      setClaim(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load claim");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [token, claimId]);

  async function uploadDocs() {
    if (!token || !claimId || !files || !docType) return;
    if (!isNGO && !isAdmin) return;
    for (const f of Array.from(files)) {
      await NGOClaimsDocsApi.upload(token, claimId, f, docType, f.name);
    }
    setFiles(null);
    await load();
  }
  async function previewDoc(docId: number, filename?: string) {
    if (!token) return;
    const blob = await NGOClaimsDocsApi.previewBlob(token, docId);
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (win) win.document.title = filename || "document";
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
  async function deleteDoc(docId: number) {
    if (!token || !claimId) return;
    if (!isNGO && !isAdmin) return;
    if (!confirm("Remove this document?")) return;
    await NGOClaimsDocsApi.remove(token, claimId, docId);
    await load();
  }

  // Officer actions
  async function approve() {
    if (!token || !claimId) return;
    await OfficerApi.setStatus(token, claimId, "approved", "Approved by officer");
    await load();
  }
  async function reject() {
    if (!token || !claimId) return;
    const reason = prompt("Reason for rejection?") || "Rejected by officer";
    await OfficerApi.setStatus(token, claimId, "rejected", reason);
    await load();
  }
  async function requestDocs() {
    if (!token || !claimId) return;
    const note = prompt("What additional documents are required?") || "Please upload missing documents.";
    await OfficerApi.requestDocs(token, claimId, note);
    await load();
  }
  async function assignSurvey() {
    if (!token || !claimId) return;
    const note = prompt("Any notes for the field team?") || "Assigning field survey.";
    await OfficerApi.assignSurvey(token, claimId, note);
    await load();
  }
  async function markFraud() {
    if (!token || !claimId) return;
    const note = prompt("Add a note for fraud flag (optional):") || "Marked as fraud";
    await OfficerApi.setStatus(token, claimId, "fraud" as any, note);
    await load();
  }

  if (!token) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>Please log in to view claim details.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button asChild variant="outline" size="icon">
            <Link to="/claims">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {claim?.claim_identifier || (claimId ? `#${claimId}` : "Claim")}
            </h1>
            <p className="text-muted-foreground">Forest Rights Claim Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* NGO edit */}
          {isNGO && (
            <Button variant="outline" onClick={() => navigate(`/ngo/claim/${claimId}/edit`)}>
              Edit Claim
            </Button>
          )}
          {/* FRD: open Atlas for geometry editing */}
          {isFRD && (
            <Button variant="outline" onClick={() => navigate(`/atlas?claimId=${claimId}`)}>
              <MapIcon className="h-4 w-4 mr-1" /> Edit geometry in Atlas
            </Button>
          )}
        </div>
      </div>

      {/* ELI5 */}
      {eli5Mode && (
        <Alert className="eli5-mode">
          <HelpCircle className="h-4 w-4" />
          <AlertDescription>
            This page shows the claim details, documents, and processing timeline. Actions are shown based on your role.
          </AlertDescription>
        </Alert>
      )}

      {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {!loading && claim && (
        <>
          {/* Top cards */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Status
                  <Badge className={getStatusBadge(claim.status)}>
                    {String(claim.status || '-').replace('_', ' ')}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Submitted: {claim.created_at ? new Date(claim.created_at).toLocaleDateString() : '-'}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Last update: {claim.updated_at ? new Date(claim.updated_at).toLocaleDateString() : '-'}
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  Geometry: <Badge variant="outline">{claim.geometry_status || 'not_provided'}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" /> Claimant / Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {claim.village || '-'}
                  {claim.gram_panchayat ? `, ${claim.gram_panchayat}` : ''}
                  {claim.block ? `, ${claim.block}` : ''}
                </div>
                <div className="text-muted-foreground">
                  Type: {claim.type} | Source: {claim.source}
                </div>
                <div className="text-muted-foreground">
                  Claimed Area: {claim.claimed_area_ha ?? '-'} ha
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Role-based Actions</CardTitle>
                <CardDescription>Geometry and planning</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {isFRD && (
                    <Button variant="outline" onClick={() => navigate(`/atlas?claimId=${claimId}`)}>
                      <MapIcon className="h-4 w-4 mr-1" /> Edit in Atlas
                    </Button>
                  )}
                  {isPDA && (
                    <>
                      <Button variant="outline" onClick={() => navigate(`/planning?claimId=${claimId}`)}>
                        <ClipboardList className="h-4 w-4 mr-1" /> Open Planning
                      </Button>
                      <Button variant="outline" onClick={() => navigate(`/atlas?claimId=${claimId}`)}>
                        <MapIcon className="h-4 w-4 mr-1" /> Atlas
                      </Button>
                    </>
                  )}
                  {!isFRD && !isPDA && (
                    <div className="text-sm text-muted-foreground">
                      Geometry status: {claim.geometry_status || 'not_provided'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Parties */}
          <Card>
            <CardHeader>
              <CardTitle>Parties</CardTitle>
              <CardDescription>Claimants associated with this claim</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {Array.isArray(claim.parties) && claim.parties.length ? (
                claim.parties.map((p: any) => (
                  <div key={p.id} className="grid gap-2 md:grid-cols-3 text-sm border rounded p-2">
                    <div className="font-medium">{p.name}</div>
                    <div>{p.gender || '-'}</div>
                    <div>{p.tribe || '-'}</div>
                    <div className="md:col-span-3 text-muted-foreground">
                      {p.id_type || '-'} {p.id_number || ''}
                      {p.relation ? ` • ${p.relation}` : ''} {p.age != null ? ` • ${p.age}y` : ''}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No parties added.</div>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Evidence Documents</CardTitle>
              <CardDescription>Upload and manage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(isNGO || isAdmin) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="text-sm">Document Type</label>
                    <select className="w-full border rounded p-2" value={docType} onChange={(e) => setDocType(e.target.value)}>
                      <option value="id_proof">ID Proof</option>
                      <option value="tribal_certificate">Tribal Certificate</option>
                      <option value="residence_proof">Residence Proof</option>
                      <option value="gram_sabha_resolution">Gram Sabha Resolution</option>
                      <option value="survey_docs">Survey Documents</option>
                      <option value="map_scan">Map Scan</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm">File(s)</label>
                    <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFiles(e.target.files)} />
                  </div>
                  <div className="md:col-span-3">
                    <Button onClick={uploadDocs} disabled={!files || !files.length}>
                      <UploadCloud className="h-4 w-4 mr-1" /> Upload
                    </Button>
                  </div>
                </div>
              )}

              {Array.isArray(claim.documents) && claim.documents.length ? (
                claim.documents.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between border rounded p-2 text-sm">
                    <div className="flex-1">
                      <div className="font-medium">{d.title || d.filename}</div>
                      <div className="text-muted-foreground">
                        {d.doc_type} • {d.mime} • {(d.size_bytes / 1024).toFixed(1)} KB • {new Date(d.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => previewDoc(d.id)}><Eye className="h-4 w-4 mr-1" /> Preview</Button>
                      {(isNGO || isAdmin) && (
                        <Button variant="destructive" size="sm" onClick={() => deleteDoc(d.id)}><Trash2 className="h-4 w-4 mr-1" /> Remove</Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No documents uploaded.</div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Processing Timeline</CardTitle>
              <CardDescription>History of actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.isArray(claim.history) && claim.history.length ? (
                  claim.history.map((h: any, i: number) => (
                    <div key={i} className="flex items-start space-x-4">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{h.status}</div>
                          <div className="text-sm text-muted-foreground">{new Date(h.created_at).toLocaleString()}</div>
                        </div>
                        <div className="text-sm text-muted-foreground">by {h.actor || 'system'}{h.note ? ` • ${h.note}` : ''}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">No history yet.</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Officer actions */}
          {(isOfficer) && (
            <Card>
              <CardHeader><CardTitle>Officer Actions</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(claim.status === 'submitted' || claim.status === 'under_verification') && (
                    <>
                      <Button className="bg-success hover:bg-success/90" onClick={approve}>
                        <CheckCircle className="mr-2 h-4 w-4" /> Approve Claim
                      </Button>
                      <Button variant="destructive" onClick={reject}>
                        <XCircle className="mr-2 h-4 w-4" /> Reject Claim
                      </Button>
                      <Button variant="outline" onClick={requestDocs}>Request More Documents</Button>
                      <Button variant="outline" onClick={assignSurvey}>Assign Field Survey</Button>
                    </>
                  )}
                  {/* Fraud is available anytime for officers */}
                  <Button variant="outline" className="text-fuchsia-800 border-fuchsia-300" onClick={markFraud}>
                    <AlertTriangle className="mr-2 h-4 w-4 text-fuchsia-700" /> Mark Fraud
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* PDA helper panel */}
          {isPDA && (
            <Card>
              <CardHeader>
                <CardTitle>PDA Planner Actions</CardTitle>
                <CardDescription>Non-claim processing actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => navigate(`/planning?claimId=${claimId}`)}>
                    <ClipboardList className="h-4 w-4 mr-1" /> Open Planning
                  </Button>
                  <Button variant="outline" onClick={() => navigate(`/atlas?claimId=${claimId}`)}>
                    <MapIcon className="h-4 w-4 mr-1" /> Atlas (Read-only)
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default ClaimDetail;