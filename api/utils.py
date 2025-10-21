"""Utility functions for the API."""

import re
from typing import List, Optional
from api.database import AnalysisReport
from api.models.responses import TradingDecision


def extract_trading_decision(reports: List[AnalysisReport]) -> Optional[TradingDecision]:
    """Extract trading decision from analysis reports."""
    # Look for final_trade_decision first, then investment_plan as fallback
    trade_report = None
    
    # Priority order: final_trade_decision > investment_plan
    for report_type in ['final_trade_decision', 'investment_plan']:
        for report in reports:
            if report.report_type == report_type:
                trade_report = report
                break
        if trade_report:
            break
    
    if not trade_report:
        return None
    
    content = trade_report.content
    
    # Initialize defaults
    decision = 'HOLD'
    confidence = None
    rationale = None
    
    # Look for patterns like "Final Verdict: Sell (partial reduction)"
    # Updated to capture everything after the colon, not just the word
    decision_patterns = [
        (r'final\s+verdict:\s*([^.\n]+)', 'extract'),
        (r'final\s+decision:\s*([^.\n]+)', 'extract'),
        (r'trade\s+decision:\s*([^.\n]+)', 'extract'),
        (r'recommendation:\s*([^.\n]+)', 'extract'),
        (r'decision:\s*([^.\n]+)', 'extract'),
        (r'verdict:\s*([^.\n]+)', 'extract'),
        (r'action:\s*([^.\n]+)', 'extract'),
        (r'suggest\s+(buying|selling|holding)', 'verb'),
        (r'recommend\s+(buying|selling|holding)', 'verb')
    ]
    
    # Check each pattern
    for pattern, pattern_type in decision_patterns:
        match = re.search(pattern, content, re.IGNORECASE | re.MULTILINE)
        if match:
            found_text = match.group(1).lower()
            
            # Extract the actual decision from the text
            if 'buy' in found_text and 'not' not in found_text and "don't" not in found_text:
                decision = 'BUY'
            elif 'sell' in found_text and 'not' not in found_text and "don't" not in found_text:
                decision = 'SELL'
            elif 'hold' in found_text:
                decision = 'HOLD'
            
            # For patterns that captured the full text after colon, use it as rationale
            if pattern_type == 'extract' and match:
                # Get the original text with proper capitalization
                rationale = match.group(0).strip()
            
            break
    
    # Extract confidence if mentioned
    confidence_match = re.search(r'(\d+)%?\s*(confidence|confident|certainty)', content, re.IGNORECASE)
    if confidence_match:
        confidence = int(confidence_match.group(1))
    
    # If no rationale was extracted from the patterns, look for the decision line
    if not rationale:
        lines = content.split('\n')
        for line in lines:
            line_lower = line.lower()
            if any(keyword in line_lower for keyword in ['verdict', 'decision', 'recommendation']):
                # This line likely contains our decision
                rationale = line.strip()
                break
    
    return TradingDecision(
        decision=decision,
        confidence=confidence,
        rationale=rationale
    )
