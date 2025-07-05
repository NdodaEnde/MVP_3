// components/NetworkStatusBanner.tsx
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  WifiOff, 
  Wifi, 
  RefreshCw, 
  Upload, 
  AlertTriangle, 
  CheckCircle,
  Clock
} from 'lucide-react';

interface NetworkStatusBannerProps {
  isOnline: boolean;
  isReconnecting: boolean;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
  syncProgress?: { current: number; total: number };
  pendingItems: number;
  onRetrySync: () => void;
  onClearOfflineData?: () => void;
}

export function NetworkStatusBanner({
  isOnline,
  isReconnecting,
  syncStatus,
  syncProgress,
  pendingItems,
  onRetrySync,
  onClearOfflineData
}: NetworkStatusBannerProps) {
  const getBannerConfig = () => {
    if (!isOnline) {
      return {
        variant: 'destructive' as const,
        icon: <WifiOff className="h-4 w-4" />,
        title: 'Working Offline',
        message: `${pendingItems} questionnaire${pendingItems !== 1 ? 's' : ''} will sync when connection is restored`,
        showRetry: false,
        showClear: pendingItems > 0
      };
    }
    
    if (isReconnecting) {
      return {
        variant: 'default' as const,
        icon: <RefreshCw className="h-4 w-4 animate-spin" />,
        title: 'Reconnecting...',
        message: 'Checking connection stability',
        showRetry: false,
        showClear: false
      };
    }
    
    if (syncStatus === 'syncing' && syncProgress) {
      const percentage = Math.round((syncProgress.current / syncProgress.total) * 100);
      return {
        variant: 'default' as const,
        icon: <Upload className="h-4 w-4" />,
        title: 'Syncing Data',
        message: `${syncProgress.current}/${syncProgress.total} questionnaires`,
        progress: percentage,
        showRetry: false,
        showClear: false
      };
    }
    
    if (syncStatus === 'error') {
      return {
        variant: 'destructive' as const,
        icon: <AlertTriangle className="h-4 w-4" />,
        title: 'Sync Failed',
        message: `${pendingItems} questionnaire${pendingItems !== 1 ? 's' : ''} need to be synced`,
        showRetry: true,
        showClear: true
      };
    }
    
    if (pendingItems > 0) {
      return {
        variant: 'default' as const,
        icon: <Clock className="h-4 w-4" />,
        title: 'Sync Pending',
        message: `${pendingItems} questionnaire${pendingItems !== 1 ? 's' : ''} waiting to sync`,
        showRetry: true,
        showClear: false
      };
    }
    
    return null;
  };

  const bannerConfig = getBannerConfig();
  
  if (!bannerConfig) return null;

  return (
    <Alert variant={bannerConfig.variant} className="mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          {bannerConfig.icon}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">{bannerConfig.title}</span>
              {isOnline && (
                <Badge variant="outline" className="text-xs">
                  <Wifi className="h-3 w-3 mr-1" />
                  Online
                </Badge>
              )}
            </div>
            <AlertDescription className="text-sm">
              {bannerConfig.message}
            </AlertDescription>
            {bannerConfig.progress !== undefined && (
              <div className="mt-2 flex items-center gap-2">
                <Progress value={bannerConfig.progress} className="flex-1 h-2" />
                <span className="text-xs font-medium">{bannerConfig.progress}%</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {bannerConfig.showRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetrySync}
              disabled={syncStatus === 'syncing'}
            >
              {syncStatus === 'syncing' ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              Retry Sync
            </Button>
          )}
          
          {bannerConfig.showClear && onClearOfflineData && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearOfflineData}
              className="text-destructive hover:text-destructive"
            >
              Clear Offline Data
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
}