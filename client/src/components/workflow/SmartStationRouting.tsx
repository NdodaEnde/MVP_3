// src/components/workflow/SmartStationRouting.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/useToast';
import {
  MapPin, Clock, Users, Activity, Eye, Volume2, Stethoscope,
  Heart, Zap, CheckCircle, AlertTriangle, ArrowRight, RefreshCw,
  TrendingUp, TrendingDown, Minus, Plus, Bell, Star
} from 'lucide-react';

// 🔧 Station Interface
interface Station {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  currentQueue: number;
  maxCapacity: number;
  averageTime: number; // minutes
  currentWaitTime: number; // minutes
  staffOnDuty: number;
  status: 'available' | 'busy' | 'closed' | 'maintenance';
  priority: 'high' | 'medium' | 'low';
  specialRequirements?: string[];
  lastUpdated: string;
}

interface Patient {
  id: string;
  name: string;
  currentStation: string;
  nextRecommendations: StationRecommendation[];
  medicalFlags: string[];
  examinationType: string;
  completedStations: string[];
  timeInCurrent: number;
}

interface StationRecommendation {
  stationId: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  reason: string;
  estimatedTime: number;
  waitTime: number;
}

// 🎯 Smart Station Routing Component
export const SmartStationRouting: React.FC<{
  patientId: string;
  currentStation: string;
  questionnaireMedicalFlags?: string[];
  examinationType: string;
}> = ({ 
  patientId, 
  currentStation, 
  questionnaireMedicalFlags = [], 
  examinationType 
}) => {
  // 📊 State Management
  const [stations, setStations] = useState<Station[]>([]);
  const [recommendations, setRecommendations] = useState<StationRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [routingMode, setRoutingMode] = useState<'patient_choice' | 'staff_directed' | 'ai_optimized'>('patient_choice');
  
  const { toast } = useToast();

  // 🔧 Load Station Data
  useEffect(() => {
    loadStationData();
    const interval = setInterval(loadStationData, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  // 🔧 Generate Recommendations
  useEffect(() => {
    if (stations.length > 0) {
      const newRecommendations = generateSmartRecommendations();
      setRecommendations(newRecommendations);
    }
  }, [stations, questionnaireMedicalFlags, examinationType]);

  const loadStationData = async () => {
    try {
      const response = await fetch('/api/stations/realtime');
      const stationData = await response.json();
      
      setStations(stationData.map((station: any) => ({
        ...station,
        icon: getStationIcon(station.id)
      })));
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load station data:', error);
      setLoading(false);
    }
  };

  // 🧠 Smart Recommendation Engine
  const generateSmartRecommendations = (): StationRecommendation[] => {
    const recs: StationRecommendation[] = [];
    
    // Medical flag-based priority routing
    questionnaireMedicalFlags.forEach(flag => {
      switch (flag) {
        case 'heart_disease_high_bp':
          recs.push({
            stationId: 'ecg',
            priority: 'urgent',
            reason: 'Cardiovascular condition requires immediate ECG assessment',
            estimatedTime: 20,
            waitTime: getStationWaitTime('ecg')
          });
          recs.push({
            stationId: 'nursing',
            priority: 'high',
            reason: 'Blood pressure monitoring required',
            estimatedTime: 15,
            waitTime: getStationWaitTime('nursing')
          });
          break;
          
        case 'glaucoma_blindness':
          recs.push({
            stationId: 'vision_testing',
            priority: 'high',
            reason: 'Vision impairment requires comprehensive eye examination',
            estimatedTime: 25,
            waitTime: getStationWaitTime('vision_testing')
          });
          break;
          
        case 'epilepsy_convulsions':
          recs.push({
            stationId: 'nursing',
            priority: 'urgent',
            reason: 'Neurological condition requires immediate medical review',
            estimatedTime: 20,
            waitTime: getStationWaitTime('nursing')
          });
          break;
      }
    });

    // Examination type-based routing
    switch (examinationType) {
      case 'working_at_heights':
        recs.push({
          stationId: 'balance_testing',
          priority: 'high',
          reason: 'Height work requires balance and coordination assessment',
          estimatedTime: 30,
          waitTime: getStationWaitTime('balance_testing')
        });
        break;
        
      case 'pre_employment':
        // Standard pre-employment flow
        recs.push({
          stationId: 'nursing',
          priority: 'medium',
          reason: 'Standard vital signs and basic measurements',
          estimatedTime: 15,
          waitTime: getStationWaitTime('nursing')
        });
        break;
    }

    // Capacity-based recommendations (avoid bottlenecks)
    const availableStations = stations.filter(s => 
      s.status === 'available' && 
      s.currentQueue < s.maxCapacity * 0.8
    );

    availableStations.forEach(station => {
      if (!recs.find(r => r.stationId === station.id)) {
        recs.push({
          stationId: station.id,
          priority: 'low',
          reason: `Available now - no wait time`,
          estimatedTime: station.averageTime,
          waitTime: station.currentWaitTime
        });
      }
    });

    // Sort by priority and wait time
    return recs
      .sort((a, b) => {
        const priorityWeights = { urgent: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityWeights[b.priority] - priorityWeights[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.waitTime - b.waitTime;
      })
      .slice(0, 6); // Top 6 recommendations
  };

  const getStationWaitTime = (stationId: string): number => {
    const station = stations.find(s => s.id === stationId);
    return station?.currentWaitTime || 0;
  };

  const getStationIcon = (stationId: string) => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      nursing: Stethoscope,
      vision_testing: Eye,
      audio_testing: Volume2,
      ecg: Heart,
      lung_function: Activity,
      balance_testing: Zap,
      blood_work: Heart,
      xray: Zap
    };
    return iconMap[stationId] || MapPin;
  };

  // 🎯 Station Selection Handler
  const handleStationSelection = async (stationId: string) => {
    try {
      setSelectedStation(stationId);
      
      // Execute station handoff
      const response = await fetch('/api/workflow/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          from_station: currentStation,
          to_station: stationId,
          selection_method: routingMode,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        toast({
          title: "Station Handoff Successful! ✅",
          description: `Proceeding to ${stations.find(s => s.id === stationId)?.name}. Estimated wait: ${getStationWaitTime(stationId)} minutes`,
        });

        // Update patient status and redirect
        setTimeout(() => {
          window.location.href = `/stations/${stationId}/waiting-area?patient=${patientId}`;
        }, 2000);
        
      } else {
        throw new Error('Handoff failed');
      }
    } catch (error) {
      console.error('Station handoff failed:', error);
      toast({
        title: "Handoff Failed",
        description: "Unable to proceed to selected station. Please ask for assistance.",
        variant: "destructive",
      });
      setSelectedStation(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading station availability...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 🎯 Smart Recommendations Header */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-green-600" />
            Choose Your Next Station
          </CardTitle>
          <CardDescription className="text-lg">
            Based on your questionnaire responses, here are the recommended next steps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-white">
                {recommendations.filter(r => r.priority === 'urgent' || r.priority === 'high').length} Priority
              </Badge>
              <Badge variant="outline" className="bg-white">
                {stations.filter(s => s.status === 'available').length} Available
              </Badge>
              <Badge variant="outline" className="bg-white">
                Avg Wait: {Math.round(stations.reduce((sum, s) => sum + s.currentWaitTime, 0) / stations.length)}min
              </Badge>
            </div>
            
            <div className="text-xs text-gray-500">
              Updated {new Date().toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 🚨 Urgent Medical Alerts */}
      {recommendations.some(r => r.priority === 'urgent') && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-red-800">Medical Priority Detected</AlertTitle>
          <AlertDescription className="text-red-700">
            Based on your health information, certain stations are recommended for immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* 📊 Station Selection Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((rec) => {
          const station = stations.find(s => s.id === rec.stationId);
          if (!station) return null;

          const Icon = station.icon;
          const isUrgent = rec.priority === 'urgent';
          const isHigh = rec.priority === 'high';
          const isAvailable = station.status === 'available';
          const utilizationRate = (station.currentQueue / station.maxCapacity) * 100;

          return (
            <Card 
              key={rec.stationId}
              className={`relative cursor-pointer transition-all duration-300 hover:scale-105 ${
                isUrgent ? 'ring-2 ring-red-500 bg-red-50' :
                isHigh ? 'ring-2 ring-yellow-500 bg-yellow-50' :
                isAvailable ? 'hover:bg-gray-50' : 'opacity-60'
              } ${selectedStation === rec.stationId ? 'ring-4 ring-blue-500' : ''}`}
              onClick={() => isAvailable && handleStationSelection(rec.stationId)}
            >
              <CardContent className="p-6">
                
                {/* Station Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-lg ${
                      isUrgent ? 'bg-red-100' :
                      isHigh ? 'bg-yellow-100' :
                      'bg-blue-100'
                    }`}>
                      <Icon className={`h-6 w-6 ${
                        isUrgent ? 'text-red-600' :
                        isHigh ? 'text-yellow-600' :
                        'text-blue-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{station.name}</h3>
                      <p className="text-sm text-gray-600">{station.description}</p>
                    </div>
                  </div>

                  {/* Priority Badge */}
                  <Badge className={
                    isUrgent ? 'bg-red-100 text-red-800' :
                    isHigh ? 'bg-yellow-100 text-yellow-800' :
                    rec.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {rec.priority.toUpperCase()}
                  </Badge>
                </div>

                {/* Recommendation Reason */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Why this station?</p>
                  <p className="text-sm text-gray-600">{rec.reason}</p>
                </div>

                {/* Station Metrics */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="flex items-center space-x-1 mb-1">
                      <Clock className="h-3 w-3 text-gray-500" />
                      <span className="text-xs text-gray-500">Wait Time</span>
                    </div>
                    <div className={`font-semibold ${
                      rec.waitTime === 0 ? 'text-green-600' :
                      rec.waitTime < 10 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {rec.waitTime === 0 ? 'No wait!' : `${rec.waitTime} min`}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-1 mb-1">
                      <Activity className="h-3 w-3 text-gray-500" />
                      <span className="text-xs text-gray-500">Duration</span>
                    </div>
                    <div className="font-semibold text-gray-700">
                      ~{rec.estimatedTime} min
                    </div>
                  </div>
                </div>

                {/* Queue Status */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">Current Queue</span>
                    <span className="text-xs font-medium">
                      {station.currentQueue}/{station.maxCapacity}
                    </span>
                  </div>
                  <Progress 
                    value={utilizationRate} 
                    className={`h-2 ${
                      utilizationRate > 80 ? 'bg-red-100' :
                      utilizationRate > 60 ? 'bg-yellow-100' : 'bg-green-100'
                    }`}
                  />
                </div>

                {/* Staff Status */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3 text-gray-500" />
                    <span className="text-xs text-gray-500">Staff on duty:</span>
                  </div>
                  <span className="text-xs font-medium">{station.staffOnDuty}</span>
                </div>

                {/* Action Button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${
                      station.status === 'available' ? 'bg-green-500' :
                      station.status === 'busy' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}></div>
                    <span className="text-xs text-gray-500 capitalize">
                      {station.status}
                    </span>
                  </div>
                  
                  {isAvailable && (
                    <div className="flex items-center text-blue-600">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </div>

                {/* Special Requirements */}
                {station.specialRequirements && station.specialRequirements.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Requirements:</p>
                    <div className="flex flex-wrap gap-1">
                      {station.specialRequirements.map((req, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {req}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 🆘 Help & Alternative Options */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold mb-2">Need assistance choosing?</h4>
              <p className="text-sm text-gray-600">
                Our reception staff can help you select the best next station based on your needs
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Button variant="outline">
                <Bell className="h-4 w-4 mr-2" />
                Call for Help
              </Button>
              
              <Button variant="ghost">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Availability
              </Button>
            </div>
          </div>
          
          {/* Alternative Options */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-gray-50 rounded-lg">
                <Users className="h-5 w-5 mx-auto mb-2 text-gray-500" />
                <div className="text-sm font-medium">Ask Reception</div>
                <div className="text-xs text-gray-500">Get personalized guidance</div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <Star className="h-5 w-5 mx-auto mb-2 text-gray-500" />
                <div className="text-sm font-medium">Follow Recommendation</div>
                <div className="text-xs text-gray-500">Go with suggested priority</div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <Clock className="h-5 w-5 mx-auto mb-2 text-gray-500" />
                <div className="text-sm font-medium">Wait & See</div>
                <div className="text-xs text-gray-500">Check back in 5 minutes</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 📊 Real-time Station Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Live Station Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {stations.map((station) => {
              const Icon = station.icon;
              const utilizationRate = (station.currentQueue / station.maxCapacity) * 100;
              
              return (
                <div key={station.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Icon className="h-4 w-4 text-gray-600" />
                    <span className="font-medium">{station.name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-sm">
                      <span className="text-gray-500">Queue:</span>
                      <span className="font-medium ml-1">{station.currentQueue}</span>
                    </div>
                    
                    <div className="text-sm">
                      <span className="text-gray-500">Wait:</span>
                      <span className="font-medium ml-1">{station.currentWaitTime}m</span>
                    </div>
                    
                    <Badge variant={
                      station.status === 'available' ? 'default' :
                      station.status === 'busy' ? 'secondary' : 'destructive'
                    }>
                      {station.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// 🎯 Station Queue Management Component
export const StationQueueManager: React.FC<{
  stationId: string;
  isStaffInterface?: boolean;
}> = ({ stationId, isStaffInterface = false }) => {
  const [queueData, setQueueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQueueData();
    const interval = setInterval(loadQueueData, 10000);
    return () => clearInterval(interval);
  }, [stationId]);

  const loadQueueData = async () => {
    try {
      const response = await fetch(`/api/stations/${stationId}/queue`);
      const data = await response.json();
      setQueueData(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load queue data:', error);
      setLoading(false);
    }
  };

  if (loading || !queueData) {
    return <div>Loading queue data...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Station Queue: {queueData.stationName}</CardTitle>
        <CardDescription>
          Current queue: {queueData.currentQueue} patients • Average wait: {queueData.averageWait} minutes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {queueData.patients?.map((patient: any, index: number) => (
            <div key={patient.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Badge variant="outline">#{index + 1}</Badge>
                <div>
                  <div className="font-medium">{patient.name}</div>
                  <div className="text-sm text-gray-500">
                    Waiting {patient.waitTime} minutes
                  </div>
                </div>
              </div>
              
              {patient.medicalFlags?.length > 0 && (
                <Badge variant="destructive">
                  {patient.medicalFlags.length} Alert{patient.medicalFlags.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartStationRouting;