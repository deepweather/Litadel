"""Message buffer for tracking agent messages and reports in the CLI."""

import datetime
from collections import deque


class MessageBuffer:
    """Stores and manages messages, tool calls, and reports for the trading agents UI."""

    def __init__(self, max_length=100):
        self.messages = deque(maxlen=max_length)
        self.tool_calls = deque(maxlen=max_length)
        self.current_report = None
        self.final_report = None  # Store the complete final report
        # Initialize all agents as pending
        all_agents = [
            "Macro Analyst",
            "Market Analyst",
            "Social Analyst",
            "News Analyst",
            "Fundamentals Analyst",
            "Bull Researcher",
            "Bear Researcher",
            "Research Manager",
            "Trader",
            "Risky Analyst",
            "Neutral Analyst",
            "Safe Analyst",
            "Portfolio Manager",
        ]
        self.agent_status = dict.fromkeys(all_agents, "pending")
        self.current_agent = None
        self.report_sections = {
            "macro_report": None,
            "market_report": None,
            "sentiment_report": None,
            "news_report": None,
            "fundamentals_report": None,
            "investment_plan": None,
            "trader_investment_plan": None,
            "final_trade_decision": None,
        }

    def add_message(self, message_type, content):
        timestamp = datetime.datetime.now().strftime("%H:%M:%S")
        self.messages.append((timestamp, message_type, content))

    def add_tool_call(self, tool_name, args):
        timestamp = datetime.datetime.now().strftime("%H:%M:%S")
        self.tool_calls.append((timestamp, tool_name, args))

    def update_agent_status(self, agent, status):
        if agent in self.agent_status:
            self.agent_status[agent] = status
            self.current_agent = agent

    def update_report_section(self, section_name, content):
        if section_name in self.report_sections:
            self.report_sections[section_name] = content
            self._update_current_report()

    def _update_current_report(self):
        # For the panel display, only show the most recently updated section
        latest_section = None
        latest_content = None

        # Find the most recently updated section
        for section, content in self.report_sections.items():
            if content is not None:
                latest_section = section
                latest_content = content

        if latest_section and latest_content:
            # Format the current section for display
            section_titles = {
                "macro_report": "Macroeconomic Context",
                "market_report": "Market Analysis",
                "sentiment_report": "Social Sentiment",
                "news_report": "News Analysis",
                "fundamentals_report": "Fundamentals Analysis",
                "investment_plan": "Research Team Decision",
                "trader_investment_plan": "Trading Team Plan",
                "final_trade_decision": "Portfolio Management Decision",
            }
            self.current_report = f"### {section_titles[latest_section]}\n{latest_content}"

        # Update the final complete report
        self._update_final_report()

    def _update_final_report(self):
        report_parts = []

        # Analyst Team Reports
        if any(
            self.report_sections[section]
            for section in [
                "macro_report",
                "market_report",
                "sentiment_report",
                "news_report",
                "fundamentals_report",
            ]
        ):
            report_parts.append("## Analyst Team Reports")
            if self.report_sections["macro_report"]:
                report_parts.append(f"### Macroeconomic Context\n{self.report_sections['macro_report']}")
            if self.report_sections["market_report"]:
                report_parts.append(f"### Market Analysis\n{self.report_sections['market_report']}")
            if self.report_sections["sentiment_report"]:
                report_parts.append(f"### Social Sentiment\n{self.report_sections['sentiment_report']}")
            if self.report_sections["news_report"]:
                report_parts.append(f"### News Analysis\n{self.report_sections['news_report']}")
            if self.report_sections["fundamentals_report"]:
                report_parts.append(f"### Fundamentals Analysis\n{self.report_sections['fundamentals_report']}")

        # Research Team Reports
        if self.report_sections["investment_plan"]:
            report_parts.append("## Research Team Decision")
            report_parts.append(f"{self.report_sections['investment_plan']}")

        # Trading Team Reports
        if self.report_sections["trader_investment_plan"]:
            report_parts.append("## Trading Team Plan")
            report_parts.append(f"{self.report_sections['trader_investment_plan']}")

        # Portfolio Management Decision
        if self.report_sections["final_trade_decision"]:
            report_parts.append("## Portfolio Management Decision")
            report_parts.append(f"{self.report_sections['final_trade_decision']}")

        self.final_report = "\n\n".join(report_parts) if report_parts else None
