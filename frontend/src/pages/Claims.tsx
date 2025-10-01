import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter, Download, Eye, Calendar, Map as MapIcon, CheckCircle, XCircle, Plus, AlertTriangle, ClipboardList } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { useTranslation } from 'react-i18next';
import { NGOClaimsApi } from '@/lib/api';
import { ClaimsApi, ClaimRow } from '@/lib/claims-api';
import { OfficerApi } from '@/lib/officer-api';

const Claims = () => {
  const { t } = useTranslation();
  const { token, user } = useAuthStore();
  const { eli5Mode } = useAppStore();
  const navigate = useNavigate();

  const role = user?.role;
  const isNGO = role === 'ngo_user';
  const isFRD = role === 'forest_revenue_officer' || role === 'mota_admin';
  const isOfficer = role === 'district_officer' || role === 'mota_admin';
  const isAdmin = role === 'mota_admin';
  const isCitizen = role === 'citizen_user';
  const isPDA = role === 'pda_planner';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ClaimRow[]>([]);
  const [error, setError] = useState<string>("");

  async function load() {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = isNGO ? await NGOClaimsApi.list(token, {}) : await ClaimsApi.listAll(token, {});
      setRows(Array.isArray(data) ? (data as ClaimRow[]) : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load claims");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, role]);

  const getStatusBadgeClass = (status: string) => {
    const s = (status || '').replace('-', '_');
    const classes: Record<string, string> = {
      approved: 'bg-success/10 text-success',
      pending: 'bg-yellow-100 text-yellow-800',
      under_verification: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      submitted: 'bg-gray-100 text-gray-800',
      draft: 'bg-gray-100 text-gray-800',
      fraud: 'bg-fuchsia-100 text-fuchsia-800',
    };
    return classes[s] || 'border';
  };

  const filtered = useMemo(() => {
    let list = [...rows];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(c =>
        (c.claim_identifier || '').toLowerCase().includes(q) ||
        (c.village || '').toLowerCase().includes(q) ||
        (c.gram_panchayat || '').toLowerCase().includes(q) ||
        (c.block || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      const key = statusFilter.replace('-', '_');
      list = list.filter(c => (c.status || '').replace('-', '_') === key);
    }
    return list;
  }, [rows, searchTerm, statusFilter]);

  // Officer quick actions
  async function quickApprove(id: number) {
    if (!token) return;
    try {
      await OfficerApi.setStatus(token, id, "approved", "Approved from dashboard");
      await load();
    } catch (e: any) {
      alert(e?.message || "Failed to approve");
    }
  }
  async function quickReject(id: number) {
    if (!token) return;
    const reason = prompt("Reason for rejection?") || "Rejected from dashboard";
    try {
      await OfficerApi.setStatus(token, id, "rejected", reason);
      await load();
    } catch (e: any) {
      alert(e?.message || "Failed to reject");
    }
  }
  async function markFraud(id: number) {
    if (!token) return;
    const note = prompt("Add a note for fraud flag (optional):") || "Marked as fraud";
    try {
      await OfficerApi.setStatus(token, id, "fraud" as any, note);
      await load();
    } catch (e: any) {
      alert(e?.message || "Failed to mark fraud");
    }
  }

  if (!token) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-sm text-muted-foreground">Please log in to view claims.</div>
      </div>
    );
  }

  if (isCitizen) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-sm text-muted-foreground">You do not have access to the claims dashboard.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Claims
            </span>
            <div className="flex gap-2">
              {isNGO && (
                <Button onClick={() => navigate("/ngo/claims/new")}>
                  <Plus className="h-4 w-4 mr-1" /> New Claim
                </Button>
              )}
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Claim ID / Village / GP / Block"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under-verification">Under Verification</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="fraud">Fraud</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Claims Table */}
      <Card>
        <CardContent>
          {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
          {loading ? (
            <div className="text-sm text-muted-foreground py-8">Loading…</div>
          ) : filtered.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Village</TableCell>
                  <TableCell>Status</TableCell>
                  {(isFRD || isOfficer || isAdmin) && <TableCell>Geometry</TableCell>}
                  <TableCell>Submitted</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => {
                  const submitted = c.created_at ? new Date(c.created_at).toLocaleDateString() : '-';
                  const statusClass = getStatusBadgeClass(c.status);
                  return (
                    <TableRow key={c.id}>
                      <TableCell>{c.claim_identifier || `#${c.id}`}</TableCell>
                      <TableCell>{c.village || '-'}</TableCell>
                      <TableCell>
                        <Badge className={statusClass}>{String(c.status || '-').replace('_', ' ')}</Badge>
                      </TableCell>
                      {(isFRD || isOfficer || isAdmin) && (
                        <TableCell>
                          <Badge variant="outline">{c.geometry_status || 'not_provided'}</Badge>
                        </TableCell>
                      )}
                      <TableCell className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>{submitted}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          {/* View always available */}
                          <Button asChild variant="outline" size="sm">
                            <Link to={`/claim/view/${c.id}`}>
                              <Eye className="mr-1 h-3 w-3" />
                              View
                            </Link>
                          </Button>

                          {/* NGO edit + Atlas */}
                          {isNGO && (
                            <>
                              <Button asChild variant="outline" size="sm">
                                <Link to={`/ngo/claim/${c.id}/edit`}>Edit</Link>
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => navigate(`/atlas?claimId=${c.id}`)}>
                                <MapIcon className="mr-1 h-3 w-3" />
                                Atlas
                              </Button>
                            </>
                          )}

                          {/* FRD Atlas */}
                          {isFRD && (
                            <Button variant="outline" size="sm" onClick={() => navigate(`/atlas?claimId=${c.id}`)}>
                              <MapIcon className="mr-1 h-3 w-3" />
                              Atlas
                            </Button>
                          )}

                          {/* PDA planner row actions */}
                          {isPDA && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => navigate(`/planning?claimId=${c.id}`)}>
                                <ClipboardList className="mr-1 h-3 w-3" />
                                Plan
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => navigate(`/atlas?claimId=${c.id}`)}>
                                <MapIcon className="mr-1 h-3 w-3" />
                                Atlas
                              </Button>
                            </>
                          )}

                          {/* Officer quick actions */}
                          {isOfficer && (c.status === 'submitted' || c.status === 'under_verification') && (
                            <>
                              <Button size="sm" className="bg-success hover:bg-success/90" onClick={() => quickApprove(c.id)}>
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Approve
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => quickReject(c.id)}>
                                <XCircle className="mr-1 h-3 w-3" />
                                Reject
                              </Button>
                            </>
                          )}
                          {isOfficer && (
                            <Button size="sm" variant="outline" className="text-fuchsia-800 border-fuchsia-300" onClick={() => markFraud(c.id)}>
                              <AlertTriangle className="mr-1 h-3 w-3 text-fuchsia-700" />
                              Mark Fraud
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No claims found.</p>
              {isNGO && (
                <Button asChild className="mt-4" variant="outline">
                  <Link to="/ngo/claims/new">Submit New Claim</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Claims;