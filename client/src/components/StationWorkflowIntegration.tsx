import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  Users, 
  Activity, 
  FileText, 
  Award,
  Bell,
  RefreshCw,
  Heart,
  Eye,
  Stethoscope,
  ClipboardCheck,
  Send,
  UserCheck,
  Timer,
  Flag
} from 'lucide-react';

// Enhanced Station Workflow Manager with Real Integration
export default function StationWorkflowIntegration() {
  const [currentPatients, setCurrentPatients] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stationStatus, setStationStatus] = useState({});
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Initialize with mock data that simulates real workflow
  useEffect(() => {
    // Mock patients in different workflow stages
    setCurrentPatients([
      {
        id: 'patient_001',
        name: 'Eric Mukhela',
        idNumber: '8903030050109',
        company: 'Wolf Wadley',
        position: 'GM',
        examination_type: 'periodical',
        currentStation: 'questionnaire',
        startTime: new Date(Date.now() - 600000), // 10 minutes ago
        questionnaire: {
          status: 'in_progress',
          completion: 85,
          medical_alerts: ['family_diabetes_history'],
          lastSaved: new Date(Date.now() - 60000)
        }
      },
      {
        id: 'patient_002', 
        name: 'John Smith',
        idNumber: '9001015009087',
        company: 'ABC Mining Corp',
        position: 'Equipment Operator',
        examination_type: 'pre_employment',
        currentStation: 'vitals',
        startTime: new Date(Date.now() - 1800000), // 30 minutes ago
        questionnaire: {
          status: 'completed',
          completion: 100,
          medical_alerts: ['heart_disease_high_bp', 'epilepsy_convulsions'],
          completedAt: new Date(Date.now() - 900000)
        },
        vitals: {
          status: 'in_progress',
          startTime: new Date(Date.now() - 300000)
        }
      },
      {
        id: 'patient_003',
        name: 'Sarah Johnson', 
        idNumber: '8512030234088',
        company: 'Mining Solutions Ltd',
        position: 'Safety Officer',
        examination_type: 'working_at_heights',
        currentStation: 'tests',
        startTime: new Date(Date.now() - 3600000), // 1 hour ago
        questionnaire: {
          status: 'completed',
          completion: 100,
          medical_alerts: ['fear_of_heights'],
          completedAt: new Date(Date.now() - 2400000)
        },
        vitals: {
          status: 'completed',
          completedAt: new Date(Date.now() - 1800000)
        },
        tests: {
          status: 'in_progress',
          startTime: new Date(Date.now() - 600000)
        }
      }
    ]);

    // Mock notifications
    setNotifications([
      {
        id: 'notif_001',
        type: 'questionnaire_complete',
        patient: 'John Smith',
        message: 'Questionnaire completed - Ready for vitals',
        priority: 'high',
        timestamp: new Date(Date.now() - 300000),
        read: false,
        medicalAlerts: ['heart_disease_high_bp']
      },
      {
        id: 'notif_002',
        type: 'medical_alert',
        patient: 'Eric Mukhela',
        message: 'Medical alert: Family history of diabetes detected',
        priority: 'medium',
        timestamp: new Date(Date.now() - 120000),
        read: false
      }
    ]);

    // Mock station status
    setStationStatus({
      questionnaire: { available: true, currentPatients: 1, avgTime: '12 min' },
      vitals: { available: true, currentPatients: 1, avgTime: '15 min' },
      tests: { available: true, currentPatients: 1, avgTime: '25 min' },
      review: { available: true, currentPatients: 0, avgTime: '10 min' },
      certificate: { available: true, currentPatients: 0, avgTime: '5 min' }
    });
  }, []);

  // Station configuration
  const stations = [
    {
      id: 'questionnaire',
      name: 'Questionnaire',
      icon: <FileText className="h-5 w-5" />,
      staff_role: 'reception',
      color: 'blue'
    },
    {
      id: 'vitals',
      name: 'Vital Signs',
      icon: <Heart className="h-5 w-5" />,
      staff_role: 'nurse',
      color: 'green'
    },
    {
      id: 'tests',
      name: 'Medical Tests',
      icon: <Activity className="h-5 w-5" />,
      staff_role: 'technician',
      color: 'purple'
    },
    {
      id: 'review',
      name: 'Medical Review',
      icon: <Stethoscope className="h-5 w-5" />,
      staff_role: 'doctor',
      color: 'red'
    },
    {
      id: 'certificate',
      name: 'Certificate',
      icon: <Award className="h-5 w-5" />,
      staff_role: 'admin',
      color: 'yellow'
    }
  ];

  // Handle questionnaire completion and trigger handoff
  const handleQuestionnaireComplete = useCallback(async (patientId) => {
    try {
      // Update patient status
      setCurrentPatients(prev => prev.map(patient => 
        patient.id === patientId 
          ? {
              ...patient,
              currentStation: 'vitals',
              questionnaire: {
                ...patient.questionnaire,
                status: 'completed',
                completion: 100,
                completedAt: new Date()
              }
            }
          : patient
      ));

      // Create handoff notification
      const patient = currentPatients.find(p => p.id === patientId);
      const newNotification = {
        id: `notif_${Date.now()}`,
        type: 'handoff',
        patient: patient?.name || 'Unknown',
        message: `${patient?.name} completed questionnaire - Ready for vitals`,
        priority: patient?.questionnaire?.medical_alerts?.length > 0 ? 'high' : 'normal',
        timestamp: new Date(),
        read: false,
        medicalAlerts: patient?.questionnaire?.medical_alerts || [],
        handoffData: {
          fromStation: 'questionnaire',
          toStation: 'vitals',
          estimatedTime: '15 minutes',
          specialInstructions: getSpecialInstructions(patient?.questionnaire?.medical_alerts)
        }
      };

      setNotifications(prev => [newNotification, ...prev]);

      // Simulate API call for notification
      console.log('🔔 Handoff notification sent:', newNotification);
      
      return { success: true };
    } catch (error) {
      console.error('Handoff failed:', error);
      return { success: false, error: error.message };
    }
  }, [currentPatients]);

  // Get special instructions based on medical alerts
  const getSpecialInstructions = (medicalAlerts = []) => {
    const instructions = [];
    if (medicalAlerts.includes('heart_disease_high_bp')) {
      instructions.push('Monitor blood pressure carefully');
    }
    if (medicalAlerts.includes('family_diabetes_history')) {
      instructions.push('Check blood glucose levels');
    }
    if (medicalAlerts.includes('epilepsy_convulsions')) {
      instructions.push('Note seizure history in vitals');
    }
    if (medicalAlerts.includes('fear_of_heights')) {
      instructions.push('Height work assessment required');
    }
    return instructions.join('; ');
  };

  // Mark notification as read
  const markNotificationRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
  };

  // Get status color for stations
  const getStationColor = (stationId) => {
    const station = stations.find(s => s.id === stationId);
    return station?.color || 'gray';
  };

  // Calculate time since start
  const getTimeSince = (startTime) => {
    const diff = Date.now() - startTime.getTime();
    const minutes = Math.floor(diff / 60000);
    return `${minutes} min`;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Station Workflow Manager</h1>
          <p className="text-gray-600">Real-time patient flow and handoff coordination</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="px-3 py-1">
            {currentPatients.length} Active Patients
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            {notifications.filter(n => !n.read).length} Unread Notifications
          </Badge>
        </div>
      </div>

      {/* Real-time Notifications Panel */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-500" />
            Live Notifications & Handoffs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {notifications.slice(0, 5).map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  notification.read 
                    ? 'border-gray-200 bg-gray-50 opacity-60' 
                    : notification.priority === 'high'
                    ? 'border-red-200 bg-red-50 hover:bg-red-100'
                    : 'border-blue-200 bg-blue-50 hover:bg-blue-100'
                }`}
                onClick={() => markNotificationRead(notification.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      notification.priority === 'high' ? 'bg-red-500' : 'bg-blue-500'
                    }`}></div>
                    <div>
                      <p className="font-medium text-sm">{notification.message}</p>
                      <p className="text-xs text-gray-600">
                        {notification.timestamp.toLocaleTimeString()} - {notification.patient}
                      </p>
                      {notification.medicalAlerts && notification.medicalAlerts.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {notification.medicalAlerts.map((alert, idx) => (
                            <Badge key={idx} variant="destructive" className="text-xs">
                              {alert.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant={notification.priority === 'high' ? 'destructive' : 'default'}>
                    {notification.priority}
                  </Badge>
                </div>
                
                {notification.handoffData && !notification.read && (
                  <div className="mt-3 p-3 bg-white rounded border">
                    <p className="text-xs font-medium">Handoff Details:</p>
                    <p className="text-xs text-gray-600">{notification.handoffData.specialInstructions}</p>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        View Patient
                      </Button>
                      <Button size="sm" className="h-7 text-xs">
                        Acknowledge
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Station Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Station Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {stations.map((station) => {
              const status = stationStatus[station.id] || {};
              return (
                <div key={station.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {station.icon}
                      <span className="font-medium text-sm">{station.name}</span>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      status.available ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active:</span>
                      <span className="font-medium">{status.currentPatients || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Time:</span>
                      <span className="font-medium">{status.avgTime || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Staff:</span>
                      <span className="font-medium">{station.staff_role}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Active Patients Flow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Patient Flow - Real Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentPatients.map((patient) => (
              <div key={patient.id} className="p-4 border rounded-lg bg-gradient-to-r from-white to-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {patient.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="font-semibold">{patient.name}</h4>
                      <p className="text-sm text-gray-600">{patient.company} - {patient.position}</p>
                      <p className="text-xs text-gray-500">Started {getTimeSince(patient.startTime)} ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`bg-${getStationColor(patient.currentStation)}-100 text-${getStationColor(patient.currentStation)}-800`}>
                      {patient.currentStation.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline">
                      {patient.examination_type.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                {/* Patient Progress Flow */}
                <div className="flex items-center gap-2 mb-3">
                  {stations.map((station, index) => {
                    const isActive = patient.currentStation === station.id;
                    const isCompleted = stations.findIndex(s => s.id === patient.currentStation) > index;
                    
                    return (
                      <React.Fragment key={station.id}>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
                          isActive ? `bg-${station.color}-100 text-${station.color}-800 font-medium` :
                          isCompleted ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {station.icon}
                          <span>{station.name}</span>
                          {isCompleted && <CheckCircle className="h-3 w-3" />}
                          {isActive && <Clock className="h-3 w-3" />}
                        </div>
                        {index < stations.length - 1 && (
                          <ArrowRight className={`h-4 w-4 ${
                            isCompleted ? 'text-green-500' : 'text-gray-300'
                          }`} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Medical Alerts */}
                {patient.questionnaire?.medical_alerts && patient.questionnaire.medical_alerts.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Flag className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium text-orange-800">Medical Alerts:</span>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {patient.questionnaire.medical_alerts.map((alert, idx) => (
                        <Badge key={idx} variant="destructive" className="text-xs">
                          {alert.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setSelectedPatient(patient)}
                  >
                    View Details
                  </Button>
                  
                  {patient.currentStation === 'questionnaire' && patient.questionnaire?.completion === 100 && (
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleQuestionnaireComplete(patient.id)}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Complete Handoff
                    </Button>
                  )}
                  
                  {patient.currentStation === 'questionnaire' && patient.questionnaire?.completion < 100 && (
                    <Badge variant="outline" className="px-2 py-1">
                      {patient.questionnaire.completion}% Complete
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Integration Testing Panel */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-green-500" />
            Integration Testing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Test Questionnaire Completion</h4>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input placeholder="Patient ID" className="flex-1" />
                  <Button variant="outline">Load Patient</Button>
                </div>
                <Button 
                  className="w-full"
                  onClick={() => {
                    // Simulate completing questionnaire for Eric Mukhela
                    handleQuestionnaireComplete('patient_001');
                  }}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Simulate Questionnaire Complete
                </Button>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Workflow Metrics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Avg Questionnaire Time:</span>
                  <span className="font-medium">12 min</span>
                </div>
                <div className="flex justify-between">
                  <span>Handoff Success Rate:</span>
                  <span className="font-medium text-green-600">98%</span>
                </div>
                <div className="flex justify-between">
                  <span>Medical Alerts Today:</span>
                  <span className="font-medium text-orange-600">7</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Throughput:</span>
                  <span className="font-medium">24 patients</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}