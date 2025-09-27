import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Users, 
  Settings, 
  Database, 
  Upload,
  Download,
  Shield,
  Activity,
  HelpCircle,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';

const Admin = () => {
  const { eli5Mode } = useAppStore();
  const [activeTab, setActiveTab] = useState('users');

  // Sample users data
  const users = [
    {
      id: '1',
      name: 'Priya Sharma',
      email: 'priya.sharma@dungarpur.gov.in',
      role: 'district_officer',
      district: 'Rajasthan-Dungarpur',
      status: 'active',
      lastLogin: '2024-03-15 09:30',
      claimsHandled: 245
    },
     {
      id: '2',
      name: 'Vikram Singh',
      email: 'vikram.singh@rajasthan.gov.in',
      role: 'forest_revenue_officer',
      district: 'Rajasthan-Dungarpur',
      status: 'active',
      lastLogin: '2024-03-15 08:45',
      claimsHandled: 156
    },
    {
      id: '3',
      name: 'Anjali Verma',
      email: 'anjali.verma@pda.gov.in',
      role: 'pda_planner',
      district: null,
      status: 'active',
      lastLogin: '2024-03-14 16:20',
      claimsHandled: 0
    },
    {
      id: '4',
      name: 'Ravi Patel',
      email: 'ravi@tribalrights.org',
      role: 'ngo_user',
      district: null,
      status: 'active',
      lastLogin: '2024-03-15 10:15',
      claimsHandled: 78
    }
  ];
   // System settings
  const systemSettings = [
    {
      category: 'Processing',
      settings: [
        { key: 'auto_assign_claims', label: 'Auto-assign new claims', value: true, type: 'boolean' },
        { key: 'max_processing_days', label: 'Maximum processing days', value: 30, type: 'number' },
        { key: 'require_2fa', label: 'Require 2FA for officers', value: true, type: 'boolean' }
      ]
    },
    {
      category: 'AI & Analytics',
      settings: [
        { key: 'ai_analysis_enabled', label: 'Enable AI claim analysis', value: true, type: 'boolean' },
        { key: 'fraud_detection_threshold', label: 'Fraud detection threshold (%)', value: 85, type: 'number' },
        { key: 'satellite_monitoring', label: 'Enable satellite monitoring', value: true, type: 'boolean' }
      ]
    },
    {
      category: 'Notifications',
      settings: [
        { key: 'email_notifications', label: 'Send email notifications', value: true, type: 'boolean' },
        { key: 'sms_notifications', label: 'Send SMS notifications', value: false, type: 'boolean' },
        { key: 'alert_frequency_hours', label: 'Alert frequency (hours)', value: 24, type: 'number' }
      ]
    }
  ];

  // Audit logs
  const auditLogs = [
    {
      id: 'LOG-001',
      timestamp: '2024-03-15 10:30:25',
      user: 'Priya Sharma',
      action: 'CLAIM_APPROVED',
      resource: 'FRA-2024-0001',
      ipAddress: '192.168.1.105',
      details: 'Approved claim after field verification'
    },
    {
      id: 'LOG-002',
      timestamp: '2024-03-15 09:45:12',
      user: 'Vikram Singh',
      action: 'DOCUMENT_UPLOADED',
      resource: 'FRA-2024-0003',
      ipAddress: '192.168.1.108',
      details: 'Uploaded field survey report'
    },
    {
      id: 'LOG-003',
      timestamp: '2024-03-15 08:15:33',
      user: 'System',
      action: 'AI_ANALYSIS_COMPLETED',
      resource: 'FRA-2024-0005',
      ipAddress: '127.0.0.1',
      details: 'AI analysis completed with 92% confidence'
    },
    {
      id: 'LOG-004',
      timestamp: '2024-03-14 16:20:18',
      user: 'Ravi Patel',
      action: 'CLAIM_SUBMITTED',
      resource: 'FRA-2024-0006',
      ipAddress: '203.142.55.67',
      details: 'New claim submitted via NGO portal'
    }
  ];
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'mota_admin': return 'destructive';
      case 'district_officer': return 'default';
      case 'forest_revenue_officer': return 'secondary';
      case 'pda_planner': return 'outline';
      case 'ngo_user': return 'secondary';
      case 'citizen_user': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'secondary';
      case 'inactive': return 'destructive';
      case 'suspended': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">System Administration</h1>
        <p className="text-muted-foreground">
          Manage users, system settings, and monitor platform activity
        </p>
      </div>
      {/* ELI5 Mode */}
      {eli5Mode && (
        <Alert className="eli5-mode">
          <HelpCircle className="h-4 w-4" />
          <AlertDescription>
            This is the control panel for the entire system. Only top administrators can see this. 
            Here you can add new users, change settings, and check what people are doing in the system.
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{users.length}</div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">
                {users.filter(u => u.status === 'active').length}
              </div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>
          </CardContent>
        </Card>
         <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">24</div>
              <div className="text-sm text-muted-foreground">Districts Connected</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">99.2%</div>
              <div className="text-sm text-muted-foreground">System Uptime</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="settings">System Settings</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>
{/* User Management */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Manage system users, roles, and permissions
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>District</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Claims Handled</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleColor(user.role)}>
                            {user.role.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.district || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(user.status)}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.lastLogin}</TableCell>
                        <TableCell>{user.claimsHandled}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button variant="outline" size="sm">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* System Settings */}
        <TabsContent value="settings" className="space-y-6">
          {systemSettings.map((category) => (
            <Card key={category.category}>
              <CardHeader>
                <CardTitle>{category.category} Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {category.settings.map((setting) => (
                  <div key={setting.key} className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">{setting.label}</Label>
                    </div>
                    <div className="w-32">
                      {setting.type === 'boolean' ? (
                        <Badge variant={setting.value ? 'secondary' : 'outline'}>
                          {setting.value ? 'Enabled' : 'Disabled'}
                        </Badge>
                      ) : (
                        <Input
                          type="number"
                          value={setting.value as number}
                          className="text-right"
                          readOnly
                        />
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
                    <div className="flex justify-end">
            <Button>Save Settings</Button>
          </div>
        </TabsContent>

        {/* Data Management */}
        <TabsContent value="data" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5" />
                  <span>Data Import</span>
                </CardTitle>
                <CardDescription>
                  Import bulk data from external sources
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Button variant="outline" className="justify-start">
                    <Database className="mr-2 h-4 w-4" />
                    Import Claims Data
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Users className="mr-2 h-4 w-4" />
                    Import User Data
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Upload className="mr-2 h-4 w-4" />
                    Import Geospatial Data
                  </Button>
                </div>
              </CardContent>
            </Card>
<Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download className="h-5 w-5" />
                  <span>Data Export</span>
                </CardTitle>
                <CardDescription>
                  Export system data for backup or analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Button variant="outline" className="justify-start">
                    <Download className="mr-2 h-4 w-4" />
                    Export All Claims
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Download className="mr-2 h-4 w-4" />
                    Export User Activity
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Download className="mr-2 h-4 w-4" />
                    Export System Logs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
<Card>
            <CardHeader>
              <CardTitle>Database Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold">2,847</div>
                  <div className="text-sm text-muted-foreground">Total Claims</div>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold">15,432</div>
                  <div className="text-sm text-muted-foreground">Documents</div>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold">892</div>
                  <div className="text-sm text-muted-foreground">Users</div>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold">2.4GB</div>
                  <div className="text-sm text-muted-foreground">Storage Used</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Audit Logs */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>System Audit Logs</span>
              </CardTitle>
              <CardDescription>
                Complete record of all system activities and user actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs">
                          {log.timestamp}
                        </TableCell>
                        <TableCell>{log.user}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.action}</Badge>
                        </TableCell>
                        <TableCell>{log.resource}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.ipAddress}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {log.details}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing 4 of 1,247 total entries
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">Previous</Button>
                  <Button variant="outline" size="sm">Next</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>System Health</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-lg font-bold text-success">Operational</div>
              <div className="text-sm text-muted-foreground">API Status</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-lg font-bold text-success">Healthy</div>
              <div className="text-sm text-muted-foreground">Database</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-lg font-bold text-success">Online</div>
              <div className="text-sm text-muted-foreground">AI Services</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-lg font-bold text-warning">Degraded</div>
              <div className="text-sm text-muted-foreground">Map Tiles</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default Admin;