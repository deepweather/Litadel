"""Stream processing logic for handling agent analysis chunks in the TradingAgents CLI."""

from cli.helpers import extract_content_string, update_research_team_status


def process_message_chunk(chunk, message_buffer):
    """
    Process message content and tool calls from a chunk.
    
    Args:
        chunk: The chunk dictionary from the graph stream
        message_buffer: The MessageBuffer instance to update
    """
    if len(chunk["messages"]) == 0:
        return
    
    # Get the last message from the chunk
    last_message = chunk["messages"][-1]
    
    # Extract message content and type
    if hasattr(last_message, "content"):
        content = extract_content_string(last_message.content)
        msg_type = "Reasoning"
    else:
        content = str(last_message)
        msg_type = "System"
    
    # Add message to buffer
    message_buffer.add_message(msg_type, content)
    
    # If it's a tool call, add it to tool calls
    if hasattr(last_message, "tool_calls"):
        for tool_call in last_message.tool_calls:
            # Handle both dictionary and object tool calls
            if isinstance(tool_call, dict):
                message_buffer.add_tool_call(
                    tool_call["name"], tool_call["args"]
                )
            else:
                message_buffer.add_tool_call(tool_call.name, tool_call.args)


def process_analyst_reports(chunk, message_buffer, selected_analysts):
    """
    Process analyst team reports from chunk.
    
    Args:
        chunk: The chunk dictionary from the graph stream
        message_buffer: The MessageBuffer instance to update
        selected_analysts: List of selected analyst types
    """
    # Mapping of report keys to analyst info
    analyst_mappings = [
        ("market_report", "Market Analyst", "social", "Social Analyst"),
        ("sentiment_report", "Social Analyst", "news", "News Analyst"),
        ("news_report", "News Analyst", "fundamentals", "Fundamentals Analyst"),
        ("fundamentals_report", "Fundamentals Analyst", None, None),
    ]
    
    for report_key, analyst_name, next_type, next_analyst in analyst_mappings:
        if report_key in chunk and chunk[report_key]:
            message_buffer.update_report_section(report_key, chunk[report_key])
            message_buffer.update_agent_status(analyst_name, "completed")
            
            if report_key == "fundamentals_report":
                # Special case: set all research team to in_progress
                update_research_team_status(message_buffer, "in_progress")
            elif next_type and next_type in [a.value for a in selected_analysts]:
                message_buffer.update_agent_status(next_analyst, "in_progress")


def process_research_debate(chunk, message_buffer):
    """
    Process research team investment debate state from chunk.
    
    Args:
        chunk: The chunk dictionary from the graph stream
        message_buffer: The MessageBuffer instance to update
    """
    if "investment_debate_state" not in chunk or not chunk["investment_debate_state"]:
        return
    
    debate_state = chunk["investment_debate_state"]
    
    # Update Bull Researcher status and report
    if "bull_history" in debate_state and debate_state["bull_history"]:
        # Keep all research team members in progress
        update_research_team_status(message_buffer, "in_progress")
        # Extract latest bull response
        bull_responses = debate_state["bull_history"].split("\n")
        latest_bull = bull_responses[-1] if bull_responses else ""
        if latest_bull:
            message_buffer.add_message("Reasoning", latest_bull)
            # Update research report with bull's latest analysis
            message_buffer.update_report_section(
                "investment_plan",
                f"### Bull Researcher Analysis\n{latest_bull}",
            )
    
    # Update Bear Researcher status and report
    if "bear_history" in debate_state and debate_state["bear_history"]:
        # Keep all research team members in progress
        update_research_team_status(message_buffer, "in_progress")
        # Extract latest bear response
        bear_responses = debate_state["bear_history"].split("\n")
        latest_bear = bear_responses[-1] if bear_responses else ""
        if latest_bear:
            message_buffer.add_message("Reasoning", latest_bear)
            # Update research report with bear's latest analysis
            message_buffer.update_report_section(
                "investment_plan",
                f"{message_buffer.report_sections['investment_plan']}\n\n### Bear Researcher Analysis\n{latest_bear}",
            )
    
    # Update Research Manager status and final decision
    if "judge_decision" in debate_state and debate_state["judge_decision"]:
        # Keep all research team members in progress until final decision
        update_research_team_status(message_buffer, "in_progress")
        message_buffer.add_message(
            "Reasoning",
            f"Research Manager: {debate_state['judge_decision']}",
        )
        # Update research report with final decision
        message_buffer.update_report_section(
            "investment_plan",
            f"{message_buffer.report_sections['investment_plan']}\n\n### Research Manager Decision\n{debate_state['judge_decision']}",
        )
        # Mark all research team members as completed
        update_research_team_status(message_buffer, "completed")
        # Set first risk analyst to in_progress
        message_buffer.update_agent_status("Risky Analyst", "in_progress")


def process_trader_report(chunk, message_buffer):
    """
    Process trader investment plan from chunk.
    
    Args:
        chunk: The chunk dictionary from the graph stream
        message_buffer: The MessageBuffer instance to update
    """
    if "trader_investment_plan" in chunk and chunk["trader_investment_plan"]:
        message_buffer.update_report_section(
            "trader_investment_plan", chunk["trader_investment_plan"]
        )
        # Set first risk analyst to in_progress
        message_buffer.update_agent_status("Risky Analyst", "in_progress")


def process_risk_debate(chunk, message_buffer):
    """
    Process risk management team debate state from chunk.
    
    Args:
        chunk: The chunk dictionary from the graph stream
        message_buffer: The MessageBuffer instance to update
    """
    if "risk_debate_state" not in chunk or not chunk["risk_debate_state"]:
        return
    
    risk_state = chunk["risk_debate_state"]
    
    # Handle all risk analysts with a mapping
    risk_analysts = [
        ("current_risky_response", "Risky Analyst"),
        ("current_safe_response", "Safe Analyst"),
        ("current_neutral_response", "Neutral Analyst"),
    ]
    
    for response_key, analyst_name in risk_analysts:
        if response_key in risk_state and risk_state[response_key]:
            message_buffer.update_agent_status(analyst_name, "in_progress")
            message_buffer.add_message(
                "Reasoning",
                f"{analyst_name}: {risk_state[response_key]}",
            )
            message_buffer.update_report_section(
                "final_trade_decision",
                f"### {analyst_name} Analysis\n{risk_state[response_key]}",
            )
    
    # Update Portfolio Manager status and final decision
    if "judge_decision" in risk_state and risk_state["judge_decision"]:
        message_buffer.update_agent_status(
            "Portfolio Manager", "in_progress"
        )
        message_buffer.add_message(
            "Reasoning",
            f"Portfolio Manager: {risk_state['judge_decision']}",
        )
        # Update risk report with final decision only
        message_buffer.update_report_section(
            "final_trade_decision",
            f"### Portfolio Manager Decision\n{risk_state['judge_decision']}",
        )
        # Mark risk analysts as completed
        message_buffer.update_agent_status("Risky Analyst", "completed")
        message_buffer.update_agent_status("Safe Analyst", "completed")
        message_buffer.update_agent_status("Neutral Analyst", "completed")
        message_buffer.update_agent_status("Portfolio Manager", "completed")


def process_chunk(chunk, message_buffer, selected_analysts):
    """
    Process a single chunk from the graph stream, updating the message buffer
    with messages, reports, and agent statuses.
    
    Args:
        chunk: The chunk dictionary from the graph stream
        message_buffer: The MessageBuffer instance to update
        selected_analysts: List of selected analyst types
    
    Returns:
        bool: True if chunk was processed, False if chunk had no messages
    """
    if len(chunk["messages"]) == 0:
        return False
    
    # Process messages and tool calls
    process_message_chunk(chunk, message_buffer)
    
    # Process different report types
    process_analyst_reports(chunk, message_buffer, selected_analysts)
    process_research_debate(chunk, message_buffer)
    process_trader_report(chunk, message_buffer)
    process_risk_debate(chunk, message_buffer)
    
    return True

