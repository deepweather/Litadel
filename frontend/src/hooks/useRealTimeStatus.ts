import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from './useWebSocket';
import { useAnalysisStore } from '../stores/analysisStore';
import type { WebSocketMessage } from '../types/api';
import { toast } from 'sonner';

export const useRealTimeStatus = (analysisId: string | null, initialStatus?: string) => {
  const queryClient = useQueryClient();
  const updateAnalysis = useAnalysisStore((state) => state.updateAnalysis);
  const getAnalysis = useAnalysisStore((state) => state.getAnalysis);

  // Track previous status to detect actual transitions
  const previousStatusRef = useRef<string | null>(initialStatus || null);
  const isInitializedRef = useRef(false);

  // Track which reports we've already shown toasts for (to prevent duplicates)
  const shownReportsRef = useRef<Set<string>>(new Set());

  // Debounce query invalidations to prevent excessive refetches
  const invalidationTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Helper to debounce query invalidations (prevents rapid-fire refetches)
  const debouncedInvalidate = useCallback((queryKey: any[], delay: number = 200) => {
    const keyString = JSON.stringify(queryKey);

    // Clear existing timer for this query
    const existingTimer = invalidationTimersRef.current.get(keyString);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey });
      invalidationTimersRef.current.delete(keyString);
    }, delay);

    invalidationTimersRef.current.set(keyString, timer);
  }, [queryClient]);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'status_update': {
        // Get the current/previous status before updating
        const currentAnalysis = getAnalysis(message.analysis_id);
        const previousStatus = previousStatusRef.current || currentAnalysis?.status;

        // Update the analysis in the store
        if (message.status || message.progress_percentage !== undefined || message.current_agent || message.selected_analysts) {
          updateAnalysis(message.analysis_id, {
            status: message.status,
            progress_percentage: message.progress_percentage,
            current_agent: message.current_agent,
            selected_analysts: message.selected_analysts,
          });

          // Debounced invalidation to prevent rapid-fire refetches
          debouncedInvalidate(['analysis', message.analysis_id], 100);
          debouncedInvalidate(['analysis-status', message.analysis_id], 100);

          // If analysis just completed/failed, refresh dependent views (no debounce for final state)
          if (message.status === 'completed' || message.status === 'failed') {
            queryClient.invalidateQueries({ queryKey: ['analysis-reports', message.analysis_id] });
            queryClient.invalidateQueries({ queryKey: ['analysis-logs', message.analysis_id] });
            queryClient.invalidateQueries({ queryKey: ['analyses'] });
          }
        }

        // Only show toast if status actually changed AND we're past initialization
        if (isInitializedRef.current && message.status && message.status !== previousStatus) {
          if (message.status === 'completed') {
            toast.success('Analysis completed!', {
              duration: 5000,
            });
          } else if (message.status === 'failed') {
            toast.error('Analysis failed!', {
              duration: 5000,
            });
          }
        }

        // Initialize tracking on first message (AFTER checking for toasts)
        if (!isInitializedRef.current && message.status) {
          previousStatusRef.current = message.status;
          isInitializedRef.current = true;
        } else if (message.status && isInitializedRef.current) {
          // Update previous status for subsequent messages
          previousStatusRef.current = message.status;
        }
        break;
      }

      case 'log_update':
        // Debounced invalidation for logs (multiple logs may arrive in quick succession)
        debouncedInvalidate(['analysis-logs', message.analysis_id], 300);
        break;

      case 'report_update':
        // Invalidate reports query to show new report (immediate, not debounced)
        queryClient.invalidateQueries({ queryKey: ['analysis-reports', message.analysis_id] });

        // Show toast notification for new report (with deduplication)
        if (message.report?.report_type) {
          const reportKey = `${message.analysis_id}-${message.report.report_type}`;

          // Only show toast if we haven't shown it for this report yet
          if (!shownReportsRef.current.has(reportKey)) {
            shownReportsRef.current.add(reportKey);

            const reportName = message.report.report_type
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (l) => l.toUpperCase());
            toast.success(`New report ready: ${reportName}`, {
              duration: 4000,
            });
          }
        }
        break;

      case 'error':
        toast.error(message.error || 'An error occurred', {
          duration: 5000,
        });
        break;
    }
  }, [queryClient, updateAnalysis, getAnalysis, debouncedInvalidate]);

  const { connect, disconnect, isConnected } = useWebSocket(analysisId, handleMessage);

  useEffect(() => {
    if (analysisId) {
      // Reset tracking when connecting to a new analysis
      previousStatusRef.current = initialStatus || null;
      isInitializedRef.current = false;
      shownReportsRef.current.clear(); // Clear report toast history
      connect();
    }

    return () => {
      disconnect();
      // Clear any pending invalidation timers
      invalidationTimersRef.current.forEach(timer => clearTimeout(timer));
      invalidationTimersRef.current.clear();
      // Reset tracking state
      previousStatusRef.current = null;
      isInitializedRef.current = false;
      shownReportsRef.current.clear();
    };
  }, [analysisId, connect, disconnect, initialStatus]);

  return {
    isConnected,
  };
};

