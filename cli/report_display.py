"""Report display functions for the Litadel CLI."""

from rich.columns import Columns
from rich.console import Console
from rich.markdown import Markdown
from rich.panel import Panel

console = Console()


def display_complete_report(final_state):
    """Display the complete analysis report with team-based panels."""
    console.print("\n[bold green]Complete Analysis Report[/bold green]\n")

    # I. Analyst Team Reports
    analyst_reports = []

    # Map report keys to analyst names
    analyst_report_map = [
        ("macro_report", "Macro Economic Analyst"),
        ("market_report", "Market Analyst"),
        ("sentiment_report", "Social Analyst"),
        ("news_report", "News Analyst"),
        ("fundamentals_report", "Fundamentals Analyst"),
    ]

    for report_key, analyst_name in analyst_report_map:
        if final_state.get(report_key):
            analyst_reports.append(
                Panel(
                    Markdown(final_state[report_key]),
                    title=analyst_name,
                    border_style="blue",
                    padding=(1, 2),
                )
            )

    if analyst_reports:
        console.print(
            Panel(
                Columns(analyst_reports, equal=True, expand=True),
                title="I. Analyst Team Reports",
                border_style="cyan",
                padding=(1, 2),
            )
        )

    # II. Research Team Reports
    if final_state.get("investment_debate_state"):
        research_reports = []
        debate_state = final_state["investment_debate_state"]

        # Bull Researcher Analysis
        if debate_state.get("bull_history"):
            research_reports.append(
                Panel(
                    Markdown(debate_state["bull_history"]),
                    title="Bull Researcher",
                    border_style="blue",
                    padding=(1, 2),
                )
            )

        # Bear Researcher Analysis
        if debate_state.get("bear_history"):
            research_reports.append(
                Panel(
                    Markdown(debate_state["bear_history"]),
                    title="Bear Researcher",
                    border_style="blue",
                    padding=(1, 2),
                )
            )

        # Research Manager Decision
        if debate_state.get("judge_decision"):
            research_reports.append(
                Panel(
                    Markdown(debate_state["judge_decision"]),
                    title="Research Manager",
                    border_style="blue",
                    padding=(1, 2),
                )
            )

        if research_reports:
            console.print(
                Panel(
                    Columns(research_reports, equal=True, expand=True),
                    title="II. Research Team Decision",
                    border_style="magenta",
                    padding=(1, 2),
                )
            )

    # III. Trading Team Reports
    if final_state.get("trader_investment_plan"):
        console.print(
            Panel(
                Panel(
                    Markdown(final_state["trader_investment_plan"]),
                    title="Trader",
                    border_style="blue",
                    padding=(1, 2),
                ),
                title="III. Trading Team Plan",
                border_style="yellow",
                padding=(1, 2),
            )
        )

    # IV. Risk Management Team Reports
    if final_state.get("risk_debate_state"):
        risk_reports = []
        risk_state = final_state["risk_debate_state"]

        # Map risk history keys to analyst names
        risk_analyst_map = [
            ("risky_history", "Aggressive Analyst"),
            ("safe_history", "Conservative Analyst"),
            ("neutral_history", "Neutral Analyst"),
        ]

        for history_key, analyst_name in risk_analyst_map:
            if risk_state.get(history_key):
                risk_reports.append(
                    Panel(
                        Markdown(risk_state[history_key]),
                        title=analyst_name,
                        border_style="blue",
                        padding=(1, 2),
                    )
                )

        if risk_reports:
            console.print(
                Panel(
                    Columns(risk_reports, equal=True, expand=True),
                    title="IV. Risk Management Team Decision",
                    border_style="red",
                    padding=(1, 2),
                )
            )

        # V. Portfolio Manager Decision
        if risk_state.get("judge_decision"):
            console.print(
                Panel(
                    Panel(
                        Markdown(risk_state["judge_decision"]),
                        title="Portfolio Manager",
                        border_style="blue",
                        padding=(1, 2),
                    ),
                    title="V. Portfolio Manager Decision",
                    border_style="green",
                    padding=(1, 2),
                )
            )
