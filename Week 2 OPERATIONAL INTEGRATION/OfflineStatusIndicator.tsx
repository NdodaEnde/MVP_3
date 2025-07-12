/ src/components/OfflineStatusIndicator.tsx
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';

export const OfflineStatusIndicator: React.FC = () => {
  const { isOnline, connectionType } = useNetworkStatus();
  const { getPendingCount, syncPendingData } = useOfflineStorage();
  const pendingCount = getPendingCount();

  const handleManualSync = () => {
    if (isOnline && pendingCount > 0) {
      syncPendingData();
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Connection Status */}
      <Badge 
        variant={isOnline ? "default" : "destructive"}
        className="flex items-center gap-1"
      >
        {isOnline ? (
          <Wifi className="h-3 w-3" />
        ) : (
          <WifiOff className="h-3 w-3" />
        )}
        {isOnline ? `Online (${connectionType})` : 'Offline'}
      </Badge>

      {/* Pending Sync Indicator */}
      {pendingCount > 0 && (
        <Badge 
          variant="secondary" 
          className="flex items-center gap-1 cursor-pointer"
          onClick={handleManualSync}
        >
          {isOnline ? (
            <RefreshCw className="h-3 w-3" />
          ) : (
            <AlertTriangle className="h-3 w-3" />
          )}
          {pendingCount} pending sync
        </Badge>
      )}
    </div>
  );
};

export default OfflineStatusIndicator;