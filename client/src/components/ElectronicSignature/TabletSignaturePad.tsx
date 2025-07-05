// components/ElectronicSignature/TabletSignaturePad.tsx
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
  Maximize2,
  Minimize2,
  RotateCcw,
  Palette,
  Settings,
  Smartphone,
  Tablet,
  Monitor
} from 'lucide-react';

// Enhanced tablet signature with pressure sensitivity and gesture support
interface TabletSignatureData {
  imageData: string;
  timestamp: string;
  biometricData: {
    pressure: number[];
    speed: number[];
    acceleration: number[];
    strokeCount: number;
    duration: number;
    touchPoints: Array<{ x: number; y: number; pressure: number; timestamp: number }>;
  };
  metadata: {
    deviceInfo: string;
    touchSupport: boolean;
    pressureSupport: boolean;
    canvasSize: { width: number; height: number };
    pixelRatio: number;
  };
  hash: string;
}

interface TabletSignaturePadProps {
  width?: number;
  height?: number;
  onSignatureCapture: (signatureData: TabletSignatureData) => void;
  onSignatureChange?: (hasSignature: boolean) => void;
  signerName: string;
  documentHash?: string;
  className?: string;
  disabled?: boolean;
  autoResize?: boolean;
}

export interface TabletSignaturePadRef {
  clear: () => void;
  save: () => TabletSignatureData | null;
  isEmpty: () => boolean;
  toggleFullscreen: () => void;
  resize: () => void;
}

const TabletSignaturePad = forwardRef<TabletSignaturePadRef, TabletSignaturePadProps>(({
  width = 600,
  height = 300,
  onSignatureCapture,
  onSignatureChange,
  signerName,
  documentHash,
  className = '',
  disabled = false,
  autoResize = true
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [penSize, setPenSize] = useState(2);
  const [penColor, setPenColor] = useState('#000000');
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('tablet');
  
  // Enhanced biometric tracking
  const [biometricData, setBiometricData] = useState({
    pressure: [] as number[],
    speed: [] as number[],
    acceleration: [] as number[],
    strokeCount: 0,
    duration: 0,
    touchPoints: [] as Array<{ x: number; y: number; pressure: number; timestamp: number }>
  });
  
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0, time: 0 });
  const [startTime, setStartTime] = useState<number>(0);
  const [canvasSize, setCanvasSize] = useState({ width, height });

  useImperativeHandle(ref, () => ({
    clear: clearSignature,
    save: saveSignature,
    isEmpty: () => !hasSignature,
    toggleFullscreen: toggleFullscreen,
    resize: resizeCanvas
  }));

  // Detect device type
  useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth;
      if (width < 768) setDeviceType('mobile');
      else if (width < 1024) setDeviceType('tablet');
      else setDeviceType('desktop');
    };

    detectDevice();
    window.addEventListener('resize', detectDevice);
    return () => window.removeEventListener('resize', detectDevice);
  }, []);

  // Auto-resize canvas based on container
  useEffect(() => {
    if (autoResize) {
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      return () => window.removeEventListener('resize', resizeCanvas);
    }
  }, [autoResize, isFullscreen]);

  const resizeCanvas = () => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const containerRect = container.getBoundingClientRect();
    let newWidth = containerRect.width - 40; // Account for padding
    let newHeight = isFullscreen ? window.innerHeight * 0.6 : 
                   deviceType === 'mobile' ? 200 :
                   deviceType === 'tablet' ? 300 : 400;

    // Maintain aspect ratio
    const aspectRatio = 2.5; // Width to height ratio
    if (newWidth / newHeight > aspectRatio) {
      newWidth = newHeight * aspectRatio;
    } else {
      newHeight = newWidth / aspectRatio;
    }

    setCanvasSize({ width: newWidth, height: newHeight });
    setupCanvas(newWidth, newHeight);
  };

  const setupCanvas = (w: number, h: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up canvas for high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSize;
    
    // Improve line quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  };

  const getEventPosition = (e: React.MouseEvent | React.TouchEvent): { 
    x: number; 
    y: number; 
    pressure: number;
  } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, pressure: 1 };

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number, pressure: number = 1;

    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
      // Enhanced pressure detection for supported devices
      pressure = (touch as any).force || (touch as any).webkitForce || 1;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
      // Simulate pressure based on mouse button state
      pressure = e.buttons === 1 ? 1 : 0.5;
    }

    return {
      x: (clientX - rect.left) * (canvas.width / rect.width) / (window.devicePixelRatio || 1),
      y: (clientY - rect.top) * (canvas.height / rect.height) / (window.devicePixelRatio || 1),
      pressure: Math.max(0.1, Math.min(1, pressure))
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    setIsDrawing(true);
    setStartTime(Date.now());
    
    const pos = getEventPosition(e);
    setLastPosition({ x: pos.x, y: pos.y, time: Date.now() });
    
    // Enhanced biometric tracking
    setBiometricData(prev => ({
      ...prev,
      strokeCount: prev.strokeCount + 1,
      touchPoints: [...prev.touchPoints, {
        x: pos.x,
        y: pos.y,
        pressure: pos.pressure,
        timestamp: Date.now()
      }]
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
    
    // Calculate enhanced biometric data
    const distance = Math.sqrt(
      Math.pow(pos.x - lastPosition.x, 2) + Math.pow(pos.y - lastPosition.y, 2)
    );
    const timeDiff = currentTime - lastPosition.time;
    const speed = timeDiff > 0 ? distance / timeDiff : 0;
    
    // Enhanced pressure-sensitive drawing
    const dynamicLineWidth = penSize * pos.pressure;
    ctx.lineWidth = Math.max(0.5, dynamicLineWidth);
    
    // Smooth line drawing with quadratic curves
    const midX = (lastPosition.x + pos.x) / 2;
    const midY = (lastPosition.y + pos.y) / 2;
    
    ctx.quadraticCurveTo(lastPosition.x, lastPosition.y, midX, midY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(midX, midY);

    // Track biometric data
    setBiometricData(prev => ({
      ...prev,
      pressure: [...prev.pressure, pos.pressure],
      speed: [...prev.speed, speed],
      acceleration: [...prev.acceleration, speed - (prev.speed[prev.speed.length - 1] || 0)],
      touchPoints: [...prev.touchPoints, {
        x: pos.x,
        y: pos.y,
        pressure: pos.pressure,
        timestamp: currentTime
      }]
    }));

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

    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.closePath();
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    setHasSignature(false);
    setBiometricData({
      pressure: [],
      speed: [],
      acceleration: [],
      strokeCount: 0,
      duration: 0,
      touchPoints: []
    });
    onSignatureChange?.(false);
  };

  const saveSignature = (): TabletSignatureData | null => {
    if (!hasSignature || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const imageData = canvas.toDataURL('image/png', 1.0);
    
    const metadata = {
      deviceInfo: navigator.userAgent,
      touchSupport: 'ontouchstart' in window,
      pressureSupport: 'TouchEvent' in window && 'force' in TouchEvent.prototype,
      canvasSize: { width: canvas.width, height: canvas.height },
      pixelRatio: window.devicePixelRatio || 1
    };

    const finalBiometricData = {
      ...biometricData,
      duration: biometricData.duration || (Date.now() - startTime)
    };

    const signature: TabletSignatureData = {
      imageData,
      timestamp: new Date().toISOString(),
      biometricData: finalBiometricData,
      metadata,
      hash: ''
    };

    // Generate enhanced hash
    const dataToHash = imageData + JSON.stringify(finalBiometricData) + JSON.stringify(metadata) + signerName;
    signature.hash = btoa(dataToHash).substring(0, 32);
    
    onSignatureCapture(signature);
    return signature;
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const getDeviceIcon = () => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Tablet className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`tablet-signature-enhanced ${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-6' : ''}`}
    >
      <Card className="tablet-card">
        <CardHeader className="tablet-card-header">
          <div className="flex items-center justify-between">
            <CardTitle className="tablet-card-title flex items-center gap-3">
              <PenTool className="h-6 w-6" />
              Tablet Signature Capture
              {hasSignature && (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Captured
                </Badge>
              )}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                {getDeviceIcon()}
                {deviceType}
              </Badge>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="tablet-touch-target"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="tablet-card-content">
          {/* Canvas Container */}
          <div className="tablet-signature-container">
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className="tablet-signature-canvas"
              style={{
                width: `${canvasSize.width}px`,
                height: `${canvasSize.height}px`,
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
              onTouchCancel={stopDrawing}
            />
            
            {/* Signature line and instructions */}
            {!hasSignature && (
              <div className="absolute inset-0 flex items-end justify-center pb-8 pointer-events-none">
                <div className="text-center">
                  <div className="tablet-signature-line"></div>
                  <p className="text-sm text-gray-500 mt-2">
                    {deviceType === 'mobile' || deviceType === 'tablet' 
                      ? 'Sign here with your finger or stylus' 
                      : 'Sign here with your mouse or drawing tablet'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Signature Controls */}
          <div className="signature-controls mt-6">
            <div className="flex items-center justify-between">
              {/* Left: Pen Settings */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-gray-600" />
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={penSize}
                    onChange={(e) => setPenSize(Number(e.target.value))}
                    className="w-20"
                    disabled={disabled}
                  />
                  <span className="text-sm text-gray-600">{penSize}px</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={penColor}
                    onChange={(e) => setPenColor(e.target.value)}
                    className="w-8 h-8 rounded border cursor-pointer"
                    disabled={disabled}
                  />
                </div>