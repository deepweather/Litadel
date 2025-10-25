# Tests

Smoke tests to ensure the TradingAgents app can start without critical errors.

## Running Tests

### Run all smoke tests
```bash
python tests/test_smoke.py
# or with uv
uv run python tests/test_smoke.py
```

### Run frontend build test
```bash
python tests/test_frontend_build.py
```

### Run via pre-commit
```bash
pre-commit run test-python-imports --all-files
pre-commit run test-frontend-build --all-files
```

## What These Tests Do

### `test_smoke.py`
- ✅ Tests that Litadel core modules can be imported
- ✅ Tests that API modules can be imported
- ✅ Tests that CLI modules can be imported

**Purpose:** Catch breaking import errors before committing code.

### `test_frontend_build.py`
- ✅ Tests that the frontend TypeScript build succeeds
- ✅ Catches TypeScript compilation errors
- ✅ Ensures production build is valid

**Purpose:** Prevent committing frontend code that won't build for production.

## Pre-commit Integration

These tests run automatically before each commit:
- **Smoke tests**: Always run on every commit
- **Frontend build**: Only runs when frontend files are modified

## Adding More Tests

To add more tests, create new files in this directory following the pattern:
```python
def test_something():
    """Test description."""
    try:
        # Your test code
        print("✓ Test passed")
        return True
    except Exception as e:
        print(f"✗ Test failed: {e}")
        return False

if __name__ == "__main__":
    import sys
    sys.exit(0 if test_something() else 1)
```

Then add it to `.pre-commit-config.yaml` if it should run on every commit.
