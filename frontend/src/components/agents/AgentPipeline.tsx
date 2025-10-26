import React from 'react';
import { AGENT_NAMES, type AgentName } from '../../types/analysis';
import type { AnalysisLog, AnalysisStatus } from '../../types/api';

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
    <div className={`${className}`}>
      <div className="border border-terminal-border p-2">
        <div className="space-y-1">
          {getActiveAgents.map((agentName, index) => {
            const agentStatus = getAgentStatus(agentName);
            const timing = getAgentTiming(agentName);
            const isLast = index === getActiveAgents.length - 1;

            return (
              <div key={agentName}>
                {/* Agent Card - Compact */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.7rem'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor:
                      agentStatus === 'completed' ? '#00ff00' :
                      agentStatus === 'running' ? '#00d4ff' :
                      agentStatus === 'failed' ? '#ff4444' : '#2a3e4a',
                    flexShrink: 0
                  }} />
                  <div style={{
                    flex: 1,
                    color:
                      agentStatus === 'completed' ? '#4da6ff' :
                      agentStatus === 'running' ? '#00d4ff' :
                      agentStatus === 'failed' ? '#ff4444' : '#5a6e7a',
                    fontFamily: 'JetBrains Mono, monospace',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {agentName}
                  </div>
                  {timing && agentStatus === 'completed' && (
                    <div
                      style={{
                        fontSize: '0.65rem',
                        color: '#2a3e4a',
                        fontFamily: 'JetBrains Mono, monospace',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {timing}
                    </div>
                  )}
                </div>

                {/* Connector Line */}
                {!isLast && (
                  <div
                    style={{
                      fontSize: '0.5rem',
                      color: 'hsl(var(--primary) / 0.2)',
                      fontFamily: 'JetBrains Mono, monospace',
                      paddingLeft: '0.5rem',
                      lineHeight: '0.8',
                    }}
                  >
                    │
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};