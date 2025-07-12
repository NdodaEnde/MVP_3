// src/components/dashboard/RealTimeWorkflowDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/useToast';
import {
  Activity, Users, Clock, AlertTriangle, CheckCircle, TrendingUp,
  Monitor, Bell, RefreshCw, MapPin, Zap, Eye, Volume2, Stethoscope,
  Heart, BarChart3, PieChart, Calendar, Filter, Download, Settings
} from 'lucide-react';

// 🔧 Interface Types
interface WorkflowMetrics {
  totalPatients: number;
  inProgress: number;
  completed: number;
  averageFlowTime: number;
  bottleneckStation: string;
  throughputRate: number;
  staffUtilization: number;
  patientSatisfaction: number;
}

interface StationStatus {
  id: string;
  name: string;
  currentQueue: number;
  maxCapacity: number;
  staffOnDuty: number;
  averageServiceTime: number;
  utilizationRate: number;
  waitTime: number;
  status: 'optimal' | 'busy' | 'bottleneck' | 'offline';
  alerts: Alert[];
  throughputToday: number;
}

interface PatientFlow {
  id: string;
  name: string;
  currentStation: string;
  timeInStation: number;
  totalFlowTime: number;
  completedStations: string[];
  nextStation: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  medicalFlags: string[];
  estimatedCompletion: number;
}

interface Alert {
  id: string;
  type: 'bottleneck' | 'medical' | 'system' | 'staff';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  stationId?: string;
  patientId?: string;
  timestamp: string;
  acknowledged: boolean;
}

// 🖥️ Real-time Workflow Dashboard
export const RealTimeWorkflowDashboard: React.FC = () => {
  // 📊 State Management
  const [metrics, setMetrics] = useState<WorkflowMetrics | null>(null);
  const [stations, setStations] = useState<StationStatus[]>([]);
  const [patientFlows, setPatientFlows] = useState<PatientFlow[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '4h' | '1d' | '1w'>('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');

  const { toast } = useToast();

  // 🔄 Real-time Data Loading
  useEffect(() => {
    initializeRealTimeConnection();
    loadDashboardData();

    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadDashboardData, 15000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, selectedTimeRange]);

  // 🌐 WebSocket Connection for Real-time Updates
  const initializeRealTimeConnection = useCallback(() => {
    const ws = new WebSocket(process.env.REACT_APP_WS_URL || 'ws://localhost:3001');

    ws.onopen = () => {
      setConnectionStatus('connected');
      console.log('Real-time dashboard connection established');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleRealTimeUpdate(data);
    };

    ws.onclose = () => {
      setConnectionStatus('disconnected');
      setTimeout(initializeRealTimeConnection, 5000); // Reconnect after 5 seconds
    };

    ws.onerror = () => {
      setConnectionStatus('disconnected');
    };
  }, []);

  // 📊 Load Dashboard Data
  const loadDashboardData = async () => {
    try {
      const [metricsRes, stationsRes, flowsRes, alertsRes] = await Promise.all([
        fetch(`/api/dashboard/metrics?range=${selectedTimeRange}`),
        fetch('/api/dashboard/stations'),
        fetch('/api/dashboard/patient-flows'),
        fetch('/api/dashboard/alerts')
      ]);

      const [metricsData, stationsData, flowsData, alertsData] = await Promise.all([
        metricsRes.json(),
        stationsRes.json(),
        flowsRes.json(),
        alertsRes.json()
      ]);

      setMetrics(metricsData);
      setStations(stationsData);
      setPatientFlows(flowsData);
      setAlerts(alertsData.filter((alert: Alert) => !alert.acknowledged));

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: "Data Load Failed",
        description: "Unable to refresh dashboard data. Retrying...",
        variant: "destructive",
      });
    }
  };

  // 🔄 Handle Real-time Updates
  const handleRealTimeUpdate = (data: any) => {
    switch (data.type) {
      case 'station_update':
        setStations(prev => prev.map(station => 
          station.id === data.payload.stationId 
            ? { ...station, ...data.payload }
            : station
        ));
        break;

      case 'patient_movement':
        setPatientFlows(prev => prev.map(flow => 
          flow.id === data.payload.patientId
            ? { ...flow, currentStation: data.payload.newStation, timeInStation: 0 }
            : flow
        ));
        break;

      case 'new_alert':
        setAlerts(prev => [...prev, data.payload]);
        toast({
          title: `${data.payload.severity.toUpperCase()} Alert`,
          description: data.payload.message,
          variant: data.payload.severity === 'critical' ? 'destructive' : 'default',
        });
        break;

      case 'metrics_update':
        setMetrics(prev => ({ ...prev, ...data.payload }));
        break;
    }
  };

  // 🚨 Alert Management
  const acknowledgeAlert = async (alertId: string) => {
    try {
      await fetch(`/api/alerts/${alertId}/acknowledge`, { method: 'POST' });
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const getStationIcon = (stationId: string) => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      nursing: Stethoscope,
      vision_testing: Eye,
      audio_testing: Volume2,
      ecg: Heart,
      lung_function: Activity,
      questionnaire: Monitor
    };
    return iconMap[stationId] || MapPin;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* 📊 Dashboard Header */}
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Workflow Command Center</h1>
                <p className="text-blue-100">Real-time monitoring and optimization dashboard</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <Badge variant="secondary" className={`${
                  connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
                  connectionStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    connectionStatus === 'connected' ? 'bg-green-500' :
                    connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  {connectionStatus}
                </Badge>
                
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                  {autoRefresh ? 'Auto' : 'Manual'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 🚨 Critical Alerts */}
        {alerts.filter(a => a.severity === 'critical').length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="text-red-800">Critical Alerts Require Attention</AlertTitle>
            <AlertDescription className="text-red-700">
              <div className="space-y-2 mt-2">
                {alerts.filter(a => a.severity === 'critical').map(alert => (
                  <div key={alert.id} className="flex items-center justify-between p-2 bg-red-100 rounded">
                    <span>{alert.message}</span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => acknowledgeAlert(alert.id)}
                    >
                      Acknowledge
                    </Button>
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* 📊 Key Metrics Overview */}
        {metrics && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Patients"
              value={metrics.totalPatients}
              subtitle="Today"
              icon={Users}
              trend={+12}
              color="blue"
            />
            <MetricCard
              title="In Progress"
              value={metrics.inProgress}
              subtitle="Active now"
              icon={Activity}
              trend={-2}
              color="yellow"
            />
            <MetricCard
              title="Completed"
              value={metrics.completed}
              subtitle="Finished today"
              icon={CheckCircle}
              trend={+8}
              color="green"
            />
            <MetricCard
              title="Avg Flow Time"
              value={`${metrics.averageFlowTime}m`}
              subtitle="End-to-end"
              icon={Clock}
              trend={-15}
              color="purple"
            />
          </div>
        )}

        {/* 📱 Main Dashboard Tabs */}
        <Tabs defaultValue="live" className="space-y-6">
          
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="live" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Live Flow
            </TabsTrigger>
            <TabsTrigger value="stations" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Station Status
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Alerts ({alerts.length})
            </TabsTrigger>
          </TabsList>

          {/* 🔴 Live Patient Flow Tab */}
          <TabsContent value="live" className="space-y-6">
            <LivePatientFlow flows={patientFlows} getStationIcon={getStationIcon} />
          </TabsContent>

          {/* 🏥 Station Status Tab */}
          <TabsContent value="stations" className="space-y-6">
            <StationStatusGrid stations={stations} getStationIcon={getStationIcon} />
          </TabsContent>

          {/* 📊 Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsOverview 
              metrics={metrics} 
              stations={stations}
              timeRange={selectedTimeRange}
              onTimeRangeChange={setSelectedTimeRange}
            />
          </TabsContent>

          {/* 🚨 Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <AlertsManagement alerts={alerts} onAcknowledge={acknowledgeAlert} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// 📊 Metric Card Component
const MetricCard: React.FC<{
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: number;
  color: 'blue' | 'yellow' | 'green' | 'purple';
}> = ({ title, value, subtitle, icon: Icon, trend, color }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    yellow: 'from-yellow-500 to-yellow-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600'
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-bold">{value}</p>
              {trend !== undefined && (
                <Badge variant={trend >= 0 ? "default" : "secondary"} className="text-xs">
                  {trend >= 0 ? '+' : ''}{trend}%
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
          <div className={`p-3 rounded-lg bg-gradient-to-br ${colorClasses[color]}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// 🔴 Live Patient Flow Component
const LivePatientFlow: React.FC<{
  flows: PatientFlow[];
  getStationIcon: (stationId: string) => React.ComponentType<{ className?: string }>;
}> = ({ flows, getStationIcon }) => {
  const sortedFlows = flows.sort((a, b) => {
    const priorityWeights = { urgent: 4, high: 3, medium: 2, low: 1 };
    return priorityWeights[b.priority] - priorityWeights[a.priority];
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Live Patient Flow ({flows.length} active)
        </CardTitle>
        <CardDescription>
          Real-time tracking of all patients currently in the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedFlows.map((flow) => {
            const CurrentStationIcon = getStationIcon(flow.currentStation);
            const NextStationIcon = getStationIcon(flow.nextStation);
            
            return (
              <div key={flow.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Badge variant={
                      flow.priority === 'urgent' ? 'destructive' :
                      flow.priority === 'high' ? 'default' :
                      'outline'
                    }>
                      {flow.priority}
                    </Badge>
                    {flow.medicalFlags.length > 0 && (
                      <Badge variant="destructive">
                        {flow.medicalFlags.length} Alert{flow.medicalFlags.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  
                  <div>
                    <div className="font-medium">{flow.name}</div>
                    <div className="text-sm text-gray-500">
                      Total time: {Math.floor(flow.totalFlowTime / 60)}h {flow.totalFlowTime % 60}m
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="flex items-center space-x-2 mb-1">
                      <CurrentStationIcon className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium capitalize">
                        {flow.currentStation.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {flow.timeInStation}m in station
                    </div>
                  </div>
                  
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                  
                  <div className="text-center">
                    <div className="flex items-center space-x-2 mb-1">
                      <NextStationIcon className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium capitalize">
                        {flow.nextStation.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      ETA: {flow.estimatedCompletion}m
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {flow.completedStations.length}/6 stations
                  </div>
                  <Progress 
                    value={(flow.completedStations.length / 6) * 100} 
                    className="w-20 h-2 mt-1"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// 🏥 Station Status Grid Component
const StationStatusGrid: React.FC<{
  stations: StationStatus[];
  getStationIcon: (stationId: string) => React.ComponentType<{ className?: string }>;
}> = ({ stations, getStationIcon }) => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {stations.map((station) => {
        const Icon = getStationIcon(station.id);
        const statusColor = {
          optimal: 'from-green-500 to-green-600',
          busy: 'from-yellow-500 to-yellow-600',
          bottleneck: 'from-red-500 to-red-600',
          offline: 'from-gray-400 to-gray-500'
        };

        return (
          <Card key={station.id} className="relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${statusColor[station.status]}`}></div>
            
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{station.name}</CardTitle>
                    <Badge variant={
                      station.status === 'optimal' ? 'default' :
                      station.status === 'busy' ? 'secondary' :
                      station.status === 'bottleneck' ? 'destructive' : 'outline'
                    }>
                      {station.status}
                    </Badge>
                  </div>
                </div>
                
                {station.alerts.length > 0 && (
                  <Badge variant="destructive">
                    {station.alerts.length}
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Queue Status */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Current Queue</span>
                  <span className="text-sm font-medium">
                    {station.currentQueue}/{station.maxCapacity}
                  </span>
                </div>
                <Progress 
                  value={(station.currentQueue / station.maxCapacity) * 100}
                  className="h-2"
                />
              </div>
              
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Wait Time</div>
                  <div className="font-semibold">{station.waitTime}m</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Staff On Duty</div>
                  <div className="font-semibold">{station.staffOnDuty}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Utilization</div>
                  <div className="font-semibold">{station.utilizationRate}%</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Throughput</div>
                  <div className="font-semibold">{station.throughputToday}</div>
                </div>
              </div>
              
              {/* Service Time */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Avg Service Time</span>
                  <span className="text-xs font-medium">{station.averageServiceTime}m</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

// 📊 Analytics Overview Component
const AnalyticsOverview: React.FC<{
  metrics: WorkflowMetrics | null;
  stations: StationStatus[];
  timeRange: string;
  onTimeRangeChange: (range: '1h' | '4h' | '1d' | '1w') => void;
}> = ({ metrics, stations, timeRange, onTimeRangeChange }) => {
  const bottleneckStations = stations.filter(s => s.status === 'bottleneck');
  const totalThroughput = stations.reduce((sum, s) => sum + s.throughputToday, 0);

  return (
    <div className="space-y-6">
      
      {/* Time Range Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Analytics Overview</h3>
            <div className="flex space-x-2">
              {(['1h', '4h', '1d', '1w'] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onTimeRangeChange(range)}
                >
                  {range}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Throughput Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              System Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Patient Throughput</span>
                <span className="text-lg font-bold text-green-600">{totalThroughput}</span>
              </div>
              <div className="text-xs text-gray-500">Patients processed today</div>
            </div>
            
            {metrics && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Average Flow Time</span>
                    <span className="text-lg font-bold">{metrics.averageFlowTime}m</span>
                  </div>
                  <div className="text-xs text-gray-500">End-to-end patient journey</div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Staff Utilization</span>
                    <span className="text-lg font-bold">{metrics.staffUtilization}%</span>
                  </div>
                  <Progress value={metrics.staffUtilization} className="h-2" />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Bottleneck Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Bottleneck Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {bottleneckStations.length > 0 ? (
              bottleneckStations.map((station) => (
                <div key={station.id} className="p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-red-800">{station.name}</span>
                    <Badge variant="destructive">Bottleneck</Badge>
                  </div>
                  <div className="text-sm text-red-600">
                    Queue: {station.currentQueue}/{station.maxCapacity} • 
                    Wait: {station.waitTime}m • 
                    Utilization: {station.utilizationRate}%
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-4 text-green-600">
                <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                <div className="font-medium">No Bottlenecks Detected</div>
                <div className="text-sm text-gray-500">System running optimally</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Station Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Station Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stations.map((station) => (
              <div key={station.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="font-medium">{station.name}</div>
                  <Badge variant={
                    station.utilizationRate > 80 ? 'destructive' :
                    station.utilizationRate > 60 ? 'default' : 'secondary'
                  }>
                    {station.utilizationRate}% utilized
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-4 text-sm">
                  <div>
                    <span className="text-gray-500">Queue:</span>
                    <span className="font-medium ml-1">{station.currentQueue}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Wait:</span>
                    <span className="font-medium ml-1">{station.waitTime}m</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Throughput:</span>
                    <span className="font-medium ml-1">{station.throughputToday}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// 🚨 Alerts Management Component
const AlertsManagement: React.FC<{
  alerts: Alert[];
  onAcknowledge: (alertId: string) => void;
}> = ({ alerts, onAcknowledge }) => {
  const groupedAlerts = alerts.reduce((groups: Record<string, Alert[]>, alert) => {
    groups[alert.severity] = groups[alert.severity] || [];
    groups[alert.severity].push(alert);
    return groups;
  }, {});

  return (
    <div className="space-y-6">
      {(['critical', 'warning', 'info'] as const).map((severity) => {
        const severityAlerts = groupedAlerts[severity] || [];
        if (severityAlerts.length === 0) return null;

        const severityColors = {
          critical: 'border-red-200 bg-red-50',
          warning: 'border-yellow-200 bg-yellow-50',
          info: 'border-blue-200 bg-blue-50'
        };

        return (
          <Card key={severity} className={severityColors[severity]}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                {severity.charAt(0).toUpperCase() + severity.slice(1)} Alerts ({severityAlerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {severityAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{alert.message}</div>
                      <div className="text-sm text-gray-500">
                        {alert.stationId && `Station: ${alert.stationId} • `}
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </div>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onAcknowledge(alert.id)}
                    >
                      Acknowledge
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {alerts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">All Clear!</h3>
            <p className="text-green-600">No active alerts. System running smoothly.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RealTimeWorkflowDashboard;