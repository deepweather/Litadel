import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  Briefcase,
  LayoutDashboard,
  LineChart,
  Plus,
  Settings,
  TrendingUp,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    path: '/',
    icon: <LayoutDashboard size={18} />,
  },
  {
    name: 'Analyses',
    path: '/analyses',
    icon: <LineChart size={18} />,
  },
  {
    name: 'New Analysis',
    path: '/analyses/create',
    icon: <Plus size={18} />,
  },
  {
    name: 'Portfolio',
    path: '/portfolio',
    icon: <Briefcase size={18} />,
  },
  {
    name: 'Backtests',
    path: '/backtests',
    icon: <TrendingUp size={18} />,
  },
  {
    name: 'Settings',
    path: '/settings',
    icon: <Settings size={18} />,
  },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <a href={item.path}>
                        {item.icon}
                        <span>{item.name}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border">
        <div className="p-4 text-xs text-muted-foreground font-mono space-y-1">
          <div>VERSION: 1.0.0</div>
          <div>API: Connected</div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
