import React from 'react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { UserMenu } from './UserMenu'

export const Header: React.FC = () => {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />
      <div className="flex items-center justify-between flex-1">
        <h1 className="text-lg font-bold font-mono text-primary">
          LITADEL TRADING SYSTEM
        </h1>
        <UserMenu />
      </div>
    </header>
  )
}
