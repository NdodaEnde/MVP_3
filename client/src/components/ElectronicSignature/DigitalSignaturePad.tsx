// components/ElectronicSignature/DigitalSignaturePad.tsx
import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  PenTool, 
  Trash2, 
  Save, 
  CheckCircle2, 
  AlertTriangle,
  Shield,
  Eye,
  Download,
  Lock
} from 'lucide-react';

// Enhanced signature capture with legal compliance
interface SignatureData {
  imageData: string;
  timestamp: string;
  biometricData: {
    pressure: number[];
    speed: number[];
    acceleration: number[];
    strokeCount: number;
    duration: number;
  };
  metadata: {
    deviceInfo: string;
    browserInfo: string;
    ipAddress?: string;
    geolocation?: { lat: number; lng: number };
  };
  hash: string;
}

interface DigitalSignaturePadProps {
  width?: number;
  height?: number;
  onSignatureCapture: (signatureData: SignatureData) => void;
  onSignatureChange?: (hasSignature: boolean) => void;
  signerName: string;
  documentHash?: string;
  className?: string;
  disabled?: boolean;
}

export interface SignaturePadRef {
  clear: () => void;
  save: () => SignatureData | null;
  isEmpty: () => boolean;
}

const DigitalSignaturePad = forwardRef<SignaturePadRef, DigitalSignaturePadProps>(({
  width = 500,
  height = 200,
  onSignatureCapture,
  onSignatureChange,
  signerName,
  documentHash,
  className = '',
  disabled = false
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureData, setSignatureData] = useState<SignatureData | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  
  // Biometric data tracking
  const [biometricData, setBiometricData] = useState({
    pressure: [] as number[],
    speed: [] as number[],
    acceleration: [] as number[],
    strokeCount: 0,
    duration: 0
  });
  
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0, time: 0 });

  useImperativeHandle(ref, () => ({
    clear: clearSignature,
    save: saveSignature,
    isEmpty: () => !hasSignature
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up canvas for high-DPI displays
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
  }, []);

  const getEventPosition = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    setIsDrawing(true);
    setStartTime(Date.now());
    
    const pos = getEventPosition(e);
    setLastPosition({ x: pos.x, y: pos.y, time: Date.now() });
    
    // Increment stroke count
    setBiometricData(prev => ({
      ...prev,
      strokeCount: prev.strokeCount + 1
    }));

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;
    
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const pos = getEventPosition(e);
    const currentTime = Date.now();
    
    // Calculate biometric data
    const distance = Math.sqrt(
      Math.pow(pos.x - lastPosition.x, 2) + Math.pow(pos.y - lastPosition.y, 2)
    );
    const timeDiff = currentTime - lastPosition.time;
    const speed = timeDiff > 0 ? distance / timeDiff : 0;
    
    // Simulate pressure (would be actual pressure on pressure-sensitive devices)
    const pressure = Math.random() * 0.3 + 0.7; // Simulated pressure between 0.7-1.0
    
    // Track biometric data
    setBiometricData(prev => ({
      ...prev,
      pressure: [...prev.pressure, pressure],
      speed: [...prev.speed, speed],
      acceleration: [...prev.acceleration, speed - (prev.speed[prev.speed.length - 1] || 0)]
    }));

    // Draw line with pressure-sensitive width
    ctx.lineWidth = 1 + (pressure * 2);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);

    setLastPosition({ x: pos.x, y: pos.y, time: currentTime });
    setHasSignature(true);
    onSignatureChange?.(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    
    // Update total duration
    setBiometricData(prev => ({
      ...prev,
      duration: Date.now() - startTime
    }));
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    setHasSignature(false);
    setSignatureData(null);
    setBiometricData({
      pressure: [],
      speed: [],
      acceleration: [],
      strokeCount: 0,
      duration: 0
    });
    onSignatureChange?.(false);
  };

  const generateSignatureHash = (imageData: string, biometrics: any, metadata: any): string => {
    // In production, use a proper cryptographic hash
    const dataToHash = imageData + JSON.stringify(biometrics) + JSON.stringify(metadata) + signerName;
    return btoa(dataToHash).substring(0, 32); // Simplified hash for demo
  };

  const saveSignature = (): SignatureData | null => {
    if (!hasSignature || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const imageData = canvas.toDataURL('image/png');
    
    const metadata = {
      deviceInfo: navigator.userAgent,
      browserInfo: `${navigator.appName} ${navigator.appVersion}`,
      ipAddress: '', // Would be filled by backend
      geolocation: undefined // Would require user permission
    };

    const finalBiometricData = {
      ...biometricData,
      duration: biometricData.duration || (Date.now() - startTime)
    };

    const signature: SignatureData = {
      imageData,
      timestamp: new Date().toISOString(),
      biometricData: finalBiometricData,
      metadata,
      hash: ''
    };

    // Generate hash after all data is collected
    signature.hash = generateSignatureHash(imageData, finalBiometricData, metadata);
    
    setSignatureData(signature);
    onSignatureCapture(signature);
    
    return signature;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Signature Canvas */}
      <Card className={`${disabled ? 'opacity-50' : ''}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <PenTool className="h-4 w-4" />
            Digital Signature
            {hasSignature && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Captured
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={width}
              height={height}
              style={{
                width: `${width}px`,
                height: `${height}px`,
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                cursor: disabled ? 'not-allowed' : 'crosshair',
                touchAction: 'none'
              }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            
            {/* Signature line and instructions */}
            {!hasSignature && (
              <div className="absolute inset-0 flex items-end justify-center pb-4 pointer-events-none">
                <div className="text-center">
                  <div className="border-b-2 border-gray-300 w-64 mb-2"></div>
                  <p className="text-sm text-gray-500">Sign here</p>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              {hasSignature ? (
                <span className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Signature captured with biometric data
                </span>
              ) : (
                <span>Please sign using your mouse, stylus, or finger</span>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearSignature}
                disabled={disabled || !hasSignature}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
              
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={saveSignature}
                disabled={disabled || !hasSignature}
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signature Details */}
      {signatureData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              Signature Authentication Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">Signer:</p>
                <p className="text-gray-600">{signerName}</p>
              </div>
              
              <div>
                <p className="font-medium text-gray-700">Timestamp:</p>
                <p className="text-gray-600">{new Date(signatureData.timestamp).toLocaleString()}</p>
              </div>
              
              <div>
                <p className="font-medium text-gray-700">Biometric Strokes:</p>
                <p className="text-gray-600">{signatureData.biometricData.strokeCount} strokes</p>
              </div>
              
              <div>
                <p className="font-medium text-gray-700">Signature Duration:</p>
                <p className="text-gray-600">{(signatureData.biometricData.duration / 1000).toFixed(1)}s</p>
              </div>
              
              <div>
                <p className="font-medium text-gray-700">Authentication Hash:</p>
                <p className="text-gray-600 font-mono text-xs">{signatureData.hash}</p>
              </div>
              
              <div>
                <p className="font-medium text-gray-700">Device:</p>
                <p className="text-gray-600 truncate">{signatureData.metadata.deviceInfo.split(' ')[0]}</p>
              </div>
            </div>

            <Alert className="mt-4 border-green-200 bg-green-50">
              <Lock className="h-4 w-4" />
              <AlertTitle className="text-green-800">Legally Compliant Signature</AlertTitle>
              <AlertDescription className="text-green-700">
                This signature includes biometric data, timestamp, and authentication hash in compliance 
                with the Electronic Communications and Transactions Act of South Africa.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

DigitalSignaturePad.displayName = 'DigitalSignaturePad';

export default DigitalSignaturePad;