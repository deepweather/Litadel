import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  BarChart3,
  Briefcase,
  Home,
  MessageSquare,
  Plus,
  Settings,
  TrendingUp,
} from 'lucide-react'

export const CommandMenu: React.FC = () => {
  const [open, setOpen] = React.useState(false)
  const navigate = useNavigate()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput className="font-mono" />
      <CommandList>
        <CommandEmpty className="font-mono">No results found.</CommandEmpty>

        <CommandGroup heading="Navigation" className="font-mono">
          <CommandItem
            onSelect={() => runCommand(() => navigate('/'))}
            className="font-mono"
          >
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => navigate('/backtests/chat'))}
            className="font-mono"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>Chat Interface</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => navigate('/backtests'))}
            className="font-mono"
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            <span>Strategies</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => navigate('/analyses'))}
            className="font-mono"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            <span>Deep Dives</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => navigate('/portfolio'))}
            className="font-mono"
          >
            <Briefcase className="mr-2 h-4 w-4" />
            <span>Portfolio</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => navigate('/settings'))}
            className="font-mono"
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Actions" className="font-mono">
          <CommandItem
            onSelect={() => runCommand(() => navigate('/analyses/create'))}
            className="font-mono"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>New Deep Dive</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => navigate('/backtests/create'))}
            className="font-mono"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>New Backtest</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => navigate('/portfolio/create'))}
            className="font-mono"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>New Portfolio</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

