import React from 'react';
import type { AnalysisReport } from '../../types/api';
import { Copy, Download } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReportViewerProps {
  reports: AnalysisReport[];
}

export const ReportViewer: React.FC<ReportViewerProps> = ({ reports }) => {
  const handleCopyReport = (report: AnalysisReport) => {
    navigator.clipboard.writeText(report.content || '');
    toast.success(`${report.report_type.replace('_', ' ')} copied to clipboard`, {
      style: {
        background: '#1a2a3a',
        color: '#4da6ff',
        border: '1px solid #4da6ff',
        fontFamily: 'JetBrains Mono, monospace',
      },
    });
  };

  const handleDownloadReport = (report: AnalysisReport) => {
    const blob = new Blob([report.content || ''], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.report_type}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (reports.length === 0) {
    return (
      <div className="text-terminal-dim text-center py-8">
        No reports available yet
      </div>
    );
  }

  // Order reports by importance
  const reportOrder = [
    'FINAL_TRADE_DECISION',
    'final_trade_decision',
    'TRADE_DECISION',
    'trade_decision',
    'INVESTMENT_PLAN',
    'investment_plan',
    'TRADER_INVESTMENT_PLAN',
    'trader_investment_plan',
    'MACRO_REPORT',
    'macro_report',
    'MARKET_REPORT',
    'market_report',
    'SENTIMENT_REPORT',
    'sentiment_report',
    'NEWS_REPORT',
    'news_report',
    'FUNDAMENTALS_REPORT',
    'fundamentals_report'
  ];

  const sortedReports = [...reports].sort((a, b) => {
    const aIndex = reportOrder.indexOf(a.report_type);
    const bIndex = reportOrder.indexOf(b.report_type);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  return (
    <div className="space-y-4">
      {sortedReports.map((report, idx) => {
        // Determine report variant based on type
        const isTradeDecision = report.report_type.toLowerCase().includes('trade_decision');

        // Extract first few lines as summary
        const lines = (report.content || '').split('\n').filter(line => line.trim());
        const summary = lines.slice(0, 3).join(' ').substring(0, 200) + '...';

        const key = report.id || `${report.analysis_id}-${report.report_type}-${idx}`;
        return (
          <div
            key={key}
            style={{
              border: isTradeDecision ? '2px solid #4da6ff' : '1px solid rgba(77, 166, 255, 0.3)',
              backgroundColor: isTradeDecision ? 'rgba(77, 166, 255, 0.02)' : 'transparent',
              padding: '1rem',
              fontFamily: 'JetBrains Mono, monospace'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'start',
              marginBottom: '1rem'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: 'bold',
                color: isTradeDecision ? '#00d4ff' : '#4da6ff',
                margin: 0
              }}>
                {report.report_type.replace(/_/g, ' ').toUpperCase()}
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleCopyReport(report)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    border: '1px solid rgba(77, 166, 255, 0.3)',
                    backgroundColor: 'transparent',
                    color: '#4da6ff',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#4da6ff';
                    e.currentTarget.style.backgroundColor = 'rgba(77, 166, 255, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(77, 166, 255, 0.3)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Copy size={12} />
                  COPY
                </button>
                <button
                  onClick={() => handleDownloadReport(report)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    border: '1px solid rgba(77, 166, 255, 0.3)',
                    backgroundColor: 'transparent',
                    color: '#4da6ff',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#4da6ff';
                    e.currentTarget.style.backgroundColor = 'rgba(77, 166, 255, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(77, 166, 255, 0.3)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Download size={12} />
                  SAVE
                </button>
              </div>
            </div>

            {/* Summary */}
            <div style={{
              fontSize: '0.75rem',
              color: '#5a6e7a',
              marginBottom: '0.75rem',
              fontStyle: 'italic'
            }}>
              {summary}
            </div>

            {/* Full Content */}
            <details>
              <summary style={{
                cursor: 'pointer',
                color: '#00d4ff',
                fontSize: '0.75rem',
                marginBottom: '0.5rem',
                userSelect: 'none'
              }}>
                VIEW FULL REPORT
              </summary>
              <div
                style={{
                  marginTop: '0.75rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid rgba(77, 166, 255, 0.2)',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  width: '100%'
                }}
              >
                <pre
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.875rem',
                    color: '#4da6ff',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    margin: 0,
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  {report.content}
                </pre>
              </div>
            </details>
          </div>
        );
      })}
    </div>
  );
};