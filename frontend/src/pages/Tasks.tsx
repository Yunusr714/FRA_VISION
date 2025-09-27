import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HelpCircle, CheckSquare, Clock, MapPin, User, Calendar, Filter, Route, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';

interface Task {
    id: string;
    type: string;
    title: string;
    description: string;
    claimId: string;
    claimant: string;
    village: string;
    priority: 'high' | 'medium' | 'low';
    status: 'pending' | 'in_progress' | 'completed';
    assignedDate: string;
    dueDate: string;
    estimatedTime: string;
    coordinates?: [number, number];
    distance?: string;
}

const Tasks = () => {
    const { user } = useAuthStore();
    const { eli5Mode } = useAppStore();
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');

    const getTasks = (): Task[] => {
        if (user?.role === 'district_officer') {
            return [
                {
                    id: 'TASK-001',
                    type: 'claim_review',
                    title: 'Review Claim FRA-2024-0002',
                    description: 'Initial review and document verification required',
                    claimId: 'FRA-2024-0002',
                    claimant: 'Kamla Devi',
                    village: 'Sabla',
                    priority: 'high',
                    status: 'pending',
                    assignedDate: '2024-03-01',
                    dueDate: '2024-03-05',
                    estimatedTime: '2 hours'
                },
                {
                    id: 'TASK-002',
                    type: 'field_assignment',
                    title: 'Assign Field Survey',
                    description: 'Assign field officer for land verification',
                    claimId: 'FRA-2024-0003',
                    claimant: 'Mohan Bhil',
                    village: 'Bichiwara',
                    priority: 'medium',
                    status: 'pending',
                    assignedDate: '2024-03-02',
                    dueDate: '2024-03-08',
                    estimatedTime: '30 minutes'
                },
                {
                    id: 'TASK-003',
                    type: 'approval_decision',
                    title: 'Final Approval Decision',
                    description: 'Make final decision on verified claim',
                    claimId: 'FRA-2024-0001',
                    claimant: 'Ravi Meena',
                    village: 'Kherwara',
                    priority: 'high',
                    status: 'in_progress',
                    assignedDate: '2024-02-28',
                    dueDate: '2024-03-03',
                    estimatedTime: '1 hour'
                }
            ];
        } else if (user?.role === 'forest_revenue_officer') {
            return [
                {
                    id: 'TASK-004',
                    type: 'field_survey',
                    title: 'Conduct Field Survey',
                    description: 'Visit site and verify land boundaries',
                    claimId: 'FRA-2024-0003',
                    claimant: 'Mohan Bhil',
                    village: 'Bichiwara',
                    priority: 'high',
                    status: 'pending',
                    assignedDate: '2024-03-03',
                    dueDate: '2024-03-10',
                    estimatedTime: '4 hours',
                    coordinates: [73.9, 24.7],
                    distance: '12 km'
                },
                {
                    id: 'TASK-005',
                    type: 'boundary_verification',
                    title: 'Verify Land Boundaries',
                    description: 'Check GPS coordinates and survey map',
                    claimId: 'FRA-2024-0005',
                    claimant: 'Sita Garasia',
                    village: 'Kherwara',
                    priority: 'medium',
                    status: 'in_progress',
                    assignedDate: '2024-03-01',
                    dueDate: '2024-03-07',
                    estimatedTime: '3 hours',
                    coordinates: [73.7, 24.6],
                    distance: '8 km'
                }
            ];
        }
        return [];
    };

    const tasks = getTasks();

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'destructive';
            case 'medium': return 'default';
            case 'low': return 'secondary';
            default: return 'outline';
        }
    };

    const getTaskIcon = (type: string) => {
        switch (type) {
            case 'claim_review': return CheckSquare;
            case 'field_assignment': return User;
            case 'approval_decision': return CheckSquare;
            case 'field_survey': return MapPin;
            case 'boundary_verification': return MapPin;
            default: return Clock;
        }
    };

    const getOptimizedRoute = () => {
        return {
            totalDistance: '20 km',
            estimatedTime: '6 hours',
            fuelSavings: '2.5 liters',
            taskOrder: ['TASK-005', 'TASK-004']
        };
    };

    const filteredTasks = tasks.filter(task =>
        filterStatus === 'all' || task.status === filterStatus
    );

    const route = getOptimizedRoute();

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold mb-2">My Tasks</h1>
                <p className="text-muted-foreground">
                    {user?.role === 'district_officer'
                        ? 'Claims requiring review and processing'
                        : 'Field verification and survey assignments'
                    }
                </p>
            </div>

            {/* ELI5 Mode */}
            {eli5Mode && (
                <Alert className="eli5-mode">
                    <HelpCircle className="h-4 w-4" />
                    <AlertDescription>
                        These are jobs assigned to you. Each task is about checking forest land claims.
                        Complete them by the due date to help people get their land rights.
                    </AlertDescription>
                </Alert>
            )}

            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold">{tasks.length}</div>
                        <div className="text-sm text-muted-foreground">Total Tasks</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center text-warning">
                        <div className="text-2xl font-bold">{tasks.filter(t => t.status === 'pending').length}</div>
                        <div className="text-sm text-muted-foreground">Pending</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center text-primary">
                        <div className="text-2xl font-bold">{tasks.filter(t => t.status === 'in_progress').length}</div>
                        <div className="text-sm text-muted-foreground">In Progress</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center text-destructive">
                        <div className="text-2xl font-bold">{tasks.filter(t => t.priority === 'high').length}</div>
                        <div className="text-sm text-muted-foreground">High Priority</div>
                    </CardContent>
                </Card>
            </div>

            {/* AI Optimized Route */}
            {user?.role === 'forest_revenue_officer' && tasks.some(t => t.coordinates) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Route className="h-5 w-5" />
                            <span>AI-Optimized Route</span>
                        </CardTitle>
                        <CardDescription>Optimal route for today's field visits</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                            <div className="text-center">
                                <div className="text-lg font-bold">{route.totalDistance}</div>
                                <div className="text-sm text-muted-foreground">Total Distance</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold">{route.estimatedTime}</div>
                                <div className="text-sm text-muted-foreground">Estimated Time</div>
                            </div>
                            <div className="text-center text-success">
                                <div className="text-lg font-bold">{route.fuelSavings}</div>
                                <div className="text-sm text-muted-foreground">Fuel Savings</div>
                            </div>
                            <div className="flex items-center">
                                <Button
                                    className="w-full"
                                    asChild
                                >
                                    <a
                                        href={`https://www.google.com/maps/dir/${route.taskOrder.map(id => {
                                            const t = tasks.find(task => task.id === id);
                                            return t?.coordinates?.join(',') ?? '';
                                        }).join('/')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <MapPin className="mr-2 h-4 w-4" /> Open in Maps
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Filter className="h-5 w-5" />
                        <span>Filter Tasks</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex space-x-2">
                        <Button variant={filterStatus === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilterStatus('all')}>
                            All ({tasks.length})
                        </Button>
                        <Button variant={filterStatus === 'pending' ? 'default' : 'outline'} size="sm" onClick={() => setFilterStatus('pending')}>
                            Pending ({tasks.filter(t => t.status === 'pending').length})
                        </Button>
                        <Button variant={filterStatus === 'in_progress' ? 'default' : 'outline'} size="sm" onClick={() => setFilterStatus('in_progress')}>
                            In Progress ({tasks.filter(t => t.status === 'in_progress').length})
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Task List */}
            <div className="space-y-4">
                {filteredTasks.length > 0 ? filteredTasks.map(task => {
                    const TaskIcon = getTaskIcon(task.type);
                    return (
                        <Card key={task.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3">
                                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                            <TaskIcon className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className="text-lg">{task.title}</CardTitle>
                                            <CardDescription>{task.description}</CardDescription>
                                            <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                                                <div className="flex items-center space-x-1">
                                                    <User className="h-3 w-3" />
                                                    <span>{task.claimant}</span>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <MapPin className="h-3 w-3" />
                                                    <span>{task.village}</span>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <Clock className="h-3 w-3" />
                                                    <span>{task.estimatedTime}</span>
                                                </div>
                                                {task.distance && (
                                                    <div className="flex items-center space-x-1">
                                                        <Route className="h-3 w-3" />
                                                        <span>{task.distance}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end space-y-2">
                                        <Badge variant={getPriorityColor(task.priority)}>{task.priority} priority</Badge>
                                        <div className="text-sm text-muted-foreground">Due: {task.dueDate}</div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <Badge variant="outline">{task.status.replace(/_/g, ' ')}</Badge>
                                        <span className="text-sm text-muted-foreground">Claim: {task.claimId}</span>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button asChild variant="outline" size="sm">
                                            <Link to={`/claims/${task.claimId}`}>View Claim</Link>
                                        </Button>
                                        <Button size="sm" disabled={task.status === 'completed'}>
                                            Start Task <ArrowRight className="ml-1 h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                }) : (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="font-medium mb-2">No tasks found</h3>
                            <p className="text-muted-foreground">
                                {filterStatus === 'all'
                                    ? "You don't have any tasks assigned at the moment."
                                    : `No ${filterStatus.replace('_', ' ')} tasks found.`}
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Quick Actions for District Officer */}
            {user?.role === 'district_officer' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-2 md:grid-cols-3">
                            <Button variant="outline" className="justify-start">
                                <CheckSquare className="mr-2 h-4 w-4" /> Bulk Approve Claims
                            </Button>
                            <Button variant="outline" className="justify-start">
                                <User className="mr-2 h-4 w-4" /> Assign Field Officers
                            </Button>
                            <Button variant="outline" className="justify-start">
                                <Calendar className="mr-2 h-4 w-4" /> Schedule Verification Drive
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default Tasks;
