"""Analysis execution and state management."""

import json
import logging
import os
import threading
import traceback
import uuid
from concurrent.futures import Future, ThreadPoolExecutor
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional

from sqlalchemy.orm import Session

from api.database import Analysis, AnalysisLog, AnalysisReport, SessionLocal
from litadel.default_config import DEFAULT_CONFIG
from litadel.graph.trading_graph import TradingAgentsGraph

logger = logging.getLogger(__name__)


class AnalysisExecutor:
    """Manages analysis execution with thread pool and state tracking."""

    def __init__(self, max_workers: int = None):
        """
        Initialize the executor.
        
        Args:
            max_workers: Maximum concurrent analyses (default: from env or 4)
        """
        if max_workers is None:
            max_workers = int(os.getenv("MAX_CONCURRENT_ANALYSES", "4"))
        
        self.executor = ThreadPoolExecutor(max_workers=max_workers)
        self.active_analyses: Dict[str, Future] = {}
        self.status_callbacks: Dict[str, List[Callable]] = {}
        self._lock = threading.Lock()

    def register_status_callback(self, analysis_id: str, callback: Callable):
        """Register a callback for status updates."""
        with self._lock:
            if analysis_id not in self.status_callbacks:
                self.status_callbacks[analysis_id] = []
            self.status_callbacks[analysis_id].append(callback)

    def unregister_status_callbacks(self, analysis_id: str):
        """Remove all callbacks for an analysis."""
        with self._lock:
            if analysis_id in self.status_callbacks:
                del self.status_callbacks[analysis_id]

    def _notify_callbacks(self, analysis_id: str, status_data: Dict[str, Any]):
        """Notify all registered callbacks."""
        with self._lock:
            callbacks = self.status_callbacks.get(analysis_id, [])
        
        for callback in callbacks:
            try:
                callback(status_data)
            except Exception as e:
                print(f"Error in status callback: {e}")

    def start_analysis(
        self,
        analysis_id: str,
        ticker: str,
        analysis_date: str,
        selected_analysts: List[str],
        config: Dict[str, Any],
    ) -> str:
        """
        Start a new analysis in the background.
        
        Args:
            analysis_id: Unique analysis ID
            ticker: Ticker symbol
            analysis_date: Analysis date
            selected_analysts: List of analyst types
            config: Trading agents configuration
            
        Returns:
            analysis_id
        """
        future = self.executor.submit(
            self._run_analysis,
            analysis_id,
            ticker,
            analysis_date,
            selected_analysts,
            config,
        )
        
        with self._lock:
            self.active_analyses[analysis_id] = future
        
        # Cleanup when done
        future.add_done_callback(lambda f: self._cleanup_analysis(analysis_id))
        
        return analysis_id

    def _cleanup_analysis(self, analysis_id: str):
        """Clean up after analysis completes."""
        with self._lock:
            if analysis_id in self.active_analyses:
                del self.active_analyses[analysis_id]
        self.unregister_status_callbacks(analysis_id)

    def cancel_analysis(self, analysis_id: str) -> bool:
        """
        Attempt to cancel a running analysis.
        
        Returns:
            True if cancelled, False if not found or already completed
        """
        with self._lock:
            future = self.active_analyses.get(analysis_id)
        
        if future and not future.done():
            cancelled = future.cancel()
            if cancelled:
                # Update database status
                db = SessionLocal()
                try:
                    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
                    if analysis:
                        analysis.status = "cancelled"
                        analysis.updated_at = datetime.utcnow()
                        db.commit()
                finally:
                    db.close()
            return cancelled
        return False

    def get_status(self, analysis_id: str) -> Optional[Dict[str, Any]]:
        """Get current status of an analysis."""
        db = SessionLocal()
        try:
            analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
            if not analysis:
                return None
            
            return {
                "id": analysis.id,
                "status": analysis.status,
                "progress_percentage": analysis.progress_percentage,
                "current_agent": analysis.current_agent,
                "updated_at": analysis.updated_at,
            }
        finally:
            db.close()

    def _update_status(
        self,
        analysis_id: str,
        status: Optional[str] = None,
        progress: Optional[int] = None,
        current_agent: Optional[str] = None,
        error_message: Optional[str] = None,
    ):
        """Update analysis status in database and notify callbacks."""
        db = SessionLocal()
        try:
            analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
            if not analysis:
                return
            
            if status:
                analysis.status = status
            if progress is not None:
                analysis.progress_percentage = progress
            if current_agent:
                analysis.current_agent = current_agent
            if error_message:
                analysis.error_message = error_message
            
            analysis.updated_at = datetime.utcnow()
            
            if status == "completed":
                analysis.completed_at = datetime.utcnow()
                analysis.progress_percentage = 100
            
            db.commit()
            db.refresh(analysis)
            
            # Notify callbacks
            status_data = {
                "type": "status_update",
                "analysis_id": analysis.id,
                "status": analysis.status,
                "progress_percentage": analysis.progress_percentage,
                "current_agent": analysis.current_agent,
                "timestamp": analysis.updated_at.isoformat(),
            }
            self._notify_callbacks(analysis_id, status_data)
            
        finally:
            db.close()

    def _store_log(self, analysis_id: str, log_type: str, content: str):
        """Store a log entry."""
        db = SessionLocal()
        try:
            log = AnalysisLog(
                analysis_id=analysis_id,
                log_type=log_type,
                content=content,
                timestamp=datetime.utcnow(),
            )
            db.add(log)
            db.commit()
        finally:
            db.close()

    def _store_report(self, analysis_id: str, report_type: str, content: str):
        """Store or update a report section."""
        db = SessionLocal()
        try:
            # Check if report already exists
            report = (
                db.query(AnalysisReport)
                .filter(
                    AnalysisReport.analysis_id == analysis_id,
                    AnalysisReport.report_type == report_type,
                )
                .first()
            )
            
            if report:
                # Update existing
                report.content = content
                report.created_at = datetime.utcnow()
            else:
                # Create new
                report = AnalysisReport(
                    analysis_id=analysis_id,
                    report_type=report_type,
                    content=content,
                )
                db.add(report)
            
            db.commit()
        finally:
            db.close()

    def _run_analysis(
        self,
        analysis_id: str,
        ticker: str,
        analysis_date: str,
        selected_analysts: List[str],
        config: Dict[str, Any],
    ):
        """Execute the analysis (runs in thread pool)."""
        logger.info(f"Starting analysis {analysis_id} for {ticker} on {analysis_date}")
        try:
            # Update status to running
            self._update_status(analysis_id, status="running", progress=0)
            logger.info(f"Analysis {analysis_id}: Initializing trading graph...")
            
            # Initialize the graph with unique analysis_id for memory isolation
            graph = TradingAgentsGraph(
                selected_analysts=selected_analysts,
                config=config,
                debug=False,
                analysis_id=analysis_id,
            )
            
            # Create initial state
            init_agent_state = graph.propagator.create_initial_state(ticker, analysis_date)
            init_agent_state["asset_class"] = config.get("asset_class", "equity")
            args = graph.propagator.get_graph_args()
            
            # Track agent progress
            agent_order = self._get_agent_order(selected_analysts)
            total_agents = len(agent_order)
            current_agent_index = 0
            
            # Stream the analysis
            trace = []
            for chunk in graph.graph.stream(init_agent_state, **args):
                if len(chunk.get("messages", [])) == 0:
                    continue
                
                # Process the chunk
                last_message = chunk["messages"][-1]
                
                # Extract content
                if hasattr(last_message, "content"):
                    content = self._extract_content(last_message.content)
                    msg_type = "Reasoning"
                    
                    # Store log
                    self._store_log(analysis_id, msg_type, content)
                    
                # Handle tool calls
                if hasattr(last_message, "tool_calls") and last_message.tool_calls:
                    for tool_call in last_message.tool_calls:
                        if isinstance(tool_call, dict):
                            tool_name = tool_call["name"]
                            tool_args = tool_call["args"]
                        else:
                            tool_name = tool_call.name
                            tool_args = tool_call.args
                        
                        args_str = ", ".join(f"{k}={v}" for k, v in tool_args.items())
                        self._store_log(
                            analysis_id, "Tool Call", f"{tool_name}({args_str})"
                        )
                
                # Check for completed reports
                for report_type in [
                    "macro_report",
                    "market_report",
                    "sentiment_report",
                    "news_report",
                    "fundamentals_report",
                ]:
                    if report_type in chunk and chunk[report_type]:
                        self._store_report(analysis_id, report_type, chunk[report_type])
                        current_agent_index += 1
                        progress = int((current_agent_index / total_agents) * 100)
                        agent_name = self._get_agent_name(report_type)
                        self._update_status(
                            analysis_id,
                            progress=min(progress, 95),
                            current_agent=agent_name,
                        )
                
                # Check for investment debate state
                if "investment_debate_state" in chunk and chunk["investment_debate_state"]:
                    debate_state = chunk["investment_debate_state"]
                    if "judge_decision" in debate_state and debate_state["judge_decision"]:
                        self._store_report(
                            analysis_id, "investment_plan", debate_state["judge_decision"]
                        )
                        current_agent_index += 1
                        progress = int((current_agent_index / total_agents) * 100)
                        self._update_status(
                            analysis_id,
                            progress=min(progress, 98),
                            current_agent="Research Manager",
                        )
                
                # Check for trader plan
                if "trader_investment_plan" in chunk and chunk["trader_investment_plan"]:
                    self._store_report(
                        analysis_id, "trader_investment_plan", chunk["trader_investment_plan"]
                    )
                    self._update_status(
                        analysis_id,
                        progress=99,
                        current_agent="Trader",
                    )
                
                trace.append(chunk)
            
            # Get final state
            if trace:
                final_state = trace[-1]
                
                # Store final trade decision
                if "final_trade_decision" in final_state:
                    decision = graph.process_signal(final_state["final_trade_decision"])
                    self._store_report(
                        analysis_id, "final_trade_decision", final_state["final_trade_decision"]
                    )
                    self._store_log(
                        analysis_id, "System", f"Final decision: {decision}"
                    )
            
            # Mark as completed
            logger.info(f"Analysis {analysis_id} completed successfully")
            self._update_status(analysis_id, status="completed", progress=100)
            
        except Exception as e:
            error_msg = str(e)
            error_trace = traceback.format_exc()
            logger.error(f"Analysis {analysis_id} failed: {error_msg}")
            logger.error(f"Traceback:\n{error_trace}")
            self._update_status(
                analysis_id, status="failed", error_message=error_msg
            )
            self._store_log(analysis_id, "System", f"Error: {error_msg}\n\nTraceback:\n{error_trace}")
        finally:
            # Clean up ChromaDB collections to prevent memory leaks
            try:
                if 'graph' in locals():
                    graph.cleanup_memories()
                    logger.info(f"Analysis {analysis_id}: Cleaned up memory collections")
            except Exception as cleanup_error:
                logger.warning(f"Analysis {analysis_id}: Failed to cleanup memories: {cleanup_error}")

    def _get_agent_order(self, selected_analysts: List[str]) -> List[str]:
        """Get the order of agents for progress tracking."""
        agents = selected_analysts.copy()
        agents.extend(["bull_researcher", "bear_researcher", "research_manager", "trader", "risk", "portfolio"])
        return agents

    def _get_agent_name(self, report_type: str) -> str:
        """Get human-readable agent name from report type."""
        mapping = {
            "macro_report": "Macro Analyst",
            "market_report": "Market Analyst",
            "sentiment_report": "Social Analyst",
            "news_report": "News Analyst",
            "fundamentals_report": "Fundamentals Analyst",
        }
        return mapping.get(report_type, "Unknown")

    def _extract_content(self, content: Any) -> str:
        """Extract string content from various message formats."""
        if isinstance(content, str):
            return content
        elif isinstance(content, list):
            text_parts = []
            for item in content:
                if isinstance(item, dict):
                    if item.get("type") == "text":
                        text_parts.append(item.get("text", ""))
                    elif item.get("type") == "tool_use":
                        text_parts.append(f"[Tool: {item.get('name', 'unknown')}]")
                else:
                    text_parts.append(str(item))
            return " ".join(text_parts)
        else:
            return str(content)

    def shutdown(self):
        """Shutdown the executor and cancel all running analyses."""
        with self._lock:
            # Cancel all active analyses
            for analysis_id in list(self.active_analyses.keys()):
                self.cancel_analysis(analysis_id)
        
        # Shutdown executor
        self.executor.shutdown(wait=True)


# Global executor instance
_executor: Optional[AnalysisExecutor] = None


def get_executor() -> AnalysisExecutor:
    """Get the global executor instance."""
    global _executor
    if _executor is None:
        _executor = AnalysisExecutor()
    return _executor


def shutdown_executor():
    """Shutdown the global executor."""
    global _executor
    if _executor:
        _executor.shutdown()
        _executor = None

