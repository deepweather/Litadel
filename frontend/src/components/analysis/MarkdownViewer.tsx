import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

interface MarkdownViewerProps {
  content: string
  className?: string
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content, className = '' }) => {
  return (
    <div className={cn('markdown-content', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6 text-foreground">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-5 text-foreground">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-semibold mb-2 mt-4 text-foreground">{children}</h3>,
          h4: ({ children }) => <h4 className="text-base font-semibold mb-2 mt-3 text-foreground">{children}</h4>,
          h5: ({ children }) => <h5 className="text-sm font-semibold mb-1 mt-2 text-foreground">{children}</h5>,

          // Paragraphs
          p: ({ children }) => <p className="mb-3 text-sm leading-relaxed text-foreground">{children}</p>,

          // Lists
          ul: ({ children }) => <ul className="list-disc list-inside mb-3 ml-4 text-foreground">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-3 ml-4 text-foreground">{children}</ol>,
          li: ({ children }) => <li className="mb-1 text-sm text-foreground">{children}</li>,

          // Links
          a: ({ href, children }) => (
            <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),

          // Code
          code: ({ inline, children, ...props }: any) => {
            if (inline) {
              return <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground" {...props}>{children}</code>
            }
            return (
              <pre className="bg-muted p-3 rounded my-3 overflow-x-auto">
                <code className="text-xs font-mono text-foreground" {...props}>{children}</code>
              </pre>
            )
          },

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">
              {children}
            </blockquote>
          ),

          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="border-collapse table-auto w-full border border-border">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => <tr className="border-b border-border">{children}</tr>,
          th: ({ children }) => (
            <th className="border border-border px-3 py-2 text-left text-sm font-semibold text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-3 py-2 text-sm text-foreground">
              {children}
            </td>
          ),

          // Horizontal rule
          hr: () => <hr className="my-4 border-border" />,

          // Strong/Bold
          strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,

          // Emphasis/Italic
          em: ({ children }) => <em className="italic text-foreground">{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
