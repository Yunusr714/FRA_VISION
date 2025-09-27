import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Download, 
  MapPin, 
  Calendar,
  User,
  FileText,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  HelpCircle
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';

const ClaimDetail = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const { eli5Mode } = useAppStore();

  // Sample claim data
  const claim = {
    id: 'FRA-2024-0001',
    claimant: 'Ravi Meena',
    village: 'Kherwara',
    district: 'Dungarpur',
    state: 'Rajasthan',
    area: 2.5,
    status: 'approved',
    submittedDate: '2024-01-15',
    lastUpdate: '2024-02-20',
    assignedOfficer: 'Priya Sharma',
    coordinates: [73.7, 24.6],
    documents: [
      { name: 'Identity Proof', status: 'verified', uploadDate: '2024-01-15' },
      { name: 'Residence Proof', status: 'verified', uploadDate: '2024-01-15' },
      { name: 'Land Survey Map', status: 'verified', uploadDate: '2024-01-18' },
      { name: 'Community Certificate', status: 'pending', uploadDate: '2024-01-20' }
    ],
    timeline: [
      { date: '2024-01-15', event: 'Claim submitted', actor: 'Ravi Meena' },
      { date: '2024-01-18', event: 'Initial review completed', actor: 'System' },
      { date: '2024-01-20', event: 'Assigned for field verification', actor: 'Priya Sharma' },
      { date: '2024-02-05', event: 'Field survey completed', actor: 'Vikram Singh' },
      { date: '2024-02-20', event: 'Claim approved', actor: 'Priya Sharma' }
    ],
    aiAnalysis: {
      approvalProbability: 85,
      riskScore: 'Low',
      reasons: [
        'Clear documentation provided',
        'No boundary overlaps detected',
        'Valid traditional usage evidence'
      ],
      recommendedActions: [
        'Approve claim',
        'Generate blockchain certificate'
      ]
    },
    blockchainHash: '0x7d4f...8a9c',
    passbook: {
      issued: true,
      issuedDate: '2024-02-20',
      qrCode: 'https://fra.gov.in/verify/FRA-2024-0001'
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      approved: { variant: 'secondary', className: 'bg-success/10 text-success' },
      pending: { variant: 'destructive' },
      'under-verification': { variant: 'default' },
      rejected: { variant: 'destructive' },
      fraud: { variant: 'destructive', className: 'bg-fraud/10 text-fraud' }
    };
    
    return variants[status] || { variant: 'outline' };
  };
  const canApprove = user?.role === 'district_officer' || user?.role === 'mota_admin';
  const canEdit = user?.role === 'district_officer' || user?.role === 'forest_revenue_officer';

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
            <h1 className="text-3xl font-bold">{claim.id}</h1>
            <p className="text-muted-foreground">
              Forest Rights Claim Details
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {claim.passbook.issued && (
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Forever Passbook
            </Button>
          )}
          {canEdit && (
            <Button>
              Edit Claim
            </Button>
          )}
        </div>
      </div>
      {/* ELI5 Mode */}
      {eli5Mode && (
        <Alert className="eli5-mode">
          <HelpCircle className="h-4 w-4" />
          <AlertDescription>
            This page shows all details about one forest rights request. You can see who asked for it, 
            where the land is, and what happened to the request.
          </AlertDescription>
        </Alert>
      )}
 {/* Status and Basic Info */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Status
              <Badge 
                variant={getStatusBadge(claim.status).variant}
                className={getStatusBadge(claim.status).className}
              >
                {claim.status.replace('-', ' ')}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Submitted: {claim.submittedDate}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Last Update: {claim.lastUpdate}</span>
              </div>
              {claim.status === 'approved' && (
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-success" />
                  <span className="text-sm text-success">Blockchain Secured</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Claimant Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <div className="font-medium">{claim.claimant}</div>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{claim.village}, {claim.district}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Area Claimed: {claim.area} hectares
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>AI Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Approval Probability</span>
                <span className="font-bold text-success">{claim.aiAnalysis.approvalProbability}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Risk Score</span>
                <Badge variant="outline">{claim.aiAnalysis.riskScore}</Badge>
              </div>
              {eli5Mode && (
                <div className="text-xs text-muted-foreground">
                  AI thinks this claim has a good chance of being approved because the documents are complete.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
       {/* Detailed Information Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
          {claim.status === 'approved' && (
            <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Claim Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Tracking ID</div>
                    <div className="font-medium">{claim.id}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Claimant</div>
                    <div className="font-medium">{claim.claimant}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Village</div>
                    <div className="font-medium">{claim.village}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">District</div>
                    <div className="font-medium">{claim.district}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">State</div>
                    <div className="font-medium">{claim.state}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Area</div>
                    <div className="font-medium">{claim.area} hectares</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Assignment & Processing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Assigned Officer</div>
                    <div className="font-medium">{claim.assignedOfficer}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Submitted Date</div>
                    <div className="font-medium">{claim.submittedDate}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Last Updated</div>
                    <div className="font-medium">{claim.lastUpdate}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Coordinates</div>
                    <div className="font-medium">{claim.coordinates.join(', ')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Verification</CardTitle>
              <CardDescription>
                Status of all submitted documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {claim.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{doc.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Uploaded: {doc.uploadDate}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={doc.status === 'verified' ? 'secondary' : 'destructive'}
                        className={doc.status === 'verified' ? 'bg-success/10 text-success' : ''}
                      >
                        {doc.status === 'verified' ? (
                          <CheckCircle className="mr-1 h-3 w-3" />
                        ) : (
                          <Clock className="mr-1 h-3 w-3" />
                        )}
                        {doc.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
                 </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Processing Timeline</CardTitle>
              <CardDescription>
                Complete history of claim processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {claim.timeline.map((event, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{event.event}</div>
                        <div className="text-sm text-muted-foreground">{event.date}</div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        by {event.actor}
                      </div>
                    </div>
                  </div>
                ))}
                </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Analysis Report</CardTitle>
              <CardDescription>
                Automated assessment and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Approval Probability</div>
                  <div className="text-3xl font-bold text-success">
                    {claim.aiAnalysis.approvalProbability}%
                  </div>
                </div>
                <div>
                    <div className="text-sm text-muted-foreground mb-2">Risk Assessment</div>
                  <Badge variant="outline" className="text-lg">
                    {claim.aiAnalysis.riskScore} Risk
                  </Badge>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-2">Key Reasons</div>
                <ul className="space-y-1">
                  {claim.aiAnalysis.reasons.map((reason, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm">{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="text-sm font-medium mb-2">Recommended Actions</div>
                <div className="space-y-2">
                  {claim.aiAnalysis.recommendedActions.map((action, index) => (
                    <Button key={index} variant="outline" size="sm" className="mr-2">
                      {action}
                    </Button>
                  ))}
                  </div>
              </div>

              {eli5Mode && (
                <Alert className="eli5-mode">
                  <HelpCircle className="h-4 w-4" />
                  <AlertDescription>
                    The computer looked at this claim and thinks it should be approved because 
                    all the papers are correct and there are no problems with the land location.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {claim.status === 'approved' && (
          <TabsContent value="blockchain" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Blockchain Certificate</CardTitle>
                <CardDescription>
                  Immutable proof of land rights
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="w-32 h-32 bg-muted rounded-lg mx-auto flex items-center justify-center">
                    <div className="text-center">
                      <Shield className="h-8 w-8 text-success mx-auto mb-2" />
                      <div className="text-xs">QR Code</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground">Blockchain Hash</div>
                    <div className="font-mono text-sm bg-muted p-2 rounded">
                      {claim.blockchainHash}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Forever Passbook</div>
                    <div className="text-sm">
                      Issued on {claim.passbook.issuedDate}
                    </div>
                  </div>

                  <Button className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download Digital Certificate
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Action Buttons */}
      {canApprove && claim.status === 'pending' && (
        <Card>
          <CardHeader>
            <CardTitle>Officer Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Button className="bg-success hover:bg-success/90">
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve Claim
              </Button>
              <Button variant="destructive">
                <XCircle className="mr-2 h-4 w-4" />
                Reject Claim
              </Button>
              <Button variant="outline">
                Request More Documents
              </Button>
              <Button variant="outline">
                Assign Field Survey
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClaimDetail;