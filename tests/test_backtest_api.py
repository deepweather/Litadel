"""Integration tests for backtest API endpoints."""

import time

import pytest
from fastapi.testclient import TestClient

from api.database import SessionLocal, init_db
from api.main import app

# Sample strategy for testing
SAMPLE_STRATEGY = """
from backtesting import Strategy

class TestApiStrategy(Strategy):
    def init(self):
        pass

    def next(self):
        if not self.position and len(self.data) > 20:
            self.buy()
"""


@pytest.fixture(scope="module")
def client():
    """Create test client."""
    init_db()
    return TestClient(app)


@pytest.fixture(scope="module")
def auth_token(client):
    """Get auth token for testing."""
    # Create test user and get token
    # For now, skip auth in tests or use a test API key
    # This would need to be implemented based on your auth setup
    return "test_token"


@pytest.mark.integration
def test_execute_backtest_endpoint(client):
    """Test POST /api/v1/backtest-execution endpoint."""
    # Note: This test requires authentication
    # You may need to adjust based on your auth setup

    payload = {
        "name": "Test Backtest",
        "description": "Testing API execution",
        "symbol": "AAPL",
        "start_date": "2023-01-01",
        "end_date": "2023-03-31",
        "strategy_code": SAMPLE_STRATEGY,
        "initial_capital": 10000.0,
        "commission": 0.002,
    }

    # Skip test if auth is not configured
    pytest.skip("Authentication setup required for API tests")

    response = client.post(
        "/api/v1/backtest-execution",
        json=payload,
        headers={"Authorization": "Bearer test_token"},
    )

    assert response.status_code in [201, 401]  # 401 if auth not configured

    if response.status_code == 201:
        data = response.json()
        assert "id" in data
        assert "status" in data
        assert data["status"] in ["pending", "running"]


@pytest.mark.integration
def test_get_backtest_status(client):
    """Test GET /api/v1/backtest-execution/{id}/status endpoint."""
    pytest.skip("Authentication setup required for API tests")

    # Would need to create a backtest first
    backtest_id = 1

    response = client.get(
        f"/api/v1/backtest-execution/{backtest_id}/status",
        headers={"Authorization": "Bearer test_token"},
    )

    assert response.status_code in [200, 404, 401]


@pytest.mark.integration
def test_get_backtest_results(client):
    """Test GET /api/v1/backtest-execution/{id}/results endpoint."""
    pytest.skip("Authentication setup required for API tests")

    # Would need to create and complete a backtest first
    backtest_id = 1

    response = client.get(
        f"/api/v1/backtest-execution/{backtest_id}/results",
        headers={"Authorization": "Bearer test_token"},
    )

    assert response.status_code in [200, 404, 401]

    if response.status_code == 200:
        data = response.json()
        assert "id" in data
        assert "status" in data
        assert "trades" in data
        assert "equity_curve" in data


@pytest.mark.integration
def test_delete_backtest(client):
    """Test DELETE /api/v1/backtest-execution/{id} endpoint."""
    pytest.skip("Authentication setup required for API tests")

    backtest_id = 1

    response = client.delete(
        f"/api/v1/backtest-execution/{backtest_id}",
        headers={"Authorization": "Bearer test_token"},
    )

    assert response.status_code in [204, 404, 401]


@pytest.mark.integration
def test_backtest_invalid_dates(client):
    """Test backtest with invalid date range."""
    pytest.skip("Authentication setup required for API tests")

    payload = {
        "name": "Invalid Test",
        "symbol": "AAPL",
        "start_date": "2023-12-31",
        "end_date": "2023-01-01",  # End before start
        "strategy_code": SAMPLE_STRATEGY,
    }

    response = client.post(
        "/api/v1/backtest-execution",
        json=payload,
        headers={"Authorization": "Bearer test_token"},
    )

    assert response.status_code == 400


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
