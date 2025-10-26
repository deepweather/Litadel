import React from 'react'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from './Sidebar'
import { Header } from './Header'
import { StatusBar } from './StatusBar'
import { CommandMenu } from './CommandMenu'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background text-foreground font-mono">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
          <StatusBar />
        </SidebarInset>
        <CommandMenu />
      </div>
    </SidebarProvider>
  )
}
