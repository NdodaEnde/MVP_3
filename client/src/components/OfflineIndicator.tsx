// components/OfflineIndicator.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  WifiOff, 
  Database, 
  Clock, 
  AlertTriangle,
  HardDrive
} from 'lucide-react';

interface OfflineIndicatorProps {
  storageInfo: {
    itemCount: number;
    totalSize: number;
    pendingSync: number;
    storageQuota: number;
  };
  lastSyncAttempt: Date | null;
}

export function OfflineIndicator({ storageInfo, lastSyncAttempt }: OfflineIndicatorProps) {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const storageUsagePercentage = (storageInfo.totalSize / storageInfo.storageQuota) * 100;

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <WifiOff className="h-5 w-5 text-orange-600" />
          <span className="font-medium text-orange-800">Offline Mode</span>
          <Badge variant="outline" className="text-xs">
            Auto-save Active
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-orange-600" />
            <span className="text-orange-700">
              {storageInfo.itemCount} questionnaire{storageInfo.itemCount !== 1 ? 's' : ''} stored
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-600" />
            <span className="text-orange-700">
              {storageInfo.pendingSync} pending sync
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-orange-600" />
            <span className="text-orange-700">
              {formatBytes(storageInfo.totalSize)} used
            </span>
          </div>
          
          {lastSyncAttempt && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-orange-700">
                Last sync: {lastSyncAttempt.toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
        
        {storageUsagePercentage > 80 && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <span>Storage space running low ({Math.round(storageUsagePercentage)}% used)</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}