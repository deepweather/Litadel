# Changelog

All notable changes to this project will be documented in this file.

## [2025-10-26] - Backtest Architecture Fixes

### Fixed

- **Strategy code generation bug**: LLM was generating pandas-style code (`.diff()`, `.shift()`) that doesn't work with backtesting.py's data arrays
  - Updated system prompt to explicitly forbid pandas methods
  - Added correct examples for price change calculations using array indexing
  - Added `PriceChangeStrategy` example showing proper manual calculation
  - Errors like `'_Array' object has no attribute 'diff'` will no longer occur

- **Multi-ticker stripping bug**: Previously, when users created a backtest with multiple tickers (e.g., AAPL, TSLA, NVDA), only the first ticker was used during execution. The other tickers were silently discarded. Now properly validated.
  - Backend validates at creation time and rejects multi-ticker backtests with clear error message
  - Frontend prevents multi-ticker input with warning message
  - Single-ticker limitation clearly communicated to users

- **Duplicate backtest records**: Fixed the execution endpoint that was creating a second Backtest record during execution. Now updates the existing record instead.
  - Backend execution endpoint now accepts `backtest_id` and updates existing record
  - Removed duplicate record creation in `api/endpoints/backtest_execution.py`
  - Frontend simplified to just pass backtest_id to execution endpoint
  - No more `execution_id` linking hack needed

- **Portfolio config fields**: Documented that portfolio settings (rebalance_frequency, position_sizing, max_positions) are not yet implemented for single-ticker backtests
  - Added informational messages in frontend explaining current limitations
  - Settings preserved in database for future multi-ticker support

- **Chat interface confusion**: Deactivated ChatTradingInterface to reduce confusion
  - Different field names (`capital` vs `initial_capital`) were causing issues
  - Removed chat route from App.tsx
  - Removed chat navigation buttons from BacktestList, Sidebar, CommandMenu
  - Added deprecation notice to ChatTradingInterface.tsx (kept for reference)
  - Users now use single unified CreateBacktest form

- **WebSocket parse errors**: Fixed console errors from "pong" keepalive messages
  - WebSocket hook now gracefully ignores non-JSON keepalive messages
  - No more "pong is not valid JSON" errors in console
  - Cleaner error handling for unexpected message formats

### Changed

- **Backtest execution API**: Changed from creating duplicate records to updating existing ones
  - `POST /api/v1/backtest-execution` now accepts `{"backtest_id": number}` instead of full backtest data
  - Backend fetches existing backtest and uses its configuration
  - Results stored back to same record (no duplicates)

- **Validation**: Added clear single-ticker validation
  - Backend: `400 Bad Request` if multiple tickers provided at creation
  - Backend: `501 Not Implemented` if multi-ticker backtest attempted at execution
  - Frontend: Toast error prevents submission with multiple tickers
  - Frontend: Warning Alert shown when multiple tickers detected in form

- **User experience**: Clearer messaging about current limitations
  - Informational alerts explain single-ticker mode
  - Error messages explain what's not supported and why
  - No silent data loss - users are explicitly told about limitations

### Improved

- **Strategy code generation**: LLM-based Python strategy code generation enhanced
  - Streaming code generation via SSE still working
  - Real-time display as code is generated
  - Strategy validation after generation
  - Better prompt engineering prevents pandas method errors
  - Correct examples for price change and momentum calculations

- **Backtest execution engine**: Core execution functionality unchanged
  - Single-ticker backtests work correctly
  - Results calculation and storage working
  - WebSocket status updates functional

- **All tests passing**: Test suite remains green
  - `test_backtest_engine.py`: 7 tests passing
  - `test_smoke.py`: 3 tests passing  
  - `test_frontend_build.py`: Build verification passing
  - New `test_backtest_integration.py`: Integration test templates added

### Technical Details

**Backend Changes:**
- `api/endpoints/backtest_execution.py`:
  - Changed `ExecuteBacktestRequest` to only require `backtest_id`
  - Removed duplicate Backtest record creation
  - Added single-ticker validation at execution time
  - Fetch strategy code and config from existing backtest record

- `api/endpoints/backtests.py`:
  - Added single-ticker validation in `create_backtest` endpoint
  - Returns `400 Bad Request` with clear error message for multi-ticker attempts

- `litadel/agents/utils/strategy_code_generator_agent.py`:
  - Enhanced system prompt with explicit warnings against pandas methods
  - Added `PriceChangeStrategy` example showing correct array indexing
  - Added guidance for manual calculations using `self.data.Close[-n]` syntax

**Frontend Changes:**
- `frontend/src/services/api.ts`:
  - Simplified `executeBacktest()` to just pass backtest_id
  - Removed ticker stripping logic
  - Removed execution_id linking hack

- `frontend/src/pages/CreateBacktest.tsx`:
  - Added multi-ticker validation in submit handler
  - Added warning Alert for multi-ticker detection
  - Added informational Alert about single-ticker mode
  - Updated placeholder text to indicate single ticker
  - Fixed success toast message to be clearer

- `frontend/src/pages/BacktestDetail.tsx`:
  - Added polling for completed backtests to fetch results
  - Added loading states for equity curve and trades
  - Better error handling when data isn't available yet
  - Removed execution_id pattern
  - Simplified to use data from single backtest record
  - Fetch trades and equity curve from backtest directly

- `frontend/src/hooks/useBacktestWebSocket.ts`:
  - Fixed to ignore "pong" keepalive messages
  - Better error handling for non-JSON messages
  - Cleaner console output (no spurious errors)

- `frontend/src/App.tsx`:
  - Removed ChatTradingInterface route

- `frontend/src/pages/BacktestList.tsx`:
  - Removed "Create with AI Chat" button
  - Simplified to single "Create Backtest" button

- `frontend/src/components/layout/Sidebar.tsx`:
  - Removed "Chat" navigation item

- `frontend/src/components/layout/CommandMenu.tsx`:
  - Removed "Chat Interface" command

### Migration Notes

No database migration required. Changes are backward compatible with existing backtest records.

### Next Steps

For full multi-ticker portfolio backtesting support, a proper architecture refactor is recommended:
1. Separate Strategy (reusable definition) from BacktestExecution (run results)
2. Implement portfolio rebalancing engine
3. Support position sizing strategies
4. Enable multiple executions of same strategy

See `BACKTEST_ARCHITECTURE_ANALYSIS.md` for detailed refactor plan.
