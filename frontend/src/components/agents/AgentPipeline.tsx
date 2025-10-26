import React from 'react';
import { AGENT_NAMES, type AgentName } from '../../types/analysis';
import type { AnalysisLog, AnalysisStatus } from '../../types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AgentPipelineProps {
  currentAgent: string | null;
  status: AnalysisStatus;
  className?: string;
  logs?: AnalysisLog[];
  selectedAnalysts?: string[];  // NEW: Filter agents based on selection
}

export const AgentPipeline: React.FC<AgentPipelineProps> = ({
  currentAgent,
  status,
  className = '',
  logs = [],
  selectedAnalysts = [],
}) => {
  // Determine which agents will actually run based on selected_analysts
  const getActiveAgents = React.useMemo((): AgentName[] => {
    if (!selectedAnalysts || selectedAnalysts.length === 0) {
      // If no selection, show all agents (backward compatibility)
      return [...AGENT_NAMES];
    }

    const agents: AgentName[] = [];

    // Add selected analyst agents in order
    if (selectedAnalysts.includes('macro')) agents.push('Macro Analyst');
    if (selectedAnalysts.includes('market')) agents.push('Market Analyst');
    if (selectedAnalysts.includes('social')) agents.push('Social Media Analyst');
    if (selectedAnalysts.includes('news')) agents.push('News Analyst');
    if (selectedAnalysts.includes('fundamentals')) agents.push('Fundamentals Analyst');

    // Always add downstream agents that run for all analyses
    agents.push('Bull Researcher');
    agents.push('Bear Researcher');
    agents.push('Research Manager');
    agents.push('Trader');
    agents.push('Risky Analyst');
    agents.push('Conservative Analyst');
    agents.push('Neutral Analyst');
    agents.push('Risk Manager');

    return agents;
  }, [selectedAnalysts]);

  // If backend currentAgent is missing or stale, infer the most recent agent from logs
  const inferredCurrentAgent = React.useMemo(() => {
    if (currentAgent) return currentAgent;
    if (!logs || logs.length === 0) return null;
    const latest = logs[logs.length - 1];
    return latest?.agent_name || null;
  }, [currentAgent, logs]);
  // Calculate timing for each agent
  const getAgentTiming = (agentName: AgentName): string | null => {
    if (!logs || logs.length === 0) return null;

    const agentLogs = logs.filter(log => log.agent_name === agentName);
    if (agentLogs.length === 0) return null;

    // Parse timestamps with the same server-aware rules used elsewhere
    const toMs = (v: string) => {
      const d = new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(v) ? v : v.replace(' ', 'T') + 'Z');
      return d.getTime();
    };
    const firstLog = toMs(agentLogs[0].timestamp);
    const lastLog = toMs(agentLogs[agentLogs.length - 1].timestamp);
    const diff = Math.floor((lastLog - firstLog) / 1000);

    if (diff === 0) return null;

    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getAgentStatus = (agentName: AgentName): 'pending' | 'running' | 'completed' | 'failed' => {
    if (status === 'failed') {
      // If analysis failed, mark current agent as failed, previous as completed, rest as pending
      const currentIndex = AGENT_NAMES.indexOf((inferredCurrentAgent as AgentName) || (currentAgent as AgentName));
      const agentIndex = AGENT_NAMES.indexOf(agentName);

      if (agentIndex < currentIndex) return 'completed';
      if (agentIndex === currentIndex) return 'failed';
      return 'pending';
    }

    if (status === 'completed') {
      return 'completed';
    }

    if (!inferredCurrentAgent) {
      return 'pending';
    }

    const currentIndex = getActiveAgents.indexOf(inferredCurrentAgent as AgentName);
    const agentIndex = getActiveAgents.indexOf(agentName);

    if (agentIndex < currentIndex) return 'completed';
    if (agentIndex === currentIndex) return 'running';
    return 'pending';
  };

  return (
    <Card className={cn('py-3 gap-3', className)}>
      <CardHeader className="pb-0 px-4">
        <CardTitle className="text-sm font-mono">Pipeline</CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-0">
        <div className="space-y-0.5">
          {getActiveAgents.map((agentName, index) => {
            const agentStatus = getAgentStatus(agentName);
            const timing = getAgentTiming(agentName);
            const isLast = index === getActiveAgents.length - 1;

            return (
              <div key={agentName}>
                {/* Agent Row */}
                <div className="flex items-center gap-1.5 text-[0.7rem] font-mono">
                  {/* Status Indicator */}
                  <div
                    className={cn(
                      'w-1.5 h-1.5 rounded-full shrink-0 transition-colors',
                      agentStatus === 'completed' && 'bg-green-500',
                      agentStatus === 'running' && 'bg-primary animate-pulse',
                      agentStatus === 'failed' && 'bg-destructive',
                      agentStatus === 'pending' && 'bg-muted'
                    )}
                  />

                  {/* Agent Name */}
                  <div
                    className={cn(
                      'flex-1 truncate transition-colors',
                      agentStatus === 'completed' && 'text-primary',
                      agentStatus === 'running' && 'text-primary font-semibold',
                      agentStatus === 'failed' && 'text-destructive',
                      agentStatus === 'pending' && 'text-muted-foreground'
                    )}
                  >
                    {agentName}
                  </div>

                  {/* Timing */}
                  {timing && agentStatus === 'completed' && (
                    <div className="text-[0.65rem] text-muted-foreground shrink-0">
                      {timing}
                    </div>
                  )}
                </div>

                {/* Connector Line */}
                {!isLast && (
                  <div className="text-[0.5rem] text-border font-mono pl-1.5 leading-tight">
                    │
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};