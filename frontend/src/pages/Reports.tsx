import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    BarChart3,
    Download,
    Calendar,
    Filter,
    FileText,
    TrendingUp,
    HelpCircle,
    MapPin,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const Reports = () => {
    const { user } = useAuthStore();
    const { eli5Mode } = useAppStore();

    // Sample data for charts
    const claimStatusData = [
        { name: 'Approved', value: 1250, color: '#16A34A' },
        { name: 'Pending', value: 850, color: '#F59E0B' },
        { name: 'Under Review', value: 420, color: '#2563EB' },
        { name: 'Rejected', value: 180, color: '#DC2626' },
    ];

    const monthlyTrendData = [
        { month: 'Jan', submitted: 120, approved: 95, rejected: 15 },
        { month: 'Feb', submitted: 135, approved: 110, rejected: 10 },
        { month: 'Mar', submitted: 140, approved: 125, rejected: 12 },
        { month: 'Apr', submitted: 162, approved: 140, rejected: 20 },
        { month: 'May', submitted: 155, approved: 135, rejected: 16 },
        { month: 'Jun', submitted: 160, approved: 145, rejected: 14 },
    ];

    const districtPerformance = [
        { district: 'Dungarpur', approved: 245, pending: 89, percentage: 73 },
        { district: 'Banswara', approved: 198, pending: 112, percentage: 64 },
        { district: 'Pratapgarh', approved: 167, pending: 95, percentage: 64 },
        { district: 'Udaipur', approved: 156, pending: 78, percentage: 67 },
        { district: 'Rajsamand', approved: 134, pending: 56, percentage: 71 },
    ];

    const reportTemplates = [
        {
            id: 'monthly_summary',
            title: 'Monthly Summary Report',
            description: 'Comprehensive monthly statistics and trends.',
            scope: user?.role === 'mota_admin' ? 'National' : 'District',
            lastGenerated: '2024-03-01',
        },
        {
            id: 'district_performance',
            title: 'District Performance Analysis',
            description: 'Detailed performance metrics by district.',
            scope: 'District',
            lastGenerated: '2024-03-01',
        },
        {
            id: 'claim_processing',
            title: 'Claim Processing Timeline',
            description: 'Analysis of processing times and bottlenecks.',
            scope: user?.role === 'mota_admin' ? 'National' : 'District',
            lastGenerated: '2024-02-28',
        },
        {
            id: 'ai_insights',
            title: 'AI Insights Report',
            description: 'Machine learning predictions and recommendations.',
            scope: 'National',
            lastGenerated: '2024-03-01',
        },
    ];

    const downloadReport = (reportId: string) => {
        // Simulate report download
        console.log('Downloading report:', reportId);
    };

    const generateReport = (reportId: string) => {
        // Simulate report generation
        console.log('Generating report:', reportId);
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold mb-2">Reports & Analytics</h1>
                <p className="text-muted-foreground">
                    {user?.role === 'mota_admin'
                        ? 'National forest rights processing statistics and insights'
                        : 'District-level performance metrics and analytics'}
                </p>
            </div>

            {/* ELI5 Mode */}
            {eli5Mode && (
                <Alert className="eli5-mode">
                    <HelpCircle className="h-4 w-4" />
                    <AlertDescription>
                        These reports show numbers and charts about forest land requests. They help government officials see how well the system is working and where improvements are needed.
                    </AlertDescription>
                </Alert>
            )}

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card><CardContent className="p-4"><div className="text-center"><div className="text-2xl font-bold">2,700</div><div className="text-sm text-muted-foreground">Total Claims</div><div className="text-xs text-success">+12% from last month</div></div></CardContent></Card>
                <Card><CardContent className="p-4"><div className="text-center"><div className="text-2xl font-bold text-success">1,250</div><div className="text-sm text-muted-foreground">Approved</div><div className="text-xs text-success">~73% approval rate</div></div></CardContent></Card>
                <Card><CardContent className="p-4"><div className="text-center"><div className="text-2xl font-bold text-warning">850</div><div className="text-sm text-muted-foreground">Pending</div><div className="text-xs text-warning">-5% from last month</div></div></CardContent></Card>
                <Card><CardContent className="p-4"><div className="text-center"><div className="text-2xl font-bold">15</div><div className="text-sm text-muted-foreground">Avg Days to Process</div><div className="text-xs text-success">3 days improvement</div></div></CardContent></Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Claim Status Distribution</CardTitle>
                        <CardDescription>Current breakdown of all claims by status.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={claimStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                    {claimStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Monthly Trends */}
                <Card>
                    <CardHeader>
                        <CardTitle>Monthly Processing Trends</CardTitle>
                        <CardDescription>Claims submitted, approved, and rejected over time.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={monthlyTrendData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="submitted" stroke="#2563EB" strokeWidth={2} />
                                <Line type="monotone" dataKey="approved" stroke="#16A34A" strokeWidth={2} />
                                <Line type="monotone" dataKey="rejected" stroke="#DC2626" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {user?.role === 'mota_admin' && (
                <Card>
                    <CardHeader>
                        <CardTitle>District Performance Ranking</CardTitle>
                        <CardDescription>Top performing districts by approval rate and efficiency.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={districtPerformance}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="district" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="approved" fill="#16A34A" name="Approved" />
                                <Bar dataKey="pending" fill="#F59E0B" name="Pending" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Report Templates */}
            <Card>
                <CardHeader>
                    <CardTitle>Report Templates</CardTitle>
                    <CardDescription>Pre-configured reports for different analysis needs.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        {reportTemplates.map((template) => (
                            <Card key={template.id} className="border">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">{template.title}</CardTitle>
                                    <CardDescription className="text-sm">{template.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="text-sm text-muted-foreground space-y-1">
                                            <div className="flex items-center space-x-1"><MapPin className="h-3 w-3" /><span>Scope: {template.scope}</span></div>
                                            <div className="flex items-center space-x-1"><Calendar className="h-3 w-3" /><span>Last: {template.lastGenerated}</span></div>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button variant="outline" size="sm" onClick={() => downloadReport(template.id)}>
                                            <Download className="mr-1 h-3 w-3" />
                                            Download
                                        </Button>
                                        <Button size="sm" onClick={() => generateReport(template.id)}>
                                            <BarChart3 className="mr-1 h-3 w-3" />
                                            Generate
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Reports;