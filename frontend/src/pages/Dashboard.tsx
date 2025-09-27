import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    FileText,
    MapPin,
    TrendingUp,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Users,
    BarChart3,
    HelpCircle,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const { eli5Mode } = useAppStore();

    // Sample data based on role
    const getDashboardData = () => {
        switch (user?.role) {
            case 'mota_admin':
                return {
                    title: 'National Overview',
                    stats: [
                        { label: 'Total Claims', value: '1,24,567', change: '+12%', icon: FileText, color: 'primary' },
                        { label: 'Pending Review', value: '23,456', change: '-5%', icon: Clock, color: 'warning' },
                        { label: 'Approved', value: '89,234', change: '+18%', icon: CheckCircle, color: 'success' },
                        { label: 'Districts Active', value: '487', change: '+2%', icon: MapPin, color: 'primary' },
                    ],
                    quickActions: [
                        { label: 'View National Report', href: '/reports', icon: BarChart3 },
                        { label: 'Policy Dashboard', href: '/admin/policy', icon: TrendingUp },
                        { label: 'AI Simulations', href: '/ai/simulate', icon: TrendingUp },
                    ],
                    alerts: [
                        { type: 'info', title: 'AI Update', message: 'New fraud detection model deployed successfully' },
                    ],
                };
            case 'district_officer':
                return {
                    title: `District Level Dashboard`,
                    stats: [
                        { label: 'My District Claims', value: '12,345', change: '+8%', icon: FileText, color: 'primary' },
                        { label: 'Awaiting Approval', value: '156', change: '-12%', icon: Clock, color: 'warning' },
                        { label: 'Approved This Month', value: '89', change: '+25%', icon: CheckCircle, color: 'success' },
                        { label: 'Field Officers', value: '12', change: '', icon: Users, color: 'primary' },
                    ],
                    quickActions: [
                        { label: 'Review Pending Claims', href: '/claims?status=pending', icon: FileText },
                        { label: 'Assign Verification', href: '/tasks', icon: Users },
                        { label: 'District Report', href: '/reports/district', icon: BarChart3 },
                    ],
                    alerts: [
                        { type: 'warning', title: 'Survey Deadline', message: '15 claims need field verification by Friday' },
                        { type: 'success', title: 'Target Achievement', message: 'Monthly approval target 98% complete' },
                    ],
                };
case 'ngo_user':
  return {
    title: 'NGO Dashboard',
    stats: [
      { label: 'Claims Submitted', value: '145', change: '+20%', icon: FileText, color: 'primary' },
      { label: 'In Progress', value: '67', change: '+5%', icon: Clock, color: 'warning' },
      { label: 'Successful Claims', value: '78', change: '+15%', icon: CheckCircle, color: 'success' },
      { label: 'Communities Served', value: '123', change: '+3%', icon: Users, color: 'primary' },
    ],
    quickActions: [
      { label: 'New Claim (NGO)', href: '/ngo/claims/new', icon: FileText },
      { label: 'Digitize Legacy Claim (Scan)', href: '/ngo/digitize', icon: FileText },
      { label: 'Track Community Cases', href: '/ngo', icon: MapPin },
    ],
    alerts: [
      { type: 'warning', title: 'Document Required', message: '3 claims missing revenue records' },
      { type: 'info', title: 'ML Extraction', message: '2 scanned jobs finished — review extracted data' },
    ],
  };                return {
                    title: 'NGO Dashboard',
                    stats: [
                        { label: 'Claims Submitted', value: '145', change: '+20%', icon: FileText, color: 'primary' },
                        { label: 'In Progress', value: '67', change: '+5%', icon: Clock, color: 'warning' },
                        { label: 'Successful Claims', value: '78', change: '+15%', icon: CheckCircle, color: 'success' },
                        { label: 'Communities Served', value: '123', change: '+3%', icon: Users, color: 'primary' },
                    ],
                    quickActions: [
                        { label: 'Submit New Claim', href: '/claims/new', icon: FileText },
                        { label: 'Track Community Cases', href: '/claims', icon: MapPin },
                        { label: 'Submit Report', href: '/community/reports', icon: BarChart3 },
                    ],
                    alerts: [
                        { type: 'warning', title: 'Document Required', message: '3 claims missing revenue records' },
                        { type: 'info', title: 'Training Available', message: 'New digital literacy workshop next week' },
                    ],
                };
            default: // citizen_user or fallback
                return {
                    title: 'My Claims Dashboard',
                    stats: [
                        { label: 'My Claims', value: '3', change: '', icon: FileText, color: 'primary' },
                        { label: 'Under Review', value: '1', change: '', icon: Clock, color: 'warning' },
                        { label: 'Approved', value: '2', change: '', icon: CheckCircle, color: 'success' },
                        { label: 'Land Area', value: '2.5 ha', change: '', icon: MapPin, color: 'primary' },
                    ],
                    quickActions: [
                        { label: 'Submit New Claim', href: '/claims/new', icon: FileText },
                        { label: 'Track My Claims', href: '/claims', icon: MapPin },
                        { label: 'Get Help', href: '/help', icon: HelpCircle },
                    ],
                    alerts: [
                        { type: 'success', title: 'Claim Approved', message: 'FRA-2024-0156 has been approved. Download your passbook.' },
                        { type: 'info', title: 'Document Upload', message: 'Please upload survey map for claim FRA-2024-0189' },
                    ],
                };
        }
    };

    const dashboardData = getDashboardData();

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold mb-2">{dashboardData.title}</h1>
                <p className="text-muted-foreground">
                    Welcome back, {user?.name.split(' ')[0]}
                </p>
            </div>
            {eli5Mode && (
                <Alert className="mt-4 eli5-mode">
                    <HelpCircle className="h-4 w-4" />
                    <AlertDescription>{t('eli5.dashboard')}</AlertDescription>
                </Alert>
            )}

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {dashboardData.stats.map((stat, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                            <stat.icon className={`h-4 w-4 text-${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">
                                {stat.change && <span className={stat.change.startsWith('+') ? 'text-success' : 'text-warning'}>{stat.change}</span>} from last month
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Actions & Alerts */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>Frequently used operations for your role</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {dashboardData.quickActions.map((action, index) => (
                            <Button key={index} asChild variant="outline" className="w-full justify-start">
                                <Link to={action.href}>
                                    <action.icon className="mr-2 h-4 w-4" />
                                    {action.label}
                                </Link>
                            </Button>
                        ))}
                    </CardContent>
                </Card>

                {/* Alerts & Notifications */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Alerts</CardTitle>
                        <CardDescription>Important updates and notifications</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {dashboardData.alerts.map((alert, index) => (
                            <Alert key={index} variant={alert.type === 'warning' ? 'destructive' : 'default'}>
                                {alert.type === 'warning' && <AlertTriangle className="h-4 w-4" />}
                                <div>
                                    <div className="font-medium">{alert.title}</div>
                                    <AlertDescription>{alert.message}</AlertDescription>
                                </div>
                            </Alert>
                        ))}
                        <Button variant="ghost" className="w-full bg-green-800 text-white" asChild>
                            <Link to="/alerts">View All Alerts</Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Recent Activity or District Performance */}
                {user?.role === 'mota_admin' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>District Performance Summary</CardTitle>
                            <CardDescription>Top performing and attention-required districts</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">Rajasthan - Dungarpur</div>
                                        <div className="text-sm text-muted-foreground">98% monthly target achieved</div>
                                    </div>
                                    <Badge variant="secondary" className="bg-success/10 text-success">Excellent</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">Odisha - Mayurbhanj</div>
                                        <div className="text-sm text-muted-foreground">67% monthly target achieved</div>
                                    </div>
                                    <Badge variant="destructive">Attention Required</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">Madhya Pradesh - Dindori</div>
                                        <div className="text-sm text-muted-foreground">85% monthly target achieved</div>
                                    </div>
                                    <Badge variant="secondary">Good</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Map Preview */}
                <Card>
                    <CardHeader>
                        <CardTitle>Atlas Overview</CardTitle>
                        <CardDescription>Quick view of forest rights claims in your area</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center space-y-2">
                            <MapPin className="h-12 w-12 text-primary mx-auto" />
                            <p className="text-muted-foreground">Interactive 3D Atlas</p>
                            <Button asChild>
                                <Link to="/atlas">Open Full Atlas</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;