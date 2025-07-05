// components/TabletOptimized/TabletLayout.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  X, 
  RotateCcw,
  Maximize,
  Home,
  User,
  Heart,
  Shield,
  Clock,
  Briefcase,
  PenTool,
  Save,
  CheckCircle
} from 'lucide-react';

interface TabletLayoutProps {
  children: React.ReactNode;
  currentSection: string;
  sections: Array<{
    id: string;
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    completed: boolean;
    current: boolean;
  }>;
  progress: number;
  patientInfo?: {
    name: string;
    id: string;
    examType: string;
  };
  onSectionChange: (sectionId: string) => void;
  onSave?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  canProceed?: boolean;
  isFirstSection?: boolean;
  isLastSection?: boolean;
  autoSaving?: boolean;
  lastSaved?: Date | null;
}

export const TabletLayout: React.FC<TabletLayoutProps> = ({
  children,
  currentSection,
  sections,
  progress,
  patientInfo,
  onSectionChange,
  onSave,
  onNext,
  onPrevious,
  canProceed = true,
  isFirstSection = false,
  isLastSection = false,
  autoSaving = false,
  lastSaved
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const layoutRef = useRef<HTMLDivElement>(null);

  // Detect orientation changes
  useEffect(() => {
    const handleOrientationChange = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      setOrientation(isLandscape ? 'landscape' : 'portrait');
    };

    handleOrientationChange();
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Gesture handling for swipe navigation
  useEffect(() => {
    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!e.changedTouches[0]) return;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - startX;
      const deltaY = endY - startY;

      // Horizontal swipe detection (minimum 100px, more horizontal than vertical)
      if (Math.abs(deltaX) > 100 && Math.abs(deltaX) > Math.abs(deltaY)) {
        // Swipe right - go to previous section
        if (deltaX > 0 && !isFirstSection && canProceed) {
          onPrevious?.();
        }
        // Swipe left - go to next section
        else if (deltaX < 0 && !isLastSection && canProceed) {
          onNext?.();
        }
      }
    };

    const element = layoutRef.current;
    if (element) {
      element.addEventListener('touchstart', handleTouchStart, { passive: true });
      element.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    return () => {
      if (element) {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [isFirstSection, isLastSection, canProceed, onNext, onPrevious]);

  const currentSectionInfo = sections.find(s => s.id === currentSection);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  return (
    <div 
      ref={layoutRef}
      className={`
        tablet-layout min-h-screen bg-gradient-to-br from-blue-50 to-green-50
        ${orientation === 'portrait' ? 'tablet-portrait' : 'tablet-landscape'}
        ${isFullscreen ? 'tablet-fullscreen' : ''}
      `}
      style={{
        fontSize: '16px', // Prevent iOS zoom
        touchAction: 'manipulation', // Improve touch responsiveness
      }}
    >
      {/* Top Navigation Bar */}
      <header className="tablet-header sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b shadow-sm">
        <div className="flex items-center justify-between p-4 h-20">
          {/* Left: Menu and Patient Info */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="tablet-touch-target p-3"
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
            
            {patientInfo && (
              <div className="hidden md:block">
                <h2 className="font-semibold text-lg">{patientInfo.name}</h2>
                <p className="text-sm text-gray-600">{patientInfo.examType}</p>
              </div>
            )}
          </div>

          {/* Center: Current Section */}
          <div className="flex items-center gap-3">
            {currentSectionInfo?.icon && (
              <currentSectionInfo.icon className="h-6 w-6 text-blue-600" />
            )}
            <div className="text-center">
              <h1 className="font-semibold text-lg">{currentSectionInfo?.title}</h1>
              <p className="text-sm text-gray-600">{Math.round(progress)}% Complete</p>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2">
            {/* Auto-save indicator */}
            {autoSaving ? (
              <Badge variant="secondary" className="tablet-touch-target">
                <RotateCcw className="h-4 w-4 mr-1 animate-spin" />
                Saving...
              </Badge>
            ) : lastSaved ? (
              <Badge variant="outline" className="tablet-touch-target">
                <Save className="h-4 w-4 mr-1" />
                Saved {lastSaved.toLocaleTimeString()}
              </Badge>
            ) : null}

            <Button
              variant="ghost"
              size="lg"
              onClick={toggleFullscreen}
              className="tablet-touch-target p-3"
            >
              <Maximize className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-4 pb-2">
          <Progress value={progress} className="h-2" />
        </div>
      </header>

      <div className="flex h-[calc(100vh-6rem)]">
        {/* Sidebar Navigation */}
        <aside className={`
          tablet-sidebar fixed inset-y-0 left-0 z-40 w-80 bg-white border-r shadow-lg transform transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0
        `}>
          <div className="p-6 h-full overflow-y-auto">
            {/* Patient Info */}
            {patientInfo && (
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Patient Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="font-medium">{patientInfo.name}</p>
                    <p className="text-sm text-gray-600">ID: {patientInfo.id}</p>
                    <Badge variant="outline" className="mt-2">
                      {patientInfo.examType}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Section Navigation */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900 mb-4">Sections</h3>
              {sections.map((section, index) => {
                const Icon = section.icon;
                const isActive = section.id === currentSection;
                
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      onSectionChange(section.id);
                      setSidebarOpen(false);
                    }}
                    className={`
                      tablet-section-btn w-full text-left p-4 rounded-xl border transition-all
                      ${isActive 
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`
                        flex items-center justify-center w-12 h-12 rounded-full
                        ${isActive ? 'bg-blue-100' : 'bg-gray-100'}
                      `}>
                        <Icon className={`h-6 w-6 ${isActive ? 'text-blue-600' : 'text-gray-600'}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>
                            {section.title}
                          </p>
                          {section.completed && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          Step {index + 1} of {sections.length}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="mt-8 space-y-3">
              <h3 className="font-medium text-gray-900 mb-4">Quick Actions</h3>
              
              <Button
                variant="outline"
                size="lg"
                onClick={onSave}
                disabled={autoSaving}
                className="w-full tablet-touch-target justify-start"
              >
                <Save className="h-5 w-5 mr-3" />
                Save Progress
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => window.location.reload()}
                className="w-full tablet-touch-target justify-start"
              >
                <RotateCcw className="h-5 w-5 mr-3" />
                Refresh Form
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => window.location.href = '/'}
                className="w-full tablet-touch-target justify-start"
              >
                <Home className="h-5 w-5 mr-3" />
                Exit to Dashboard
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="tablet-content p-6 max-w-4xl mx-auto">
            {/* Content Container */}
            <div className="bg-white rounded-2xl shadow-sm border min-h-[600px]">
              <div className="p-8">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Bottom Navigation Bar */}
      <footer className="tablet-footer sticky bottom-0 bg-white/95 backdrop-blur-sm border-t shadow-lg">
        <div className="flex items-center justify-between p-4">
          {/* Previous Button */}
          <Button
            variant="outline"
            size="lg"
            onClick={onPrevious}
            disabled={isFirstSection}
            className="tablet-touch-target flex items-center gap-3 min-w-[120px]"
          >
            <ChevronLeft className="h-5 w-5" />
            Previous
          </Button>

          {/* Center Info */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-sm font-medium">
                Section {sections.findIndex(s => s.id === currentSection) + 1} of {sections.length}
              </p>
              <p className="text-xs text-gray-500">
                Swipe left/right to navigate
              </p>
            </div>
          </div>

          {/* Next/Complete Button */}
          {isLastSection ? (
            <Button
              size="lg"
              onClick={onNext}
              disabled={!canProceed}
              className="tablet-touch-target bg-green-600 hover:bg-green-700 flex items-center gap-3 min-w-[120px]"
            >
              <CheckCircle className="h-5 w-5" />
              Complete
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={onNext}
              disabled={!canProceed}
              className="tablet-touch-target flex items-center gap-3 min-w-[120px]"
            >
              Next
              <ChevronRight className="h-5 w-5" />
            </Button>
          )}
        </div>
      </footer>

      {/* Overlay for sidebar on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};