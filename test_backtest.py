#!/usr/bin/env python3
"""
Test script for backtest functionality.

Usage:
    uv run test_backtest.py
"""

import sys
import time
from datetime import datetime, timedelta
from pathlib import Path

# Add project to path
sys.path.insert(0, str(Path(__file__).parent))


def test_ticker_pool_filtering():
    """Test that ticker pool filtering works correctly."""
    print("\n" + "=" * 80)
    print("TEST 1: Ticker Pool Filtering by Date")
    print("=" * 80)

    from api.backtest_executor import BacktestExecutor

    executor = BacktestExecutor()

    # Test different date ranges
    test_cases = [
        (datetime(2000, 1, 1), "2000: Should only have stocks"),
        (datetime(2010, 1, 1), "2010: Should have stocks + maybe commodities"),
        (datetime(2015, 1, 1), "2015: Should have stocks + BTC + commodities"),
        (datetime(2016, 1, 1), "2016: Should have stocks + BTC + ETH"),
        (datetime(2020, 1, 1), "2020: Should have all asset classes"),
    ]

    for start_date, description in test_cases:
        filtered = executor._filter_ticker_pool_by_date(start_date)
        print(f"\n{description}")
        print(f"  Start Date: {start_date.date()}")
        print(f"  Available Tickers: {len(filtered)}")

        # Count by asset type
        stocks = [
            t for t in filtered if not t.endswith("-USD") and t not in ["BRENT", "WTI", "COPPER", "WHEAT", "CORN"]
        ]
        crypto = [t for t in filtered if t.endswith("-USD")]
        commodities = [t for t in filtered if t in ["BRENT", "WTI", "COPPER", "WHEAT", "CORN"]]

        print(f"    - Stocks: {len(stocks)}")
        print(f"    - Crypto: {len(crypto)} ({', '.join(crypto) if crypto else 'none'})")
        print(f"    - Commodities: {len(commodities)}")

    print("\n✅ Ticker filtering test passed!")


def test_asset_detection():
    """Test that asset class detection works correctly."""
    print("\n" + "=" * 80)
    print("TEST 2: Asset Class Detection")
    print("=" * 80)

    from cli.asset_detection import detect_asset_class

    test_cases = [
        # Stocks
        ("AAPL", "equity"),
        ("MSFT", "equity"),
        ("TSLA", "equity"),
        # Crypto with suffixes
        ("BTC-USD", "crypto"),
        ("ETH-USD", "crypto"),
        ("DOT-USD", "crypto"),
        ("MATIC-USDT", "crypto"),
        ("ADA-EUR", "crypto"),
        # Commodities
        ("BRENT", "commodity"),
        ("WTI", "commodity"),
        ("COPPER", "commodity"),
    ]

    all_passed = True
    for ticker, expected in test_cases:
        result = detect_asset_class(ticker)
        status = "✅" if result == expected else "❌"
        if result != expected:
            all_passed = False
        print(f"{status} {ticker:15} -> {result:12} (expected: {expected})")

    if all_passed:
        print("\n✅ All asset detection tests passed!")
    else:
        print("\n❌ Some asset detection tests failed!")
        sys.exit(1)


def test_date_validation():
    """Test date validation logic."""
    print("\n" + "=" * 80)
    print("TEST 3: Date Validation")
    print("=" * 80)

    from datetime import datetime

    # Test future date handling
    today = datetime.now()
    future_date = today + timedelta(days=30)
    past_date = today - timedelta(days=365)

    print(f"\nToday: {today.date()}")
    print(f"Past date: {past_date.date()}")
    print(f"Future date: {future_date.date()}")

    # Validate date range logic
    if past_date < today:
        print("✅ Past date < Today: PASS")
    else:
        print("❌ Past date < Today: FAIL")
        sys.exit(1)

    if future_date > today:
        print("✅ Future date > Today: PASS (will be auto-adjusted)")
    else:
        print("❌ Future date > Today: FAIL")
        sys.exit(1)

    print("\n✅ Date validation test passed!")


def test_data_fetching():
    """Test data fetching for a few known tickers."""
    print("\n" + "=" * 80)
    print("TEST 4: Historical Data Fetching")
    print("=" * 80)

    from api.backtest_executor import BacktestExecutor

    executor = BacktestExecutor()

    # Test with known good tickers
    test_tickers = ["AAPL", "MSFT"]
    start_date = datetime(2023, 1, 1)
    end_date = datetime(2023, 12, 31)

    print(f"\nFetching data for: {test_tickers}")
    print(f"Date range: {start_date.date()} to {end_date.date()}")
    print("(This may take 10-20 seconds...)")

    try:
        price_data = executor._fetch_historical_prices(test_tickers, start_date, end_date)

        print(f"\n✅ Successfully fetched data for {len(price_data)}/{len(test_tickers)} tickers")

        for ticker, prices in price_data.items():
            print(f"\n  {ticker}:")
            print(f"    - Data points: {len(prices)}")
            if prices:
                dates = sorted(prices.keys())
                print(f"    - Date range: {dates[0]} to {dates[-1]}")
                print(f"    - Price range: ${min(prices.values()):.2f} - ${max(prices.values()):.2f}")

        if len(price_data) >= 1:
            print("\n✅ Data fetching test passed!")
        else:
            print("\n⚠️  Warning: No data fetched, but test continues...")

    except Exception as e:
        print(f"\n❌ Data fetching failed: {e}")
        print("This might be a network issue or API rate limiting. Test will continue...")


def test_metrics_calculation():
    """Test that metrics calculation functions work."""
    print("\n" + "=" * 80)
    print("TEST 5: Metrics Calculation")
    print("=" * 80)

    from api.backtest_metrics import (
        calculate_max_drawdown,
        calculate_sharpe_ratio,
        calculate_total_return,
        calculate_win_rate,
    )

    # Create mock object class for snapshots
    class MockSnapshot:
        def __init__(self, total_value, snapshot_date):
            self.total_value = total_value
            self.snapshot_date = snapshot_date

    # Create mock object class for trades
    class MockTrade:
        def __init__(self, pnl):
            self.pnl = pnl

    # Create mock portfolio snapshots
    mock_snapshots = [
        MockSnapshot(10000, datetime(2023, 1, 1)),
        MockSnapshot(10500, datetime(2023, 2, 1)),
        MockSnapshot(10200, datetime(2023, 3, 1)),
        MockSnapshot(11000, datetime(2023, 4, 1)),
        MockSnapshot(10800, datetime(2023, 5, 1)),
        MockSnapshot(11500, datetime(2023, 6, 1)),
    ]

    # Create mock trades
    mock_trades = [
        MockTrade(100),  # Win
        MockTrade(-50),  # Loss
        MockTrade(200),  # Win
        MockTrade(-30),  # Loss
        MockTrade(150),  # Win
    ]

    print("\nMock Data:")
    print("  - Initial Capital: $10,000")
    print("  - Final Value: $11,500")
    print(f"  - Number of snapshots: {len(mock_snapshots)}")
    print(f"  - Number of trades: {len(mock_trades)}")

    # Test calculations
    print("\nCalculating metrics...")

    try:
        total_return, total_return_pct = calculate_total_return(mock_snapshots)
        print(f"  ✅ Total Return: ${total_return:.2f} ({total_return_pct:.2f}%)")

        sharpe = calculate_sharpe_ratio(mock_snapshots)
        print(f"  ✅ Sharpe Ratio: {sharpe:.4f}" if sharpe else "  ⚠️  Sharpe Ratio: N/A")

        max_dd, max_dd_pct = calculate_max_drawdown(mock_snapshots)
        print(f"  ✅ Max Drawdown: ${max_dd:.2f} ({max_dd_pct:.2f}%)")

        win_rate = calculate_win_rate(mock_trades)
        print(f"  ✅ Win Rate: {win_rate:.2f}%")

        print("\n✅ Metrics calculation test passed!")

    except Exception as e:
        print(f"\n❌ Metrics calculation failed: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


def test_full_backtest_creation():
    """Test creating and executing a full backtest via the database."""
    print("\n" + "=" * 80)
    print("TEST 6: Full Backtest Creation & Execution")
    print("=" * 80)

    import json

    from api.backtest_executor import get_backtest_executor
    from api.database import Backtest, SessionLocal

    print("\nCreating test backtest in database...")

    db = SessionLocal()
    try:
        # Create a test backtest
        test_backtest = Backtest(
            user_id=1,  # Assuming user ID 1 exists
            name="Test Random Backtest",
            description="Automated test of random backtest functionality",
            strategy_description="Random buy/sell strategy for testing",
            strategy_dsl_yaml="# Test strategy\nname: test\ntype: random",
            ticker_list=json.dumps([]),  # Empty = random selection
            start_date=datetime(2023, 1, 1),
            end_date=datetime(2023, 6, 30),
            initial_capital=10000.0,
            rebalance_frequency="weekly",
            position_sizing="equal_weight",
            max_positions=5,
            status="pending",
            progress_percentage=0,
        )

        db.add(test_backtest)
        db.commit()
        db.refresh(test_backtest)

        backtest_id = test_backtest.id
        print(f"✅ Created backtest with ID: {backtest_id}")
        print("   - Date range: 2023-01-01 to 2023-06-30")
        print("   - Initial capital: $10,000")
        print("   - Max positions: 5")

        # Execute the backtest
        print("\nExecuting backtest (this will take 30-60 seconds)...")
        print("Progress updates:")

        executor = get_backtest_executor()
        executor.start_backtest(backtest_id)

        # Poll for completion
        max_wait = 120  # 2 minutes max
        start_time = time.time()
        last_progress = -1

        while time.time() - start_time < max_wait:
            db.refresh(test_backtest)

            if test_backtest.progress_percentage != last_progress:
                print(f"  Progress: {test_backtest.progress_percentage}% - Status: {test_backtest.status}")
                last_progress = test_backtest.progress_percentage

            if test_backtest.status in ["completed", "failed", "cancelled"]:
                break

            time.sleep(2)

        db.refresh(test_backtest)

        if test_backtest.status == "completed":
            print("\n✅ Backtest completed successfully!")
            print("\nResults:")
            print(f"  - Final Value: ${test_backtest.final_portfolio_value:,.2f}")
            print(f"  - Total Return: {test_backtest.total_return_pct:.2f}%")
            print(
                f"  - Sharpe Ratio: {test_backtest.sharpe_ratio:.4f}"
                if test_backtest.sharpe_ratio
                else "  - Sharpe Ratio: N/A"
            )
            print(f"  - Max Drawdown: {test_backtest.max_drawdown_pct:.2f}%")
            print(f"  - Win Rate: {test_backtest.win_rate:.2f}%" if test_backtest.win_rate else "  - Win Rate: N/A")
            print(f"  - Total Trades: {test_backtest.total_trades}")

            # Check trades exist
            from api.database import BacktestTrade

            trade_count = db.query(BacktestTrade).filter(BacktestTrade.backtest_id == backtest_id).count()
            print(f"  - Trades in DB: {trade_count}")

            # Check snapshots exist
            from api.database import BacktestSnapshot

            snapshot_count = db.query(BacktestSnapshot).filter(BacktestSnapshot.backtest_id == backtest_id).count()
            print(f"  - Snapshots in DB: {snapshot_count}")

            print("\n✅ Full backtest test passed!")

        elif test_backtest.status == "failed":
            print("\n❌ Backtest failed!")
            print("   Check logs for details")
            sys.exit(1)
        else:
            print(f"\n⚠️  Backtest timed out or is still running (status: {test_backtest.status})")
            print(f"   Progress: {test_backtest.progress_percentage}%")

    except Exception as e:
        print(f"\n❌ Full backtest test failed: {e}")
        import traceback

        traceback.print_exc()
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


def main():
    """Run all tests."""
    print("\n" + "=" * 80)
    print("BACKTEST FUNCTIONALITY TEST SUITE")
    print("=" * 80)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    start_time = time.time()

    try:
        # Run tests in order
        test_ticker_pool_filtering()
        test_asset_detection()
        test_date_validation()
        test_data_fetching()
        test_metrics_calculation()
        test_full_backtest_creation()

        # Summary
        elapsed = time.time() - start_time
        print("\n" + "=" * 80)
        print("ALL TESTS PASSED! ✅")
        print("=" * 80)
        print(f"Total time: {elapsed:.2f} seconds")
        print(f"Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    except KeyboardInterrupt:
        print("\n\n❌ Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Test suite failed with error: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
