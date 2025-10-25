"""
Smoke tests to ensure the app can start without critical import errors.

These tests don't test functionality, just that the app can be imported and initialized.
Run with: python -m pytest tests/test_smoke.py or just: python tests/test_smoke.py
"""

import sys


def test_litadel_imports():
    """Test that core Litadel modules can be imported."""
    try:
        from litadel.default_config import DEFAULT_CONFIG
        from litadel.graph.trading_graph import TradingAgentsGraph

        print("✓ Litadel core imports successful")
    except ImportError as e:
        print(f"✗ Litadel import failed: {e}")
        return False
    else:
        return True


def test_api_imports():
    """Test that API modules can be imported."""
    try:
        from api.database import init_db
        from api.endpoints import analyses, data, tickers
        from api.main import app

        print("✓ API imports successful")
    except ImportError as e:
        print(f"✗ API import failed: {e}")
        return False
    else:
        return True


def test_cli_imports():
    """Test that CLI modules can be imported."""
    try:
        from cli.helpers import AnalystType
        from cli.main import console

        print("✓ CLI imports successful")
    except ImportError as e:
        print(f"✗ CLI import failed: {e}")
        return False
    else:
        return True


def run_all_tests():
    """Run all smoke tests and return exit code."""
    tests = [
        test_litadel_imports,
        test_api_imports,
        test_cli_imports,
    ]

    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"✗ Test {test.__name__} crashed: {e}")
            results.append(False)

    if all(results):
        print("\n✅ All smoke tests passed!")
        return 0
    print("\n❌ Some smoke tests failed!")
    return 1


if __name__ == "__main__":
    sys.exit(run_all_tests())
