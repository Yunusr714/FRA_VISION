import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Users,
    MapPin,
    TrendingUp,
    Zap,
    Target,
    DollarSign,
    HelpCircle,
    Play,
    BarChart3,
    Calendar
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';

const Planning = () => {
    const { eli5Mode } = useAppStore();
    const [selectedDistricts, setSelectedDistricts] = useState<string[]>(['Dungarpur']);
    const [simulationParams, setSimulationParams] = useState({
        additionalOfficers: 5,
        timeFrame: 6,
        budgetAllocation: 500000,
    });

    // Sample government schemes data
    const governmentSchemes = [
        {
            id: 'MGNREGA',
            name: 'MGNREGA',
            description: 'Mahatma Gandhi National Rural Employment Guarantee Act',
            budget: 2500000,
            applicableClaims: 450,
            expectedBeneficiaries: 1200,
            implementationTime: '3-6 months',
            priority: 'high',
        },
        {
            id: 'PMAY',
            name: 'PM Awas Yojana',
            description: 'Pradhan Mantri Awas Yojana for rural housing',
            budget: 1800000,
            applicableClaims: 280,
            expectedBeneficiaries: 840,
            implementationTime: '6-12 months',
            priority: 'medium',
        },
        {
            id: 'RKVY',
            name: 'RKVY',
            description: 'Rashtriya Krishi Vikas Yojana for agricultural development',
            budget: 1200000,
            applicableClaims: 320,
            expectedBeneficiaries: 960,
            implementationTime: '4-8 months',
            priority: 'high',
        },
        {
            id: 'PMKSY',
            name: 'PM Krishi Sinchayee Yojana',
            description: 'Irrigation and water conservation scheme',
            budget: 900000,
            applicableClaims: 180,
            expectedBeneficiaries: 540,
            implementationTime: '8-12 months',
            priority: 'medium',
        },
    ];

    // AI recommendations
    const aiRecommendations = [
        {
            type: 'resource_allocation',
            title: 'Optimal Resource Allocation',
            description: 'Deploy 3 additional verification officers to Dungarpur and 2 to Banswara.',
            impact: 'Expected 25% reduction in processing backlog',
            confidence: 87,
            timeline: '2-3 months',
        },
        {
            type: 'scheme_linking',
            title: 'Priority Scheme Integration',
            description: 'Link 450 approved claims to MGNREGA for immediate livelihood impact.',
            impact: '85% of beneficiaries linked within the timeline',
            confidence: 92,
            timeline: '3-6 months',
        },
        {
            type: 'infrastructure',
            title: 'Digital Infrastructure Enhancement',
            description: 'Set up mobile verification units for remote villages.',
            impact: '40% faster verification in remote areas',
            confidence: 78,
            timeline: '4-6 months',
        },
    ];

    const runSimulation = () => {
        // Simulate AI prediction
        console.log('Running simulation with params:', simulationParams);
    };

    const generateImplementationPlan = (schemeId: string) => {
        console.log('Generating implementation plan for:', schemeId);
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold mb-2">Development Planning & Scheme Integration</h1>
                <p className="text-muted-foreground">
                    AI-powered planning tools for forest rights development and scheme integration.
                </p>
            </div>

            {/* ELI5 Mode */}
            {eli5Mode && (
                <Alert className="eli5-mode">
                    <HelpCircle className="h-4 w-4" />
                    <AlertDescription>
                        This page helps government planners decide how to use money and resources to help tribal people. It connects forest land rights with government programs for jobs, houses, and farming.
                    </AlertDescription>
                </Alert>
            )}

            {/* AI Planning Recommendations */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Zap className="h-5 w-5" />
                        <span>AI Planning Recommendations</span>
                    </CardTitle>
                    <CardDescription>
                        Machine learning analysis for optimal resource allocation and planning.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {aiRecommendations.map((rec, index) => (
                            <Card key={index} className="border-l-4 border-l-primary">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-medium mb-1">{rec.title}</h4>
                                            <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                                <div className="flex items-center space-x-1"><Target className="h-3 w-3" /><span>{rec.impact}</span></div>
                                                <div className="flex items-center space-x-1"><Calendar className="h-3 w-3" /><span>{rec.timeline}</span></div>
                                                <Badge variant="outline" className="bg-primary/10">{rec.confidence}% confidence</Badge>
                                            </div>
                                        </div>
                                        <Button size="sm">Implement</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* What-If Simulator */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <BarChart3 className="h-5 w-5" />
                        <span>What-If Scenario Simulator</span>
                    </CardTitle>
                    <CardDescription>Model different resource allocation scenarios and predict outcomes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div>
                            <Label htmlFor="officers">Additional Officers</Label>
                            <Input id="officers" type="number" value={simulationParams.additionalOfficers} onChange={(e) => setSimulationParams(prev => ({ ...prev, additionalOfficers: parseInt(e.target.value) }))} />
                        </div>
                        <div>
                            <Label htmlFor="timeframe">Time Frame (months)</Label>
                            <Input id="timeframe" type="number" value={simulationParams.timeFrame} onChange={(e) => setSimulationParams(prev => ({ ...prev, timeFrame: parseInt(e.target.value) }))} />
                        </div>
                        <div>
                            <Label htmlFor="budget">Budget Allocation (₹)</Label>
                            <Input id="budget" type="number" value={simulationParams.budgetAllocation} onChange={(e) => setSimulationParams(prev => ({ ...prev, budgetAllocation: parseInt(e.target.value) }))} />
                        </div>
                    </div>
                    <Button onClick={runSimulation} className="w-full">
                        <Play className="mr-2 h-4 w-4" />
                        Run AI Simulation
                    </Button>
                    {/* Simulation Results */}
                    <Card className="bg-muted/30">
                        <CardContent className="p-4">
                            <h4 className="font-medium mb-3">Simulation Results</h4>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-success">~35%</div>
                                    <div className="text-sm text-muted-foreground">Backlog Reduction</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-primary">~2,400</div>
                                    <div className="text-sm text-muted-foreground">Additional Approvals</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-warning">₹450</div>
                                    <div className="text-sm text-muted-foreground">Cost Per Approval</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>

            {/* Government Schemes Integration */}
            <Card>
                <CardHeader>
                    <CardTitle>Government Schemes Integration</CardTitle>
                    <CardDescription>Link approved forest rights claims with relevant government schemes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        {governmentSchemes.map((scheme) => (
                            <Card key={scheme.id} className="border">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">{scheme.name}</CardTitle>
                                        <Badge variant={scheme.priority === 'high' ? 'default' : 'secondary'}>{scheme.priority} priority</Badge>
                                    </div>
                                    <CardDescription>{scheme.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <div className="text-muted-foreground">Budget</div>
                                            <div className="flex items-center space-x-1"><DollarSign className="h-3 w-3" /><span>{(scheme.budget / 100000).toFixed(1)}L</span></div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground">Applicable Claims</div>
                                            <div className="flex items-center space-x-1"><MapPin className="h-3 w-3" /><span>{scheme.applicableClaims}</span></div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground">Beneficiaries</div>
                                            <div className="flex items-center space-x-1"><Users className="h-3 w-3" /><span>{scheme.expectedBeneficiaries.toLocaleString()}</span></div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground">Timeline</div>
                                            <div className="flex items-center space-x-1"><span>{scheme.implementationTime}</span></div>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button size="sm" onClick={() => generateImplementationPlan(scheme.id)}>Generate Plan</Button>
                                        <Button variant="outline" size="sm">View Details</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Implementation Timeline & Budget */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Implementation Timeline */}
                <Card>
                    <CardHeader>
                        <CardTitle>Implementation Timeline</CardTitle>
                        <CardDescription>Planned rollout of development initiatives.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-4 p-4 border rounded-lg">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center"><Calendar className="h-6 w-6 text-primary" /></div>
                                <div className="flex-1">
                                    <h4 className="font-medium">Q1 2024: Resource Deployment</h4>
                                    <p className="text-sm text-muted-foreground">Deploy additional verification officers and set up mobile units.</p>
                                </div>
                                <Badge variant="outline">In Progress</Badge>
                            </div>
                            <div className="flex items-center space-x-4 p-4 border rounded-lg">
                                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center"><Users className="h-6 w-6 text-secondary" /></div>
                                <div className="flex-1">
                                    <h4 className="font-medium">Q2 2024: Scheme Integration</h4>
                                    <p className="text-sm text-muted-foreground">Begin linking MGNREGA and PMAY to eligible claims.</p>
                                </div>
                                <Badge variant="secondary">Planned</Badge>
                            </div>
                            <div className="flex items-center space-x-4 p-4 border rounded-lg">
                                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center"><TrendingUp className="h-6 w-6 text-success" /></div>
                                <div className="flex-1">
                                    <h4 className="font-medium">Q3 2024: Impact Assessment</h4>
                                    <p className="text-sm text-muted-foreground">Evaluate outcomes and optimize resource allocation.</p>
                                </div>
                                <Badge variant="outline">Future</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Budget Allocation */}
                <Card>
                    <CardHeader>
                        <CardTitle>Budget Allocation Overview</CardTitle>
                        <CardDescription>Summary of financial resource allocation.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="text-center p-4 bg-primary/5 rounded-lg">
                                <div className="text-2xl font-bold">₹15.2Cr</div>
                                <div className="text-sm text-muted-foreground">Total Allocated</div>
                            </div>
                            <div className="text-center p-4 bg-success/5 rounded-lg">
                                <div className="text-2xl font-bold">₹8.7Cr</div>
                                <div className="text-sm text-muted-foreground">Utilized</div>
                            </div>
                            <div className="text-center p-4 bg-warning/5 rounded-lg">
                                <div className="text-2xl font-bold">₹6.5Cr</div>
                                <div className="text-sm text-muted-foreground">Remaining</div>
                            </div>
                            <div className="text-center p-4 bg-secondary/5 rounded-lg">
                                <div className="text-2xl font-bold">57%</div>
                                <div className="text-sm text-muted-foreground">Utilization Rate</div>
                            </div>
                        </div>
                    </CardContent>
                </Card> 
            </div>
        </div>
    );
};

export default Planning;