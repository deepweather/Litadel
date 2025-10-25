"""Analysis execution and state management."""

import json
import logging
import os
import threading
import traceback
from collections.abc import Callable
from concurrent.futures import Future, ThreadPoolExecutor
from datetime import datetime
from typing import Any

from api.database import Analysis, AnalysisLog, AnalysisReport, SessionLocal
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
        self.active_analyses: dict[str, Future] = {}
        self.status_callbacks: dict[str, list[Callable]] = {}
        self._lock = threading.Lock()
        self._shutdown_flag = threading.Event()  # Flag to signal shutdown
        self._running_analysis_ids: set = set()  # Track running analyses

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

    def _notify_callbacks(self, analysis_id: str, status_data: dict[str, Any]):
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
        selected_analysts: list[str],
        config: dict[str, Any],
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

    def get_status(self, analysis_id: str) -> dict[str, Any] | None:
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
        status: str | None = None,
        progress: int | None = None,
        current_agent: str | None = None,
        error_message: str | None = None,
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

            # Extract selected_analysts from config for WebSocket updates
            selected_analysts = []
            try:
                config = json.loads(analysis.config_json)
                selected_analysts = config.get("selected_analysts", [])
            except:
                pass

            # Notify callbacks
            status_data = {
                "type": "status_update",
                "analysis_id": analysis.id,
                "status": analysis.status,
                "progress_percentage": analysis.progress_percentage,
                "current_agent": analysis.current_agent,
                "selected_analysts": selected_analysts,
                "timestamp": analysis.updated_at.isoformat(),
            }
            self._notify_callbacks(analysis_id, status_data)

        finally:
            db.close()

    def _store_log(self, analysis_id: str, log_type: str, content: str, agent_name: str = "System"):
        """Store a log entry."""
        db = SessionLocal()
        try:
            log = AnalysisLog(
                analysis_id=analysis_id,
                agent_name=agent_name,
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

            is_new_report = report is None

            if report:
                # Update existing (silent update, no broadcast)
                report.content = content
                report.created_at = datetime.utcnow()
            else:
                # Create new report
                report = AnalysisReport(
                    analysis_id=analysis_id,
                    report_type=report_type,
                    content=content,
                )
                db.add(report)

            db.commit()
            db.refresh(report)

            # Only broadcast for NEW reports, not updates
            # This prevents duplicate toasts and excessive refetches during streaming
            if is_new_report:
                report_data = {
                    "type": "report_update",
                    "analysis_id": analysis_id,
                    "report": {
                        "id": str(report.id),
                        "analysis_id": analysis_id,
                        "report_type": report_type,
                        "created_at": report.created_at.isoformat(),
                    },
                    "timestamp": datetime.utcnow().isoformat(),
                }
                self._notify_callbacks(analysis_id, report_data)

        finally:
            db.close()

    def _run_analysis(
        self,
        analysis_id: str,
        ticker: str,
        analysis_date: str,
        selected_analysts: list[str],
        config: dict[str, Any],
    ):
        """Execute the analysis (runs in thread pool)."""
        logger.info(f"Starting analysis {analysis_id} for {ticker} on {analysis_date}")

        # Register this analysis as running
        with self._lock:
            self._running_analysis_ids.add(analysis_id)

        try:
            # Check if shutdown was requested before starting
            if self._shutdown_flag.is_set():
                logger.info(f"Analysis {analysis_id} cancelled before start due to shutdown")
                self._update_status(analysis_id, status="cancelled", error_message="Cancelled due to API shutdown")
                return
            # Store selected_analysts in config for later retrieval
            config["selected_analysts"] = selected_analysts

            # Update config in database
            db = SessionLocal()
            try:
                analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
                if analysis:
                    analysis.config_json = json.dumps(config)
                    db.commit()
            finally:
                db.close()

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
            current_agent_name = "System"  # Track current agent name

            # Stream the analysis
            trace = []
            for chunk in graph.graph.stream(init_agent_state, **args):
                # Check for shutdown signal
                if self._shutdown_flag.is_set():
                    logger.info(f"Analysis {analysis_id} interrupted due to shutdown")
                    raise KeyboardInterrupt("Analysis cancelled due to API shutdown")

                if len(chunk.get("messages", [])) == 0:
                    continue

                # Determine current agent from chunk keys (node names)
                # LangGraph chunks have keys that are node names
                chunk_keys = [k for k in chunk.keys() if k != "messages"]
                if chunk_keys:
                    # Get the node name (agent name) from the chunk
                    node_name = chunk_keys[0]
                    # Some nodes have specific names, map them to agent names
                    if (
                        "Analyst" in node_name
                        or "Researcher" in node_name
                        or "Trader" in node_name
                        or "Manager" in node_name
                    ):
                        current_agent_name = node_name

                # Process the chunk
                last_message = chunk["messages"][-1]

                # Extract content
                if hasattr(last_message, "content"):
                    content = self._extract_content(last_message.content)
                    msg_type = "Reasoning"

                    # Store log with current agent name
                    self._store_log(analysis_id, msg_type, content, current_agent_name)

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
                        self._store_log(analysis_id, "Tool Call", f"{tool_name}({args_str})", current_agent_name)

                # Check for completed reports
                for report_type in [
                    "macro_report",
                    "market_report",
                    "sentiment_report",
                    "news_report",
                    "fundamentals_report",
                ]:
                    if chunk.get(report_type):
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
                if chunk.get("investment_debate_state"):
                    debate_state = chunk["investment_debate_state"]
                    if debate_state.get("judge_decision"):
                        self._store_report(analysis_id, "investment_plan", debate_state["judge_decision"])
                        current_agent_index += 1
                        progress = int((current_agent_index / total_agents) * 100)
                        self._update_status(
                            analysis_id,
                            progress=min(progress, 98),
                            current_agent="Research Manager",
                        )

                # Check for trader plan
                if chunk.get("trader_investment_plan"):
                    self._store_report(analysis_id, "trader_investment_plan", chunk["trader_investment_plan"])
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
                    self._store_report(analysis_id, "final_trade_decision", final_state["final_trade_decision"])
                    self._store_log(analysis_id, "System", f"Final decision: {decision}")

            # Mark as completed
            logger.info(f"Analysis {analysis_id} completed successfully")
            self._update_status(analysis_id, status="completed", progress=100)

        except KeyboardInterrupt:
            # Shutdown requested
            logger.info(f"Analysis {analysis_id} cancelled due to shutdown")
            self._update_status(analysis_id, status="cancelled", error_message="Cancelled due to API shutdown")
        except Exception as e:
            error_msg = str(e)
            error_trace = traceback.format_exc()
            logger.error(f"Analysis {analysis_id} failed: {error_msg}")
            logger.error(f"Traceback:\n{error_trace}")
            self._update_status(analysis_id, status="failed", error_message=error_msg)
            self._store_log(analysis_id, "System", f"Error: {error_msg}\n\nTraceback:\n{error_trace}")
        finally:
            # Unregister this analysis from running set
            with self._lock:
                self._running_analysis_ids.discard(analysis_id)
            # Clean up ChromaDB collections to prevent memory leaks
            try:
                if "graph" in locals():
                    graph.cleanup_memories()
                    logger.info(f"Analysis {analysis_id}: Cleaned up memory collections")
            except Exception as cleanup_error:
                logger.warning(f"Analysis {analysis_id}: Failed to cleanup memories: {cleanup_error}")

    def _get_agent_order(self, selected_analysts: list[str]) -> list[str]:
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
        if isinstance(content, list):
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
        return str(content)

    def shutdown(self, timeout: int = 10):
        """
        Shutdown the executor and cancel all running analyses.

        Args:
            timeout: Maximum seconds to wait for analyses to stop (default: 10)
        """
        logger.info("Shutdown requested - cancelling running analyses...")

        # Set shutdown flag to signal running analyses
        self._shutdown_flag.set()

        # Mark all running analyses as cancelled in database
        db = SessionLocal()
        try:
            with self._lock:
                running_ids = list(self._running_analysis_ids)

            for analysis_id in running_ids:
                analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
                if analysis and analysis.status == "running":
                    analysis.status = "cancelled"
                    analysis.error_message = "Cancelled due to API shutdown"
                    analysis.updated_at = datetime.utcnow()
                    logger.info(f"Marked analysis {analysis_id} as cancelled")

            db.commit()
        except Exception as e:
            logger.error(f"Error marking analyses as cancelled: {e}")
        finally:
            db.close()

        # Try to cancel futures (only works for tasks not yet started)
        with self._lock:
            for analysis_id in list(self.active_analyses.keys()):
                self.cancel_analysis(analysis_id)

        # Shutdown executor with timeout
        logger.info(f"Waiting up to {timeout} seconds for analyses to stop...")
        self.executor.shutdown(wait=True, cancel_futures=True)
        logger.info("Executor shutdown complete")


# Global executor instance
_executor: AnalysisExecutor | None = None


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
