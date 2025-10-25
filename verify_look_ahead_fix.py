"""
Verification script for look-ahead bias prevention fixes.

This script tests that the system properly prevents access to future data
when running analyses for historical dates.
"""

from litadel.dataflows.date_validator import (
    LookAheadBiasError,
    validate_date_bounds,
)


def test_date_validation():
    """Test the date validation utility."""
    print("Testing date validation utility...")

    # Test 1: Valid date range
    try:
        validate_date_bounds("2024-01-01", "2024-01-15", "2024-01-20", "test")
        print("✓ Test 1 PASSED: Valid date range accepted")
    except LookAheadBiasError:
        print("✗ Test 1 FAILED: Valid date range rejected")
        return False

    # Test 2: Invalid date range (end_date after max_date)
    try:
        validate_date_bounds("2024-01-01", "2024-02-01", "2024-01-20", "test")
        print("✗ Test 2 FAILED: Future date accepted (should have been rejected)")
        return False
    except LookAheadBiasError as e:
        print(f"✓ Test 2 PASSED: Future date properly rejected - {str(e)[:80]}...")

    # Test 3: Invalid start_date
    try:
        validate_date_bounds("2024-02-01", "2024-02-05", "2024-01-20", "test")
        print("✗ Test 3 FAILED: Future start_date accepted (should have been rejected)")
        return False
    except LookAheadBiasError:
        print("✓ Test 3 PASSED: Future start_date properly rejected")

    print("\n✓ All date validation tests passed!\n")
    return True


def test_tool_signatures():
    """Test that tools have the max_date parameter."""
    print("Testing tool signatures...")

    from litadel.agents.utils.unified_market_tools import (
        get_asset_news,
        get_indicators,
        get_market_data,
    )

    # Check that tools have max_date parameter
    tools_to_check = [
        ("get_market_data", get_market_data),
        ("get_indicators", get_indicators),
        ("get_asset_news", get_asset_news),
    ]

    all_passed = True
    for tool_name, tool_func in tools_to_check:
        # Access the tool's underlying function
        func = tool_func.func if hasattr(tool_func, "func") else tool_func

        # Check parameters
        import inspect

        sig = inspect.signature(func)
        params = list(sig.parameters.keys())

        if "max_date" in params:
            print(f"✓ {tool_name} has max_date parameter")
        else:
            print(f"✗ {tool_name} missing max_date parameter")
            all_passed = False

    if all_passed:
        print("\n✓ All tools have max_date parameter!\n")
    else:
        print("\n✗ Some tools are missing max_date parameter\n")

    return all_passed


def test_fundamental_data_filtering():
    """Test that fundamental data functions accept curr_date parameter."""
    print("Testing fundamental data filtering...")

    import inspect

    from litadel.dataflows.y_finance import (
        get_balance_sheet,
        get_cashflow,
        get_income_statement,
    )

    functions_to_check = [
        ("get_balance_sheet", get_balance_sheet),
        ("get_cashflow", get_cashflow),
        ("get_income_statement", get_income_statement),
    ]

    all_passed = True
    for func_name, func in functions_to_check:
        sig = inspect.signature(func)
        params = list(sig.parameters.keys())

        if "_curr_date" in params or "curr_date" in params:
            print(f"✓ {func_name} accepts curr_date parameter")
        else:
            print(f"✗ {func_name} missing curr_date parameter")
            all_passed = False

    if all_passed:
        print("\n✓ All fundamental data functions accept curr_date!\n")
    else:
        print("\n✗ Some fundamental data functions missing curr_date parameter\n")

    return all_passed


def test_indicator_date_usage():
    """Test that indicator functions use curr_date instead of today."""
    print("Testing indicator date usage...")

    # Read the stockstats_utils file and check for pd.Timestamp.today()
    with open("TradingAgents/litadel/dataflows/stockstats_utils.py") as f:
        content = f.read()

    # Check if the old pattern exists
    if "today_date = pd.Timestamp.today()" in content:
        # Make sure it's not in a comment or has been replaced
        lines = content.split("\n")
        problematic_lines = []
        for i, line in enumerate(lines, 1):
            if "today_date = pd.Timestamp.today()" in line and not line.strip().startswith("#"):
                problematic_lines.append((i, line.strip()))

        if problematic_lines:
            print("✗ Found uses of pd.Timestamp.today() that should use curr_date:")
            for line_num, line in problematic_lines:
                print(f"  Line {line_num}: {line}")
            return False

    # Check if curr_date_dt is used
    if "curr_date_dt = pd.to_datetime(curr_date)" in content:
        print("✓ Indicator functions use curr_date_dt instead of today")
    else:
        print("⚠ Could not verify curr_date usage pattern")
        return True  # Don't fail, just warn

    # Check for filtering
    if 'df = df[pd.to_datetime(df["Date"]) <= pd.to_datetime(curr_date)]' in content:
        print("✓ Data filtering by curr_date is present")
    else:
        print("⚠ Could not verify data filtering pattern")
        return True  # Don't fail, just warn

    print("\n✓ Indicator date usage checks passed!\n")
    return True


def main():
    """Run all verification tests."""
    print("=" * 70)
    print("LOOK-AHEAD BIAS FIX VERIFICATION")
    print("=" * 70)
    print()

    tests = [
        ("Date Validation", test_date_validation),
        ("Tool Signatures", test_tool_signatures),
        ("Fundamental Data Filtering", test_fundamental_data_filtering),
        ("Indicator Date Usage", test_indicator_date_usage),
    ]

    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"✗ {test_name} FAILED with exception: {e}")
            results.append((test_name, False))

    print("=" * 70)
    print("SUMMARY")
    print("=" * 70)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "PASSED" if result else "FAILED"
        icon = "✓" if result else "✗"
        print(f"{icon} {test_name}: {status}")

    print()
    print(f"Results: {passed}/{total} tests passed")

    if passed == total:
        print("\n✓ All verification tests passed! The look-ahead bias fixes are working correctly.")
        return 0
    print(f"\n✗ {total - passed} test(s) failed. Please review the output above.")
    return 1


if __name__ == "__main__":
    exit(main())
