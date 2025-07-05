import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Stethoscope,
  TestTube,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
  ClipboardList,
  Award,
  FolderOpen,
  BarChart3,
  Database
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    roles: ['receptionist', 'nurse', 'technician', 'doctor', 'admin', 'employer']
  },
  {
    title: 'Patient Registration',
    href: '/patients/register',
    icon: UserPlus,
    roles: ['receptionist', 'admin']
  },
  {
    title: 'Patient Queue',
    href: '/patients',
    icon: Users,
    roles: ['receptionist', 'nurse', 'technician', 'doctor', 'admin']
  },
  {
    title: 'EHR Database',
    href: '/ehr-database',
    icon: Database,
    roles: ['doctor', 'admin', 'employer'],
    description: 'Search all patient records'
  },
  {
    title: 'Documents',
    href: '/documents',
    icon: FolderOpen,
    roles: ['receptionist', 'nurse', 'technician', 'doctor', 'admin']
  },
  {
    title: 'Historical Processing',
    href: '/processing',
    icon: BarChart3,
    roles: ['admin', 'employer']
  },
  {
    title: 'Questionnaires',
    href: '/questionnaires',
    icon: ClipboardList,
    roles: ['receptionist', 'admin']
  },
  {
    title: 'Vital Signs',
    href: '/vitals',
    icon: Activity,
    roles: ['nurse', 'admin']
  },
  {
    title: 'Medical Tests',
    href: '/tests',
    icon: TestTube,
    roles: ['technician', 'admin']
  },
  {
    title: 'Medical Review',
    href: '/review',
    icon: Stethoscope,
    roles: ['doctor', 'admin']
  },
  {
    title: 'Certificates',
    href: '/certificates',
    icon: Award,
    roles: ['doctor', 'admin', 'employer']
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: FileText,
    roles: ['admin', 'employer']
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['admin']
  }
];

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  // Mock user role - in real app this would come from auth context
  const userRole = 'admin'; // This should come from useAuth()

  const filteredItems = navigationItems.filter(item =>
    item.roles.includes(userRole)
  );

  return (
    <div className={cn(
      "relative flex flex-col bg-card border-r border-border transition-all duration-300",
      collapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-6 z-10 h-6 w-6 rounded-full border bg-background shadow-md"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-6">
        <nav className="space-y-2 px-3">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-accent hover:text-accent-foreground",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.title : undefined}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && (
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{item.title}</span>
                    {item.description && (
                      <span className="text-xs text-muted-foreground">{item.description}</span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t">
          <div className="text-xs text-muted-foreground">
            <div className="font-medium">HealthForm Harvester</div>
            <div>v2.1.0</div>
          </div>
        </div>
      )}
    </div>
  );
}