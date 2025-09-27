import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter, Download, Eye, Calendar } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '@/lib/api';

const Claims = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { eli5Mode } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const sampleClaims = [
    { id: 'FRA-2024-0001', claimant: 'Raju Singh', village: 'Bichiwara', district: 'Dungarpur', area: 2.5, status: 'pending', submittedDate: '2024-02-15', lastUpdate: '2024-03-01', assignedOfficer: 'Vikram Singh' },
    { id: 'FRA-2024-0002', claimant: 'Kamla Devi', village: 'Sabla', district: 'Dungarpur', area: 1.8, status: 'pending', submittedDate: '2024-02-20', lastUpdate: '2024-03-01', assignedOfficer: 'Vikram Singh' },
    { id: 'FRA-2024-0003', claimant: 'Mohan Bhil', village: 'Bichiwara', district: 'Dungarpur', area: 3.2, status: 'under-verification', submittedDate: '2024-03-10', lastUpdate: '2024-03-15', assignedOfficer: 'Priya Sharma' },
    { id: 'FRA-2024-0004', claimant: 'Sita Garasia', village: 'Kherwara', district: 'Dungarpur', area: 1.2, status: 'rejected', submittedDate: '2024-01-05', lastUpdate: '2024-01-25', assignedOfficer: 'Vikram Singh' },
    { id: 'FRA-2024-0005', claimant: 'Ramesh Damor', village: 'Sagwara', district: 'Dungarpur', area: 2.8, status: 'fraud', submittedDate: '2024-02-01', lastUpdate: '2024-02-15', assignedOfficer: 'Priya Sharma' },
  ];

  const [claims, setClaims] = useState(sampleClaims);

  useEffect(() => {
    const apiBase = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
    if (!apiBase) return;
    apiFetch<any[]>('/api/claims')
      .then((data) => {
        if (Array.isArray(data) && data.length) {
          setClaims(data as any);
        }
      })
      .catch(() => {
        // keep sample fallback
      });
  }, []);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      approved: { variant: 'secondary', className: 'bg-success/10 text-success' },
      pending: { variant: 'destructive', className: 'bg-yellow-100 text-yellow-800' },
      'under-verification': { variant: 'default', className: 'bg-blue-100 text-blue-800' },
      rejected: { variant: 'destructive', className: 'bg-red-100 text-red-800' },
      fraud: { variant: 'destructive', className: 'bg-fraud/10 text-fraud' },
    };
    return variants[status] || { variant: 'outline' };
  };

  const getFilteredClaims = () => {
  let filtered = claims;

    // Role-based filtering
    if (user?.role === 'citizen_user') {
      filtered = filtered.filter(c => c.claimant === user?.name);
    } else if (user?.role === 'ngo_user') {
      filtered = sampleClaims.slice(0, 3);
    } else if (user?.district) {
      filtered = filtered.filter(c => c.district === user.district.split('-')[1]);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.claimant.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.village.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    // Date filter (simplified)
    // TODO: implement date filter properly if needed

    return filtered;
  };

  const filteredClaims = getFilteredClaims();
  const canCreateClaim = user?.role === 'citizen_user' || user?.role === 'ngo_user';
  const canViewAll = user?.role === 'mota_admin' || user?.role === 'district_officer';

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters & Search</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search claims..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under-verification">Under Verification</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="fraud">Fraud Flagged</SelectItem>
              </SelectContent>
            </Select>

            {/* Export Button */}
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Claims Table */}
      <Card>
        <CardContent>
          {filteredClaims.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Claimant</TableCell>
                  <TableCell>Village</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Submitted</TableCell>
                  {canViewAll && <TableCell>Assigned Officer</TableCell>}
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClaims.map((claim) => {
                  const statusBadge = getStatusBadge(claim.status);
                  return (
                    <TableRow key={claim.id}>
                      <TableCell>{claim.id}</TableCell>
                      <TableCell>{claim.claimant}</TableCell>
                      <TableCell>{claim.village}</TableCell>
                      <TableCell>
                        <Badge className={statusBadge.className}>
                          {claim.status.replace('-', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>{claim.submittedDate}</span>
                      </TableCell>
                      {canViewAll && <TableCell>{claim.assignedOfficer}</TableCell>}
                      <TableCell>
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/claims/${claim.id}`}>
                            <Eye className="mr-1 h-3 w-3" />
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No claims found matching your criteria.</p>
              {canCreateClaim && (
                <Button asChild className="mt-4" variant="outline">
                  <Link to="/claims/new">Submit Your First Claim</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        {['pending', 'approved', 'under-verification', 'rejected'].map((status) => {
          const statusCount = filteredClaims.filter(c => c.status === status).length;
          const statusTitle =
            status === 'under-verification'
              ? 'Under Review'
              : status.charAt(0).toUpperCase() + status.slice(1);
          return (
            <Card key={status}>
              <CardContent className="p-4 flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                  <Badge className="w-3 h-3 rounded-full bg-current" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{statusCount}</div>
                  <div className="text-sm text-muted-foreground">{statusTitle}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Claims;
