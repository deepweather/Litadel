import React from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { CollapsibleContent, CollapsibleTrigger, Collapsible as ShadcnCollapsible } from '@/components/ui/collapsible'

interface CollapsibleProps {
  title: string
  children: React.ReactNode
  defaultExpanded?: boolean
  count?: number
}

export const Collapsible: React.FC<CollapsibleProps> = ({
  title,
  children,
  defaultExpanded = false,
  count,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded)

  return (
    <ShadcnCollapsible
      open={isExpanded}
      onOpenChange={setIsExpanded}
      className="border border-border bg-card/50"
    >
      <CollapsibleTrigger asChild>
        <button
          className="w-full px-4 py-3 bg-transparent border-none border-b border-border text-primary font-mono text-sm font-bold cursor-pointer flex items-center justify-between transition-all hover:bg-accent/10"
          style={{ borderBottom: isExpanded ? '1px solid rgba(77, 166, 255, 0.3)' : 'none' }}
        >
          <span>
            {title}
            {count !== undefined && (
              <span className="ml-2 text-muted-foreground">
                ({count})
              </span>
            )}
          </span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="p-4 max-h-[400px] overflow-auto">
        {children}
      </CollapsibleContent>
    </ShadcnCollapsible>
  )
}
