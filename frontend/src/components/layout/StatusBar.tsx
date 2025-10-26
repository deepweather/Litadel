import React from 'react'

export const StatusBar: React.FC = () => {
  const [time, setTime] = React.useState(new Date())

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-card text-xs font-mono text-muted-foreground">
      <div className="flex items-center gap-4">
        <span className="text-green-500">● ONLINE</span>
        <span>SYSTEM: ACTIVE</span>
      </div>
      <div>
        {time.toLocaleTimeString()} | {time.toLocaleDateString()}
      </div>
    </div>
  )
}
