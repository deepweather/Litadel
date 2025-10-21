"""Analysis CRUD endpoints."""

import json
import logging
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from api.auth import APIKey, get_current_api_key
from api.database import Analysis, AnalysisLog, AnalysisReport, get_db
from api.models import (
    AnalysisResponse,
    AnalysisStatusResponse,
    AnalysisSummary,
    CreateAnalysisRequest,
    LogEntry,
    ReportResponse,
)
from api.state_manager import get_executor
from tradingagents.default_config import DEFAULT_CONFIG

router = APIRouter(prefix="/api/v1/analyses", tags=["analyses"])
logger = logging.getLogger(__name__)


@router.post("", response_model=AnalysisResponse, status_code=status.HTTP_201_CREATED)
async def create_analysis(
    request: CreateAnalysisRequest,
    db: Session = Depends(get_db),
    api_key: APIKey = Depends(get_current_api_key),
):
    """Create and start a new analysis."""
    # Generate analysis ID
    analysis_id = str(uuid.uuid4())
    
    # Build configuration
    config = DEFAULT_CONFIG.copy()
    config["max_debate_rounds"] = request.research_depth
    config["max_risk_discuss_rounds"] = request.research_depth
    
    if request.llm_provider:
        config["llm_provider"] = request.llm_provider
    if request.backend_url:
        config["backend_url"] = request.backend_url
    if request.quick_think_llm:
        config["quick_think_llm"] = request.quick_think_llm
    if request.deep_think_llm:
        config["deep_think_llm"] = request.deep_think_llm
    
    # Auto-detect asset class
    from cli.asset_detection import detect_asset_class
    asset_class = detect_asset_class(request.ticker)
    config["asset_class"] = asset_class
    
    # Filter out fundamentals for commodities/crypto
    selected_analysts = request.selected_analysts
    if asset_class in ["commodity", "crypto"] and "fundamentals" in selected_analysts:
        selected_analysts = [a for a in selected_analysts if a != "fundamentals"]
    
    # Create database record
    analysis = Analysis(
        id=analysis_id,
        ticker=request.ticker,
        analysis_date=request.analysis_date,
        status="pending",
        config_json=json.dumps(config),
        progress_percentage=0,
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    
    # Start analysis in background
    logger.info(f"Creating analysis {analysis_id} for {request.ticker}")
    executor = get_executor()
    try:
        executor.start_analysis(
            analysis_id=analysis_id,
            ticker=request.ticker,
            analysis_date=request.analysis_date,
            selected_analysts=selected_analysts,
            config=config,
        )
        logger.info(f"Analysis {analysis_id} started successfully")
    except Exception as e:
        logger.error(f"Failed to start analysis {analysis_id}: {str(e)}")
        # Update status to failed
        analysis.status = "failed"
        analysis.error_message = str(e)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start analysis: {str(e)}",
        )
    
    return AnalysisResponse(
        id=analysis.id,
        ticker=analysis.ticker,
        analysis_date=analysis.analysis_date,
        status=analysis.status,
        config=config,
        reports=[],
        progress_percentage=analysis.progress_percentage,
        current_agent=analysis.current_agent,
        created_at=analysis.created_at,
        updated_at=analysis.updated_at,
        completed_at=analysis.completed_at,
        error_message=analysis.error_message,
    )


@router.get("", response_model=List[AnalysisSummary])
async def list_analyses(
    ticker: Optional[str] = Query(None, description="Filter by ticker"),
    status: Optional[str] = Query(None, description="Filter by status"),
    date_from: Optional[str] = Query(None, description="Filter by date (from)"),
    date_to: Optional[str] = Query(None, description="Filter by date (to)"),
    limit: int = Query(100, ge=1, le=1000, description="Max results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db),
    api_key: APIKey = Depends(get_current_api_key),
):
    """List all analyses with optional filtering."""
    query = db.query(Analysis)
    
    if ticker:
        query = query.filter(Analysis.ticker == ticker.upper())
    if status:
        query = query.filter(Analysis.status == status)
    if date_from:
        query = query.filter(Analysis.analysis_date >= date_from)
    if date_to:
        query = query.filter(Analysis.analysis_date <= date_to)
    
    # Order by created_at descending
    query = query.order_by(Analysis.created_at.desc())
    
    # Apply pagination
    analyses = query.offset(offset).limit(limit).all()
    
    return [
        AnalysisSummary(
            id=a.id,
            ticker=a.ticker,
            analysis_date=a.analysis_date,
            status=a.status,
            created_at=a.created_at,
            completed_at=a.completed_at,
            error_message=a.error_message,
        )
        for a in analyses
    ]


@router.get("/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(
    analysis_id: str,
    db: Session = Depends(get_db),
    api_key: APIKey = Depends(get_current_api_key),
):
    """Get full analysis details."""
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis {analysis_id} not found",
        )
    
    # Get reports
    reports = (
        db.query(AnalysisReport)
        .filter(AnalysisReport.analysis_id == analysis_id)
        .all()
    )
    
    return AnalysisResponse(
        id=analysis.id,
        ticker=analysis.ticker,
        analysis_date=analysis.analysis_date,
        status=analysis.status,
        config=json.loads(analysis.config_json),
        reports=[
            ReportResponse(
                report_type=r.report_type,
                content=r.content,
                created_at=r.created_at,
            )
            for r in reports
        ],
        progress_percentage=analysis.progress_percentage,
        current_agent=analysis.current_agent,
        created_at=analysis.created_at,
        updated_at=analysis.updated_at,
        completed_at=analysis.completed_at,
        error_message=analysis.error_message,
    )


@router.get("/{analysis_id}/status", response_model=AnalysisStatusResponse)
async def get_analysis_status(
    analysis_id: str,
    db: Session = Depends(get_db),
    api_key: APIKey = Depends(get_current_api_key),
):
    """Get current analysis status."""
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis {analysis_id} not found",
        )
    
    return AnalysisStatusResponse(
        id=analysis.id,
        status=analysis.status,
        progress_percentage=analysis.progress_percentage,
        current_agent=analysis.current_agent,
        updated_at=analysis.updated_at,
    )


@router.get("/{analysis_id}/reports", response_model=List[ReportResponse])
async def get_analysis_reports(
    analysis_id: str,
    db: Session = Depends(get_db),
    api_key: APIKey = Depends(get_current_api_key),
):
    """Get all reports for an analysis."""
    # Check if analysis exists
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis {analysis_id} not found",
        )
    
    reports = (
        db.query(AnalysisReport)
        .filter(AnalysisReport.analysis_id == analysis_id)
        .order_by(AnalysisReport.created_at)
        .all()
    )
    
    return [
        ReportResponse(
            report_type=r.report_type,
            content=r.content,
            created_at=r.created_at,
        )
        for r in reports
    ]


@router.get("/{analysis_id}/reports/{report_type}", response_model=ReportResponse)
async def get_analysis_report(
    analysis_id: str,
    report_type: str,
    db: Session = Depends(get_db),
    api_key: APIKey = Depends(get_current_api_key),
):
    """Get a specific report for an analysis."""
    report = (
        db.query(AnalysisReport)
        .filter(
            AnalysisReport.analysis_id == analysis_id,
            AnalysisReport.report_type == report_type,
        )
        .first()
    )
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report {report_type} not found for analysis {analysis_id}",
        )
    
    return ReportResponse(
        report_type=report.report_type,
        content=report.content,
        created_at=report.created_at,
    )


@router.get("/{analysis_id}/logs", response_model=List[LogEntry])
async def get_analysis_logs(
    analysis_id: str,
    log_type: Optional[str] = Query(None, description="Filter by log type"),
    limit: int = Query(100, ge=1, le=1000, description="Max results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db),
    api_key: APIKey = Depends(get_current_api_key),
):
    """Get execution logs for an analysis."""
    # Check if analysis exists
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis {analysis_id} not found",
        )
    
    query = db.query(AnalysisLog).filter(AnalysisLog.analysis_id == analysis_id)
    
    if log_type:
        query = query.filter(AnalysisLog.log_type == log_type)
    
    logs = query.order_by(AnalysisLog.timestamp).offset(offset).limit(limit).all()
    
    return [
        LogEntry(
            timestamp=log.timestamp,
            log_type=log.log_type,
            content=log.content,
        )
        for log in logs
    ]


@router.delete("/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_analysis(
    analysis_id: str,
    permanent: bool = Query(False, description="Permanently delete from database"),
    db: Session = Depends(get_db),
    api_key: APIKey = Depends(get_current_api_key),
):
    """Cancel and/or delete an analysis."""
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis {analysis_id} not found",
        )
    
    # Try to cancel if running
    if analysis.status in ["pending", "running"]:
        executor = get_executor()
        executor.cancel_analysis(analysis_id)
    
    # Delete from database if requested
    if permanent:
        db.delete(analysis)
        db.commit()
    elif analysis.status not in ["cancelled", "failed", "completed"]:
        # Just mark as cancelled
        analysis.status = "cancelled"
        analysis.updated_at = datetime.utcnow()
        db.commit()
    
    return None

