"""Example client for Testing the Trading Agents API."""

import asyncio
import json
import time
from datetime import date

import httpx
import websockets


class TradingAgentsAPIClient:
    """Simple client for interacting with the Trading Agents API."""

    def __init__(self, api_key: str, base_url: str = "http://localhost:8000"):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            "X-API-Key": api_key,
            "Content-Type": "application/json",
        }

    async def create_analysis(
        self,
        ticker: str,
        analysis_date: str | None = None,
        selected_analysts: list | None = None,
        research_depth: int = 1,
    ):
        """Create a new analysis."""
        if analysis_date is None:
            analysis_date = date.today().strftime("%Y-%m-%d")

        if selected_analysts is None:
            selected_analysts = ["market", "news"]

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/api/v1/analyses",
                headers=self.headers,
                json={
                    "ticker": ticker,
                    "analysis_date": analysis_date,
                    "selected_analysts": selected_analysts,
                    "research_depth": research_depth,
                },
            )
            response.raise_for_status()
            return response.json()

    async def get_analysis(self, analysis_id: str):
        """Get full analysis details."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/api/v1/analyses/{analysis_id}",
                headers=self.headers,
            )
            response.raise_for_status()
            return response.json()

    async def get_status(self, analysis_id: str):
        """Get analysis status."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/api/v1/analyses/{analysis_id}/status",
                headers=self.headers,
            )
            response.raise_for_status()
            return response.json()

    async def list_analyses(self, ticker: str | None = None):
        """List all analyses."""
        params = {}
        if ticker:
            params["ticker"] = ticker

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/api/v1/analyses",
                headers=self.headers,
                params=params,
            )
            response.raise_for_status()
            return response.json()

    async def monitor_via_websocket(self, analysis_id: str, duration: int = 300):
        """Monitor analysis via WebSocket."""
        ws_url = f"ws://localhost:8000/api/v1/ws/analyses/{analysis_id}"

        print(f"Connecting to WebSocket: {ws_url}")

        try:
            async with websockets.connect(ws_url) as websocket:
                print("Connected! Waiting for updates...")

                start_time = time.time()
                while time.time() - start_time < duration:
                    try:
                        message = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                        data = json.loads(message)

                        print(f"\n[Update] Status: {data['status']}")
                        print(f"         Progress: {data['progress_percentage']}%")
                        if data.get("current_agent"):
                            print(f"         Agent: {data['current_agent']}")

                        if data["status"] in ["completed", "failed", "cancelled"]:
                            print("\nAnalysis finished!")
                            break

                    except asyncio.TimeoutError:
                        # Send ping to keep connection alive
                        await websocket.send("ping")
                        continue

        except Exception as e:
            print(f"WebSocket error: {e}")


async def main():
    """Example usage."""
    # Replace with your actual API key
    API_KEY = "your-api-key-here"

    client = TradingAgentsAPIClient(API_KEY)

    print("=" * 60)
    print("Trading Agents API Client Example")
    print("=" * 60)

    # 1. Create an analysis
    print("\n1. Creating analysis for AAPL...")
    analysis = await client.create_analysis(
        ticker="AAPL",
        selected_analysts=["market", "news"],
        research_depth=1,
    )
    analysis_id = analysis["id"]
    print(f"   Created: {analysis_id}")
    print(f"   Status: {analysis['status']}")

    # 2. Monitor via WebSocket (run this in background or separately)
    print("\n2. Monitoring via WebSocket...")
    await client.monitor_via_websocket(analysis_id, duration=600)

    # 3. Get final results
    print("\n3. Getting final results...")
    final = await client.get_analysis(analysis_id)
    print(f"   Status: {final['status']}")
    print(f"   Reports: {len(final['reports'])} available")

    for report in final["reports"]:
        print(f"\n   - {report['report_type']}:")
        print(f"     {report['content'][:200]}...")

    # 4. List all analyses
    print("\n4. Listing all AAPL analyses...")
    all_analyses = await client.list_analyses(ticker="AAPL")
    print(f"   Found {len(all_analyses)} analyses")

    print("\n" + "=" * 60)
    print("Done!")


if __name__ == "__main__":
    asyncio.run(main())
