"""WebSocket status streaming."""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from api.database import Analysis, SessionLocal
from api.state_manager import get_executor

router = APIRouter()


class ConnectionManager:
    """Manages WebSocket connections for analyses."""

    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}
        self._main_loop = None  # Will store the main event loop

    async def connect(self, analysis_id: str, websocket: WebSocket):
        """Accept and register a WebSocket connection."""
        import asyncio

        await websocket.accept()

        # Capture the main event loop on first connection
        if self._main_loop is None:
            self._main_loop = asyncio.get_event_loop()

        if analysis_id not in self.active_connections:
            self.active_connections[analysis_id] = []

        self.active_connections[analysis_id].append(websocket)

        # Register callback with executor
        executor = get_executor()
        executor.register_status_callback(analysis_id, self._create_callback(analysis_id))

    def disconnect(self, analysis_id: str, websocket: WebSocket):
        """Remove a WebSocket connection."""
        if analysis_id in self.active_connections:
            if websocket in self.active_connections[analysis_id]:
                self.active_connections[analysis_id].remove(websocket)

            # Clean up if no more connections
            if not self.active_connections[analysis_id]:
                del self.active_connections[analysis_id]

    def _create_callback(self, analysis_id: str):
        """Create a callback function for status updates."""
        import asyncio
        import logging

        logger = logging.getLogger(__name__)

        def callback(status_data: dict):
            # This is called from a worker thread, so we need thread-safe scheduling
            if self._main_loop is None:
                logger.warning(f"No event loop available for WebSocket broadcast to {analysis_id}")
                return

            try:
                # Schedule the broadcast coroutine on the main event loop from this thread
                asyncio.run_coroutine_threadsafe(self.broadcast(analysis_id, status_data), self._main_loop)
            except Exception as e:
                logger.error(f"Failed to schedule WebSocket broadcast for {analysis_id}: {e}")

        return callback

    async def broadcast(self, analysis_id: str, message: dict):
        """Broadcast a message to all connections for an analysis."""
        if analysis_id not in self.active_connections:
            return

        disconnected = []
        for connection in self.active_connections[analysis_id]:
            try:
                await connection.send_json(message)
            except:
                disconnected.append(connection)

        # Clean up disconnected clients
        for connection in disconnected:
            self.disconnect(analysis_id, connection)


# Global connection manager
manager = ConnectionManager()


@router.websocket("/api/v1/ws/analyses/{analysis_id}")
async def websocket_analysis_status(websocket: WebSocket, analysis_id: str):
    """WebSocket endpoint for real-time analysis status updates."""
    # Verify analysis exists
    db = SessionLocal()
    try:
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not analysis:
            await websocket.close(code=1008, reason="Analysis not found")
            return
    finally:
        db.close()

    # Connect
    await manager.connect(analysis_id, websocket)

    try:
        # Send initial status
        db = SessionLocal()
        try:
            analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
            if analysis:
                # Extract selected_analysts from config
                selected_analysts = []
                try:
                    import json

                    config = json.loads(analysis.config_json)
                    selected_analysts = config.get("selected_analysts", [])
                except:
                    pass

                initial_status = {
                    "type": "status_update",
                    "analysis_id": analysis.id,
                    "status": analysis.status,
                    "progress_percentage": analysis.progress_percentage,
                    "current_agent": analysis.current_agent,
                    "selected_analysts": selected_analysts,
                    "timestamp": analysis.updated_at.isoformat(),
                }
                await websocket.send_json(initial_status)
        finally:
            db.close()

        # Keep connection alive and handle messages
        while True:
            # Wait for any messages from client (like ping)
            data = await websocket.receive_text()

            # Echo back if it's a ping
            if data == "ping":
                await websocket.send_text("pong")

    except WebSocketDisconnect:
        manager.disconnect(analysis_id, websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(analysis_id, websocket)
