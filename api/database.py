"""Database models and connection management."""

import os
from datetime import datetime
from typing import Generator

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Integer,
    String,
    Text,
    create_engine,
    ForeignKey,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker, relationship

# Database file location
DATABASE_URL = os.getenv("API_DATABASE_URL", "sqlite:///./api_database.db")

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


class Analysis(Base):
    """Analysis metadata and configuration."""

    __tablename__ = "analyses"

    id = Column(String, primary_key=True, index=True)
    ticker = Column(String, index=True, nullable=False)
    analysis_date = Column(String, nullable=False)
    status = Column(
        String, nullable=False, default="pending"
    )  # pending, running, completed, failed, cancelled
    config_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    progress_percentage = Column(Integer, default=0)
    current_agent = Column(String, nullable=True)

    # Relationships
    logs = relationship("AnalysisLog", back_populates="analysis", cascade="all, delete-orphan")
    reports = relationship("AnalysisReport", back_populates="analysis", cascade="all, delete-orphan")


class AnalysisLog(Base):
    """Log entries from analysis execution."""

    __tablename__ = "analysis_logs"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(String, ForeignKey("analyses.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    log_type = Column(String, nullable=False)  # Tool Call, Reasoning, System
    content = Column(Text, nullable=False)

    # Relationships
    analysis = relationship("Analysis", back_populates="logs")


class AnalysisReport(Base):
    """Report sections from analysis."""

    __tablename__ = "analysis_reports"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(String, ForeignKey("analyses.id"), nullable=False)
    report_type = Column(String, nullable=False)  # market_report, news_report, etc.
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    analysis = relationship("Analysis", back_populates="reports")


class APIKey(Base):
    """API keys for authentication."""

    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, index=True)
    key_hash = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)


def init_db():
    """Initialize database and create all tables."""
    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Dependency for getting database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

