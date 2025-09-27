import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    AlertTriangle,
    Satellite,
    TrendingUp,
    MapPin,
    Clock,
    CheckCircle,
    Eye,
    Filter,
    HelpCircle,
    Zap
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
// ...imports remain the same

const Alerts = () => {
    const { user } = useAuthStore();
    const { eli5Mode } = useAppStore();
    const [filterType, setFilterType] = useState('all');
    const [filterSeverity, setFilterSeverity] = useState('all');

    const alerts = [ /* ...your sample alerts data... */];

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'destructive';
            case 'high': return 'destructive';
            case 'medium': return 'default';
            case 'low': return 'secondary';
            default: return 'outline';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'satellite_change': return Satellite;
            case 'backlog_spike': return TrendingUp;
            case 'fraud_detection': return AlertTriangle;
            case 'processing_delay': return Clock;
            case 'policy_impact': return TrendingUp;
            default: return AlertTriangle;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'destructive';
            case 'under_investigation': return 'default';
            case 'acknowledged': return 'secondary';
            case 'monitoring': return 'outline';
            case 'resolved': return 'secondary';
            default: return 'outline';
        }
    };

    const filteredAlerts = alerts.filter(alert => {
        const typeMatch = filterType === 'all' || alert.type === filterType;
        const severityMatch = filterSeverity === 'all' || alert.severity === filterSeverity;
        return typeMatch && severityMatch;
    });

    const acknowledgeAlert = (alertId: string) => {
        console.log('Acknowledging alert:', alertId);
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold mb-2">AI & Satellite Alerts</h1>
                <p className="text-muted-foreground">
                    Real-time monitoring and automated detection of anomalies in forest rights processing
                </p>
            </div>

            {/* ELI5 Mode */}
            {eli5Mode && (
                <Alert>
                    <HelpCircle className="h-4 w-4" />
                    <AlertDescription>
                        These are warnings from our computer system and satellites. They tell us when something unusual happens with forest claims.
                    </AlertDescription>
                </Alert>
            )}

            {/* Summary Stats */}
            {/* ...Your summary cards remain unchanged... */}

            {/* Filters */}
            {/* ...Your filter cards remain unchanged... */}

            {/* Alerts List */}
            <div className="space-y-4">
                {filteredAlerts.map(alert => {
                    const TypeIcon = getTypeIcon(alert.type);

                    return (
                        <Card key={alert.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${alert.severity === 'critical' ? 'bg-destructive/10' :
                                                alert.severity === 'high' ? 'bg-warning/10' : 'bg-primary/10'
                                            }`}>
                                            <TypeIcon className={`h-5 w-5 ${alert.severity === 'critical' ? 'text-destructive' :
                                                    alert.severity === 'high' ? 'text-warning' : 'text-primary'
                                                }`} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <CardTitle className="text-lg">{alert.title}</CardTitle>
                                                <Badge variant={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                                                <Badge variant={getStatusColor(alert.status)}>{alert.status.replace('_', ' ')}</Badge>
                                            </div>
                                            <CardDescription className="mb-2">{alert.description}</CardDescription>
                                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                                <div className="flex items-center space-x-1"><MapPin className="h-3 w-3" /><span>{alert.location}</span></div>
                                                <div className="flex items-center space-x-1"><Clock className="h-3 w-3" /><span>{alert.timestamp}</span></div>
                                                <div className="flex items-center space-x-1"><Zap className="h-3 w-3" /><span>{alert.aiConfidence}% confidence</span></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Alert Details */}
                                <div className="grid gap-4 md:grid-cols-2 mb-4">
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium">Impact Details</div>
                                        <div className="text-sm text-muted-foreground">
                                            {alert.affectedClaims && <div>Affected Claims: {alert.affectedClaims.toLocaleString()}</div>}
                                            {alert.affectedArea && <div>Affected Area: {alert.affectedArea}</div>}
                                            {alert.suspiciousClaims && <div>Suspicious Claims: {alert.suspiciousClaims}</div>}
                                            {alert.averageDelay && <div>Average Delay: {alert.averageDelay}</div>}
                                            {alert.impactedClaims && <div>Impacted Claims: {alert.impactedClaims.toLocaleString()}</div>}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium">Recommended Action</div>
                                        <div className="text-sm">{alert.recommendedAction}</div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center justify-between">
                                    <div className="flex space-x-2">
                                        {alert.status === 'active' && (
                                            <Button onClick={() => acknowledgeAlert(alert.id)} size="sm">
                                                <CheckCircle className="mr-1 h-3 w-3" /> Acknowledge
                                            </Button>
                                        )}
                                        <Button variant="outline" size="sm">
                                            <Eye className="mr-1 h-3 w-3" /> Investigate
                                        </Button>
                                        {alert.coordinates && (
                                            <Button variant="outline" size="sm">
                                                <MapPin className="mr-1 h-3 w-3" /> View on Map
                                            </Button>
                                        )}
                                    </div>

                                    <Badge variant="outline" className="bg-primary/5">
                                        ID: {alert.id}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {filteredAlerts.length === 0 && (
                <Card>
                    <CardContent className="p-8 text-center">
                        <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                        <h3 className="font-medium mb-2">No alerts found</h3>
                        <p className="text-muted-foreground">No alerts match your current filter criteria.</p>
                    </CardContent>
                </Card>
            )}

            {/* Alert Analytics */}
            {/* ...Your alert analytics card remains unchanged... */}

        </div>
    );
};

export default Alerts;
