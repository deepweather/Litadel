from datetime import datetime
from pathlib import Path

import typer
from dotenv import load_dotenv
from rich.console import Console

# Load environment variables from .env file
load_dotenv()

from rich.align import Align
from rich.live import Live
from rich.panel import Panel

from cli.asset_detection import detect_asset_class, get_asset_class_display_name
from cli.file_handlers import setup_file_handlers
from cli.helpers import AnalystType
from cli.message_buffer import MessageBuffer
from cli.prompts import *
from cli.report_display import display_complete_report
from cli.stream_processor import process_chunk
from cli.ui_display import create_layout, update_display
from litadel.default_config import DEFAULT_CONFIG
from litadel.graph.trading_graph import TradingAgentsGraph

console = Console()

app = typer.Typer(
    name="Litadel",
    help="Litadel CLI: Multi-Agents LLM Financial Trading Framework (successor of TradingAgents)",
    add_completion=True,  # Enable shell completion
)


# Create a global message buffer instance
message_buffer = MessageBuffer()


def get_user_selections():
    """Get all user selections before starting the analysis display."""
    # Load config to check for pre-configured values
    # Display ASCII art welcome message
    with open("./cli/static/welcome.txt") as f:
        welcome_ascii = f.read()

    # Create centered welcome content using Align
    from rich.text import Text

    ascii_centered = Align.center(welcome_ascii)
    title_centered = Align.center(
        Text("Litadel: Multi-Agents LLM Financial Trading Framework - CLI", style="bold green")
    )
    subtitle_centered = Align.center(Text("Successor of TradingAgents by TaurusResearch", style="dim"))
    workflow_title = Align.center(Text("Workflow Steps:", style="bold"))
    workflow_content = Align.center(
        "I. Analyst Team → II. Research Team → III. Trader → IV. Risk Management → V. Portfolio Management"
    )

    # Create welcome box content
    from rich.console import Group

    welcome_content = Group(
        ascii_centered, Text(), title_centered, Text(), subtitle_centered, Text(), workflow_title, workflow_content
    )

    # Create and center the welcome box
    welcome_box = Panel(
        welcome_content,
        border_style="green",
        padding=(1, 2),
        title="Welcome to Litadel",
        subtitle="Multi-Agents LLM Financial Trading Framework",
    )
    console.print(Align.center(welcome_box))
    console.print()  # Add a blank line after the welcome box

    # Create a boxed questionnaire for each step
    def create_question_box(title, prompt, default=None):
        box_content = f"[bold]{title}[/bold]\n"
        box_content += f"[dim]{prompt}[/dim]"
        if default:
            box_content += f"\n[dim]Default: {default}[/dim]"
        return Panel(box_content, border_style="blue", padding=(1, 2))

    # Step 1: Ticker symbol
    console.print(create_question_box("Step 1: Ticker Symbol", "Enter the ticker symbol to analyze", "SPY"))
    selected_ticker = get_ticker()

    # Auto-detect asset class from ticker
    asset_class = detect_asset_class(selected_ticker)
    console.print(f"[dim]→ Detected asset class: [bold]{get_asset_class_display_name(asset_class)}[/bold][/dim]\n")

    # Step 2: Analysis date
    default_date = datetime.now().strftime("%Y-%m-%d")
    console.print(
        create_question_box(
            "Step 2: Analysis Date",
            "Enter the analysis date (YYYY-MM-DD)",
            default_date,
        )
    )
    analysis_date = get_analysis_date()

    # Step 3: Select analysts (use config default if available)
    if DEFAULT_CONFIG.get("default_analysts"):
        # Convert analyst names to AnalystType
        analyst_map = {
            "market": AnalystType.MARKET,
            "news": AnalystType.NEWS,
            "social": AnalystType.SOCIAL,
            "fundamentals": AnalystType.FUNDAMENTALS,
        }
        selected_analysts = [analyst_map[a] for a in DEFAULT_CONFIG["default_analysts"] if a in analyst_map]
        # Filter out fundamentals for commodities
        if asset_class == "commodity":
            selected_analysts = [a for a in selected_analysts if a != AnalystType.FUNDAMENTALS]
        console.print(
            f"[dim]→ Using configured analysts: [bold]{', '.join(a.value for a in selected_analysts)}[/bold][/dim]\n"
        )
    else:
        console.print(create_question_box("Step 3: Analysts Team", "Select your LLM analyst agents for the analysis"))
        selected_analysts = select_analysts(asset_class)
        console.print(f"[green]Selected analysts:[/green] {', '.join(analyst.value for analyst in selected_analysts)}")

    # Step 4: Research depth (use config default if available)
    if "max_debate_rounds" in DEFAULT_CONFIG:
        selected_research_depth = DEFAULT_CONFIG["max_debate_rounds"]
        depth_labels = {1: "Shallow", 2: "Medium", 3: "Deep"}
        console.print(
            f"[dim]→ Using configured research depth: [bold]{depth_labels.get(selected_research_depth, selected_research_depth)}[/bold][/dim]\n"
        )
    else:
        console.print(create_question_box("Step 4: Research Depth", "Select your research depth level"))
        selected_research_depth = select_research_depth()

    # Step 5: LLM backend (use config default if available)
    if "llm_provider" in DEFAULT_CONFIG and "backend_url" in DEFAULT_CONFIG:
        selected_llm_provider = DEFAULT_CONFIG["llm_provider"]
        backend_url = DEFAULT_CONFIG["backend_url"]
        console.print(
            f"[dim]→ Using configured LLM provider: [bold]{selected_llm_provider.upper()}[/bold] ({backend_url})[/dim]\n"
        )
    else:
        console.print(create_question_box("Step 5: LLM Backend", "Select which service to talk to"))
        selected_llm_provider, backend_url = select_llm_provider()

    # Step 6: Thinking agents (use config defaults if available)
    if "quick_think_llm" in DEFAULT_CONFIG and "deep_think_llm" in DEFAULT_CONFIG:
        selected_shallow_thinker = DEFAULT_CONFIG["quick_think_llm"]
        selected_deep_thinker = DEFAULT_CONFIG["deep_think_llm"]
        console.print(
            f"[dim]→ Using configured models:[/dim]\n"
            f"[dim]  Quick thinking: [bold]{selected_shallow_thinker}[/bold][/dim]\n"
            f"[dim]  Deep thinking: [bold]{selected_deep_thinker}[/bold][/dim]\n"
        )
    else:
        console.print(create_question_box("Step 6: Thinking Agents", "Select your thinking agents for analysis"))
        selected_shallow_thinker = select_shallow_thinking_agent(selected_llm_provider)
        selected_deep_thinker = select_deep_thinking_agent(selected_llm_provider)

    return {
        "ticker": selected_ticker,
        "analysis_date": analysis_date,
        "asset_class": asset_class,
        "analysts": selected_analysts,
        "research_depth": selected_research_depth,
        "llm_provider": selected_llm_provider.lower(),
        "backend_url": backend_url,
        "shallow_thinker": selected_shallow_thinker,
        "deep_thinker": selected_deep_thinker,
    }


def get_ticker():
    """Get ticker symbol from user input."""
    return typer.prompt("", default="SPY")


def get_analysis_date():
    """Get the analysis date from user input."""
    while True:
        date_str = typer.prompt("", default=datetime.now().strftime("%Y-%m-%d"))
        try:
            # Validate date format and ensure it's not in the future
            analysis_date = datetime.strptime(date_str, "%Y-%m-%d")
            if analysis_date.date() > datetime.now().date():
                console.print("[red]Error: Analysis date cannot be in the future[/red]")
                continue
        except ValueError:
            console.print("[red]Error: Invalid date format. Please use YYYY-MM-DD[/red]")
        else:
            return date_str


def setup_config(selections):
    """Create and configure the analysis config from user selections."""
    config = DEFAULT_CONFIG.copy()
    config["max_debate_rounds"] = selections["research_depth"]
    config["max_risk_discuss_rounds"] = selections["research_depth"]
    config["quick_think_llm"] = selections["shallow_thinker"]
    config["deep_think_llm"] = selections["deep_thinker"]
    config["backend_url"] = selections["backend_url"]
    config["llm_provider"] = selections["llm_provider"].lower()
    config["asset_class"] = selections["asset_class"]
    return config


def setup_analysis(selections, config):
    """Initialize the trading graph and file handlers."""
    # Initialize the graph
    graph = TradingAgentsGraph([analyst.value for analyst in selections["analysts"]], config=config, debug=True)

    # Create result directory and setup file handlers
    results_dir = Path(config["results_dir"]) / selections["ticker"] / selections["analysis_date"]
    log_file, report_dir = setup_file_handlers(message_buffer, results_dir)

    return graph, log_file, report_dir


def initialize_display(layout, selections):
    """Initialize the display with startup messages and agent statuses."""
    # Initial display
    update_display(layout, message_buffer)

    # Add initial messages
    message_buffer.add_message("System", f"Selected ticker: {selections['ticker']}")
    message_buffer.add_message("System", f"Analysis date: {selections['analysis_date']}")
    message_buffer.add_message(
        "System",
        f"Selected analysts: {', '.join(analyst.value for analyst in selections['analysts'])}",
    )
    update_display(layout, message_buffer)

    # Reset agent statuses
    for agent in message_buffer.agent_status:
        message_buffer.update_agent_status(agent, "pending")

    # Reset report sections
    for section in message_buffer.report_sections:
        message_buffer.report_sections[section] = None
    message_buffer.current_report = None
    message_buffer.final_report = None

    # Update agent status to in_progress for the first analyst
    first_analyst = f"{selections['analysts'][0].value.capitalize()} Analyst"
    message_buffer.update_agent_status(first_analyst, "in_progress")
    update_display(layout, message_buffer)

    # Create spinner text
    spinner_text = f"Analyzing {selections['ticker']} on {selections['analysis_date']}..."
    update_display(layout, message_buffer, spinner_text)


def run_stream_analysis(graph, selections, layout):
    """Stream the analysis and process chunks in real-time."""
    # Initialize state and get graph args
    init_agent_state = graph.propagator.create_initial_state(selections["ticker"], selections["analysis_date"])
    # CRITICAL: Add asset_class to state so market analyst can branch correctly
    init_agent_state["asset_class"] = selections["asset_class"]
    args = graph.propagator.get_graph_args()

    # Stream the analysis
    trace = []
    for chunk in graph.graph.stream(init_agent_state, **args):
        # Process the chunk and update message buffer
        if process_chunk(chunk, message_buffer, selections["analysts"]):
            # Update the display after successful chunk processing
            update_display(layout, message_buffer)

        trace.append(chunk)

    return trace


def finalize_analysis(trace, graph, selections, layout):
    """Process final results and display the complete report."""
    # Get final state and decision
    final_state = trace[-1]
    graph.process_signal(final_state["final_trade_decision"])

    # Update all agent statuses to completed
    for agent in message_buffer.agent_status:
        message_buffer.update_agent_status(agent, "completed")

    message_buffer.add_message("Analysis", f"Completed analysis for {selections['analysis_date']}")

    # Update final report sections
    for section in message_buffer.report_sections:
        if section in final_state:
            message_buffer.update_report_section(section, final_state[section])

    # Display the complete final report
    display_complete_report(final_state)

    update_display(layout, message_buffer)


def run_analysis():
    """Main analysis orchestrator - coordinates the entire trading analysis workflow."""
    # Get user selections
    selections = get_user_selections()

    # Setup configuration and initialize components
    config = setup_config(selections)
    graph, _log_file, _report_dir = setup_analysis(selections, config)

    # Create display layout and run analysis
    layout = create_layout()
    with Live(layout, refresh_per_second=4):
        # Initialize display with startup messages
        initialize_display(layout, selections)

        # Run the streaming analysis
        trace = run_stream_analysis(graph, selections, layout)

        # Process and display final results
        finalize_analysis(trace, graph, selections, layout)


@app.callback(invoke_without_command=True)
def main(ctx: typer.Context):
    """Litadel CLI - Choose your workflow."""
    if ctx.invoked_subcommand is not None:
        return

    # Show welcome and menu
    with open("./cli/static/welcome.txt") as f:
        welcome_ascii = f.read()

    from rich.text import Text

    ascii_centered = Align.center(welcome_ascii)
    title_centered = Align.center(Text("Litadel CLI", style="bold green"))
    subtitle_centered = Align.center(Text("Multi-Agents LLM Financial Trading Framework", style="dim"))

    from rich.console import Group

    welcome_content = Group(ascii_centered, Text(), title_centered, Text(), subtitle_centered)
    welcome_box = Panel(welcome_content, border_style="green", padding=(1, 2))
    console.print(Align.center(welcome_box))
    console.print()

    # Interactive menu with arrow keys
    import questionary

    choice = questionary.select(
        "Choose your workflow:",
        choices=[
            questionary.Choice("📊 Analyze - Deep dive analysis with multi-agent LLMs", value="analyze"),
            questionary.Choice("📈 Backtest - Test trading strategies with historical data", value="backtest"),
            questionary.Choice("❌ Exit", value="exit"),
        ],
        style=questionary.Style(
            [
                ("highlighted", "bold fg:cyan"),
                ("selected", "bold fg:green"),
            ]
        ),
    ).ask()

    console.print()

    if choice == "analyze":
        run_analysis()
    elif choice == "backtest":
        ctx.invoke(backtest)
    else:
        console.print("[yellow]Goodbye![/yellow]")


@app.command()
def analyze():
    """Run a comprehensive analysis on a ticker."""
    run_analysis()


@app.command()
def backtest():
    """Run an interactive backtest for a trading strategy."""
    # Show welcome screen
    with open("./cli/static/welcome.txt") as f:
        welcome_ascii = f.read()

    from rich.text import Text

    ascii_centered = Align.center(welcome_ascii)
    title_centered = Align.center(Text("Litadel: Strategy Backtesting", style="bold green"))
    subtitle_centered = Align.center(Text("Test your trading strategies with historical data", style="dim"))

    from rich.console import Group

    welcome_content = Group(ascii_centered, Text(), title_centered, Text(), subtitle_centered)
    welcome_box = Panel(welcome_content, border_style="green", padding=(1, 2))
    console.print(Align.center(welcome_box))
    console.print()

    def create_question_box(title, prompt, default=None):
        box_content = f"[bold]{title}[/bold]\n[dim]{prompt}[/dim]"
        if default:
            box_content += f"\n[dim]Default: {default}[/dim]"
        return Panel(box_content, border_style="blue", padding=(1, 2))

    # Step 1: Ticker
    console.print(create_question_box("Step 1: Ticker Symbol", "Enter ticker to backtest", "AAPL"))
    symbol = typer.prompt("", default="AAPL")

    from cli.asset_detection import detect_asset_class

    asset_class = detect_asset_class(symbol)
    console.print(f"[dim]→ Detected asset class: [bold]{get_asset_class_display_name(asset_class)}[/bold][/dim]\n")

    # Step 2: Date range
    from dateutil.relativedelta import relativedelta

    default_end = datetime.now().strftime("%Y-%m-%d")
    default_start = (datetime.now() - relativedelta(years=1)).strftime("%Y-%m-%d")

    console.print(create_question_box("Step 2: Start Date", "Enter backtest start date (YYYY-MM-DD)", default_start))
    start_date = typer.prompt("", default=default_start)

    console.print(create_question_box("Step 3: End Date", "Enter backtest end date (YYYY-MM-DD)", default_end))
    end_date = typer.prompt("", default=default_end)

    # Step 4: Strategy description
    console.print(
        create_question_box(
            "Step 4: Strategy Description",
            "Describe your trading strategy in plain English\nExample: 'Buy when RSI below 30, sell when RSI above 70'",
            None,
        )
    )
    strategy_description = typer.prompt("")

    # Step 5: Capital
    console.print(create_question_box("Step 5: Initial Capital", "Enter initial capital for backtest", "$100,000"))
    capital = typer.prompt("", default=100000.0, type=float)

    # Step 6: Commission
    console.print(create_question_box("Step 6: Commission Rate", "Enter commission rate (0.002 = 0.2%)", "0.002"))
    commission = typer.prompt("", default=0.002, type=float)

    console.print()

    # Summary
    console.print(
        Panel.fit(
            f"[bold]Backtest Configuration[/bold]\n\n"
            f"Ticker: {symbol} ({asset_class})\n"
            f"Period: {start_date} to {end_date}\n"
            f"Capital: ${capital:,.0f}\n"
            f"Commission: {commission * 100:.2f}%",
            border_style="blue",
        )
    )
    console.print()

    # Generate strategy code
    from langchain_openai import ChatOpenAI

    from litadel.agents.utils.strategy_code_generator_agent import (
        create_strategy_code_generator,
        validate_strategy_code,
    )
    from litadel.backtest import BacktestConfig, BacktestEngine

    console.print("[yellow]Generating strategy code with LLM...[/yellow]")
    llm = ChatOpenAI(model="gpt-4o-mini")
    generator = create_strategy_code_generator(llm)

    strategy_code = generator(
        strategy_description=strategy_description,
        ticker=symbol,
        indicators=[],
        entry_conditions={},
        exit_conditions={},
        risk_params={},
    )

    # Validate and auto-fix
    console.print("[yellow]Validating strategy code...[/yellow]")
    is_valid, message, fixed_code = validate_strategy_code(strategy_code, llm)

    if not is_valid:
        console.print(f"[red]Validation failed: {message}[/red]")
        return

    console.print("[green]✓ Strategy validated[/green]\n")

    # Show strategy code
    from rich.syntax import Syntax

    syntax = Syntax(fixed_code, "python", theme="monokai", line_numbers=True)
    console.print(Panel(syntax, title="Generated Strategy Code", border_style="green"))

    # Confirm before running
    console.print()
    if not typer.confirm("Run backtest with this strategy?", default=True):
        console.print("[yellow]Backtest cancelled[/yellow]")
        return

    # Execute backtest
    console.print("\n[yellow]Running backtest...[/yellow]")

    config = BacktestConfig(
        symbol=symbol,
        start_date=start_date,
        end_date=end_date,
        strategy_class_code=fixed_code,
        initial_capital=capital,
        commission=commission,
        asset_class=asset_class,
    )

    engine = BacktestEngine()
    result = engine.execute(config)

    # Display results
    console.print("\n" + "=" * 70)

    profit = result.final_value - result.initial_capital
    profit_color = "green" if profit >= 0 else "red"

    sharpe_str = f"{result.sharpe_ratio:.2f}" if result.sharpe_ratio else "N/A"
    win_rate_str = f"{result.win_rate:.1f}%" if result.win_rate else "N/A"
    profit_factor_str = f"{result.profit_factor:.2f}" if result.profit_factor else "N/A"

    results_text = (
        f"[bold green]Backtest Results[/bold green]\n\n"
        f"[bold]Capital & Returns:[/bold]\n"
        f"  Initial Capital: ${result.initial_capital:,.2f}\n"
        f"  Final Value: ${result.final_value:,.2f}\n"
        f"  Profit/Loss: [{profit_color}]${profit:+,.2f}[/{profit_color}]\n"
        f"  Total Return: [bold]{result.total_return_pct:+.2f}%[/bold]\n"
        f"  Buy & Hold: {result.buy_hold_return_pct:+.2f}%\n\n"
        f"[bold]Risk Metrics:[/bold]\n"
        f"  Sharpe Ratio: {sharpe_str}\n"
        f"  Max Drawdown: {result.max_drawdown_pct:.2f}%\n\n"
        f"[bold]Trading:[/bold]\n"
        f"  Total Trades: {result.num_trades}\n"
        f"  Win Rate: {win_rate_str}\n"
        f"  Profit Factor: {profit_factor_str}\n"
        f"  Exposure: {result.exposure_time_pct:.1f}%\n\n"
        f"Execution Time: {result.execution_time_seconds:.2f}s"
    )

    console.print(Panel.fit(results_text, border_style=profit_color if profit != 0 else "yellow"))


if __name__ == "__main__":
    app()
