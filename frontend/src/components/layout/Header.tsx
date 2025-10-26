import React from 'react'
import { useNavigate } from 'react-router-dom'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { UserMenu } from './UserMenu'
import { ThemeToggle } from './ThemeToggle'
import { NotificationCenter } from './NotificationCenter'
import { QuickCreate } from './QuickCreate'
import { useBreadcrumbs } from '../../hooks/useBreadcrumbs'
import { Command, Wifi, WifiOff } from 'lucide-react'

export const Header: React.FC = () => {
  const navigate = useNavigate()
  const breadcrumbs = useBreadcrumbs()
  const [isOnline, setIsOnline] = React.useState(navigator.onLine)

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Mobile menu trigger */}
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-6" />

      {/* Logo/Brand - hidden on mobile */}
      <div className="hidden lg:flex items-center gap-2 mr-2">
        <span className="text-sm font-bold font-mono text-primary">
          LITADEL
        </span>
      </div>

      {/* Breadcrumbs - main navigation context */}
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              <BreadcrumbItem>
                {crumb.isCurrentPage ? (
                  <BreadcrumbPage className="font-mono">
                    {crumb.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    onClick={() => crumb.href && navigate(crumb.href)}
                    className="font-mono"
                  >
                    {crumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side: Actions + Status + User Menu */}
      <div className="flex items-center gap-2">
        {/* Command Menu Trigger */}
        <Button
          variant="outline"
          size="default"
          className="hidden sm:flex items-center gap-2 font-mono text-sm h-9 px-4 min-w-[200px] justify-between bg-muted/50"
          onClick={() => {
            const event = new KeyboardEvent('keydown', {
              key: 'k',
              metaKey: true,
              bubbles: true,
            })
            document.dispatchEvent(event)
          }}
        >
          <div className="flex items-center gap-2">
            <Command className="size-4" />
            <span className="text-muted-foreground">Search...</span>
          </div>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        {/* Quick Create */}
        <QuickCreate />

        <Separator orientation="vertical" className="h-6 hidden sm:block" />

        {/* Notifications */}
        <NotificationCenter />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Connection Status */}
        <Badge
          variant={isOnline ? "default" : "destructive"}
          className="hidden lg:flex items-center gap-1.5 font-mono"
        >
          {isOnline ? (
            <>
              <Wifi className="size-3" />
              <span className="text-xs">ONLINE</span>
            </>
          ) : (
            <>
              <WifiOff className="size-3" />
              <span className="text-xs">OFFLINE</span>
            </>
          )}
        </Badge>

        <Separator orientation="vertical" className="h-6" />

        {/* User Menu */}
        <UserMenu />
      </div>
    </header>
  )
}
