import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  BarChart3,
  Briefcase,
  ChevronDown,
  History,
  LayoutDashboard,
  List,
  MessageSquare,
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
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  subItems?: NavItem[];
}

const navItems: NavItem[] = [
  {
    name: 'Chat',
    path: '/backtests/chat',
    icon: <MessageSquare size={18} />,
  },
  {
    name: 'Strategies',
    path: '/backtests',
    icon: <TrendingUp size={18} />,
    subItems: [
      {
        name: 'List',
        path: '/backtests',
        icon: <List size={16} />,
      },
      {
        name: 'New',
        path: '/backtests/create',
        icon: <Plus size={16} />,
      },
    ],
  },
  {
    name: 'Deep Dives',
    path: '/analyses',
    icon: <BarChart3 size={18} />,
    subItems: [
      {
        name: 'List',
        path: '/analyses',
        icon: <List size={16} />,
      },
      {
        name: 'New',
        path: '/analyses/create',
        icon: <Plus size={16} />,
      },
    ],
  },
  {
    name: 'Portfolio',
    path: '/portfolio',
    icon: <Briefcase size={18} />,
    subItems: [
      {
        name: 'Dashboard',
        path: '/portfolio',
        icon: <LayoutDashboard size={16} />,
      },
      {
        name: 'History',
        path: '/portfolio',
        icon: <History size={16} />,
      },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();

  // Determine if a parent item or its children are active
  const isParentActive = (item: NavItem) => {
    if (item.subItems) {
      return item.subItems.some(sub => location.pathname === sub.path) ||
             location.pathname.startsWith(item.path + '/');
    }
    return location.pathname === item.path;
  };

  // Determine default open state for collapsibles
  const getDefaultOpen = (item: NavItem) => {
    if (item.subItems) {
      return item.subItems.some(sub => location.pathname === sub.path) ||
             location.pathname.startsWith(item.path + '/');
    }
    return false;
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                if (item.subItems) {
                  // Collapsible menu item with sub-items
                  return (
                    <Collapsible
                      key={item.path}
                      defaultOpen={getDefaultOpen(item)}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            isActive={isParentActive(item)}
                            tooltip={item.name}
                          >
                            {item.icon}
                            <span>{item.name}</span>
                            <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.subItems.map((subItem) => {
                              const isSubActive = location.pathname === subItem.path;
                              return (
                                <SidebarMenuSubItem key={subItem.path}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={isSubActive}
                                  >
                                    <a href={subItem.path}>
                                      {subItem.icon}
                                      <span>{subItem.name}</span>
                                    </a>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                // Simple menu item without sub-items
                const isActive = location.pathname === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.name}>
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

        {/* Settings at the bottom of navigation */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === '/settings'}
                  tooltip="Settings"
                >
                  <a href="/settings">
                    <Settings size={18} />
                    <span>Settings</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border">
        <div className="p-4 text-xs text-muted-foreground font-mono space-y-1">
          <div>LITADEL v1.0.0</div>
          <div className="text-green-500">● API Connected</div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
