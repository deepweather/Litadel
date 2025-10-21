"""WebSocket status streaming."""

import json
from typing import Dict, List

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from api.database import Analysis, SessionLocal
from api.state_manager import get_executor

router = APIRouter()


class ConnectionManager:
    """Manages WebSocket connections for analyses."""

    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, analysis_id: str, websocket: WebSocket):
        """Accept and register a WebSocket connection."""
        await websocket.accept()
        
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
        def callback(status_data: dict):
            # Note: This is called from a thread, so we can't use async here
            # The actual broadcasting happens via the websocket event loop
            import asyncio
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    asyncio.create_task(self.broadcast(analysis_id, status_data))
                else:
                    loop.run_until_complete(self.broadcast(analysis_id, status_data))
            except:
                # If no loop, we can't broadcast (connection will poll status instead)
                pass
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
                initial_status = {
                    "type": "status_update",
                    "analysis_id": analysis.id,
                    "status": analysis.status,
                    "progress_percentage": analysis.progress_percentage,
                    "current_agent": analysis.current_agent,
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

