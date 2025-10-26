"""CLI interface for running backtests."""

import json
import sys
from datetime import datetime, timedelta
from pathlib import Path

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from litadel.backtest import BacktestConfig, BacktestEngine

app = typer.Typer(help="Litadel Backtesting CLI")
console = Console()


@app.command()
def run(
    symbol: str = typer.Argument(..., help="Ticker symbol (AAPL, BTC, BRENT, etc.)"),
    start_date: str = typer.Option(None, "--start", "-s", help="Start date (YYYY-MM-DD)"),
    end_date: str = typer.Option(None, "--end", "-e", help="End date (YYYY-MM-DD)"),
    strategy_file: Path = typer.Option(None, "--strategy", "-st", help="Path to strategy file"),
    capital: float = typer.Option(10000.0, "--capital", "-c", help="Initial capital"),
    commission: float = typer.Option(0.002, "--commission", help="Commission rate (0.002 = 0.2%)"),
    save: bool = typer.Option(False, "--save", help="Save results to JSON file"),
):
    """
    Run a backtest from the command line.

    Examples:

        # Basic backtest with default dates (last year)
        litadel-backtest run AAPL --strategy my_strategy.py

        # Custom date range
        litadel-backtest run BTC --start 2023-01-01 --end 2024-01-01 --strategy sma_cross.py

        # Save results to JSON
        litadel-backtest run MSFT --strategy my_strategy.py --save
    """
    console.print(Panel.fit("🚀 Litadel Backtest Engine", style="bold blue"))
    console.print()

    # Default dates if not provided
    if not end_date:
        end_date = datetime.now().strftime("%Y-%m-%d")
    if not start_date:
        start_date = (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d")

    # Load strategy code
    if not strategy_file:
        console.print("[red]Error: --strategy is required[/red]")
        console.print("Provide a Python file containing a Strategy class")
        sys.exit(1)

    if not strategy_file.exists():
        console.print(f"[red]Error: Strategy file not found: {strategy_file}[/red]")
        sys.exit(1)

    strategy_code = strategy_file.read_text()

    # Build config
    config = BacktestConfig(
        symbol=symbol,
        start_date=start_date,
        end_date=end_date,
        strategy_class_code=strategy_code,
        initial_capital=capital,
        commission=commission,
    )

    # Display config
    console.print("[bold]Configuration:[/bold]")
    console.print(f"  Symbol: {symbol}")
    console.print(f"  Period: {start_date} to {end_date}")
    console.print(f"  Capital: ${capital:,.2f}")
    console.print(f"  Commission: {commission * 100}%")
    console.print()

    # Execute
    with console.status("[bold green]Running backtest...", spinner="dots"):
        try:
            engine = BacktestEngine()
            result = engine.execute(config)
        except Exception as e:
            console.print(f"[red]Error: {e}[/red]")
            sys.exit(1)

    # Display results
    console.print("[bold green]✓ Backtest Complete![/bold green]")
    console.print()

    # Summary table
    table = Table(title="Performance Summary", show_header=True, header_style="bold magenta")
    table.add_column("Metric", style="cyan")
    table.add_column("Value", justify="right")

    table.add_row("Strategy", result.strategy_name)
    table.add_row("Initial Capital", f"${result.initial_capital:,.2f}")
    table.add_row("Final Value", f"${result.final_value:,.2f}")
    table.add_row("Total Return", f"{result.total_return_pct:.2f}%")
    table.add_row("Buy & Hold", f"{result.buy_hold_return_pct:.2f}%")

    alpha = result.total_return_pct - result.buy_hold_return_pct
    alpha_color = "green" if alpha > 0 else "red"
    table.add_row("Alpha", f"[{alpha_color}]{alpha:+.2f}%[/{alpha_color}]")

    if result.sharpe_ratio is not None:
        table.add_row("Sharpe Ratio", f"{result.sharpe_ratio:.2f}")
    table.add_row("Max Drawdown", f"{result.max_drawdown_pct:.2f}%")
    table.add_row("Total Trades", str(result.num_trades))

    if result.win_rate is not None:
        table.add_row("Win Rate", f"{result.win_rate:.1f}%")

    table.add_row("Execution Time", f"{result.execution_time_seconds:.2f}s")
    table.add_row("Data Source", result.data_source)

    console.print(table)
    console.print()

    # Trades summary
    if result.trades:
        console.print(f"[bold]Trades:[/bold] {len(result.trades)} executed")
        trades_table = Table(show_header=True, header_style="bold")
        trades_table.add_column("Entry", style="cyan")
        trades_table.add_column("Exit", style="cyan")
        trades_table.add_column("Size", justify="right")
        trades_table.add_column("Entry $", justify="right")
        trades_table.add_column("Exit $", justify="right")
        trades_table.add_column("P&L", justify="right")
        trades_table.add_column("Return %", justify="right")

        for trade in result.trades[:10]:  # Show first 10
            pnl_color = "green" if trade.pnl > 0 else "red"
            trades_table.add_row(
                trade.entry_time,
                trade.exit_time,
                f"{trade.size:.2f}",
                f"${trade.entry_price:.2f}",
                f"${trade.exit_price:.2f}",
                f"[{pnl_color}]${trade.pnl:,.2f}[/{pnl_color}]",
                f"[{pnl_color}]{trade.return_pct * 100:.2f}%[/{pnl_color}]",
            )

        console.print(trades_table)

        if len(result.trades) > 10:
            console.print(f"... and {len(result.trades) - 10} more trades")
    else:
        console.print("[yellow]No trades executed[/yellow]")

    console.print()

    # Save if requested
    if save:
        filename = f"backtest_{symbol}_{result.strategy_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

        # Convert to dict
        output = {
            "symbol": result.symbol,
            "strategy": result.strategy_name,
            "period": {"start": start_date, "end": end_date},
            "capital": result.initial_capital,
            "commission": commission,
            "results": {
                "final_value": result.final_value,
                "total_return_pct": result.total_return_pct,
                "buy_hold_return_pct": result.buy_hold_return_pct,
                "sharpe_ratio": result.sharpe_ratio,
                "max_drawdown_pct": result.max_drawdown_pct,
                "num_trades": result.num_trades,
                "win_rate": result.win_rate,
            },
            "trades": [
                {
                    "entry_time": trade.entry_time,
                    "exit_time": trade.exit_time,
                    "size": trade.size,
                    "entry_price": trade.entry_price,
                    "exit_price": trade.exit_price,
                    "pnl": trade.pnl,
                    "return_pct": trade.return_pct,
                }
                for trade in result.trades
            ],
            "metadata": {
                "execution_time_seconds": result.execution_time_seconds,
                "data_source": result.data_source,
            },
        }

        with open(filename, "w") as f:
            json.dump(output, f, indent=2, default=str)

        console.print(f"[green]✓ Results saved to: {filename}[/green]")


@app.command()
def validate_strategy(
    strategy_file: Path = typer.Argument(..., help="Path to strategy file"),
):
    """
    Validate a strategy file without running a backtest.

    Example:
        litadel-backtest validate-strategy my_strategy.py
    """
    console.print(Panel.fit("🔍 Strategy Validator", style="bold blue"))
    console.print()

    if not strategy_file.exists():
        console.print(f"[red]Error: Strategy file not found: {strategy_file}[/red]")
        sys.exit(1)

    strategy_code = strategy_file.read_text()

    console.print(f"Validating: [cyan]{strategy_file}[/cyan]")
    console.print()

    try:
        engine = BacktestEngine()
        strategy_class = engine._compile_strategy(strategy_code)

        console.print(f"[green]✓ Strategy valid: {strategy_class.__name__}[/green]")
        console.print(f"  Class: {strategy_class.__name__}")

        # Show parameters
        if hasattr(strategy_class, "__init__"):
            import inspect

            sig = inspect.signature(strategy_class.__init__)
            params = [p for p in sig.parameters if p != "self"]
            if params:
                console.print(f"  Parameters: {', '.join(params)}")

    except Exception as e:
        console.print("[red]✗ Strategy validation failed:[/red]")
        console.print(f"  {e}")
        sys.exit(1)


def main():
    """Entry point for CLI."""
    app()


if __name__ == "__main__":
    main()
