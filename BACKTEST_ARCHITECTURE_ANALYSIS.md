# Backtest Architecture Analysis & Critical Issues

## Executive Summary

The current backtesting system has fundamental architectural flaws that cause:
1. **Data Loss**: Multiple tickers are stripped to single ticker during execution
2. **Duplicate Records**: Two separate Backtest records created per execution
3. **Domain Model Confusion**: "Strategy Definition" conflated with "Execution Results"
4. **Missing Features**: Portfolio backtesting configurations ignored
5. **Inconsistent User Experience**: Two creation flows (form + chat) with different behaviors

---

## Current Architecture

### Data Flow

```
User Creates Strategy (Form or Chat)
    ↓
Backtest Record #1 Created (status=pending)
    - name, description
    - strategy_description, strategy_code_python
    - ticker_list: ["AAPL", "TSLA", "NVDA"]  ← MULTIPLE TICKERS
    - start_date, end_date
    - initial_capital
    - rebalance_frequency, position_sizing, max_positions
    ↓
User Clicks "Execute"
    ↓
api.executeBacktest(backtest_id)
    - Fetches Backtest #1
    - Extracts ONLY ticker_list[0]  ← **DATA LOSS HERE**
    - POSTs to /api/v1/backtest-execution
    ↓
backtest_execution.py creates Backtest Record #2
    - Duplicate of #1 but with:
    - ticker_list: ["AAPL"]  ← ONLY ONE TICKER
    - status=pending → running → completed
    - Results stored here
    ↓
Backtest #1 updated with execution_id=2 (link to #2)
    ↓
Frontend fetches results from Backtest #2 via execution_id
```

---

## Critical Issues

### Issue 1: Multiple Tickers Stripped to Single Ticker

**Problem:**
- User can input multiple tickers in CreateBacktest form: `["AAPL", "TSLA", "NVDA"]`
- During execution, `api.executeBacktest()` takes only `ticker_list[0]`
- Other tickers are silently discarded

**Root Cause:**
- Backend execution engine only supports single ticker backtests
- `BacktestConfig` has `symbol: str` (not list)
- `ExecuteBacktestRequest` has `symbol: str` (not list)
- Frontend doesn't validate or warn about this limitation

**Code Locations:**
```typescript
// frontend/src/services/api.ts:366
const symbol = backtest.ticker_list[0]  // Takes only first ticker
```

```python
# litadel/backtest/types.py:40
@dataclass
class BacktestConfig:
    symbol: str  # Single ticker only
```

```python
# api/endpoints/backtest_execution.py:26
class ExecuteBacktestRequest(BaseModel):
    symbol: str  # Single ticker only
```

**User Impact:**
- User creates strategy for 3 tickers
- Only 1 ticker gets tested
- No error, warning, or explanation
- Misleading results

---

### Issue 2: Configuration Fields Ignored

**Problem:**
Fields set in CreateBacktest form are NOT used during execution:
- `rebalance_frequency` (daily/weekly/monthly)
- `position_sizing` (equal_weight/risk_parity/kelly)
- `max_positions` (1-50)

**Root Cause:**
- These fields are stored in Backtest record #1
- Execution engine creates NEW Backtest record #2 from `ExecuteBacktestRequest`
- `ExecuteBacktestRequest` doesn't include these fields
- Engine hardcodes defaults:
  ```python
  rebalance_frequency="daily",  # Not used for single ticker
  position_sizing="full",       # Not used for single ticker
  max_positions=1,
  ```

**Code Locations:**
```python
# api/endpoints/backtest_execution.py:142-144
rebalance_frequency="daily",  # Not used for single ticker
position_sizing="full",  # Not used for single ticker
max_positions=1,
```

**User Impact:**
- User carefully configures portfolio settings
- Settings are completely ignored
- No indication they won't be used

---

### Issue 3: Initial Capital Inconsistency

**Problem:**
- CreateBacktest form: User sets `initial_capital` (default 100,000)
- ChatTradingInterface: User sets `capital`
- Different field names, inconsistent handling

**Details:**
- Form uses `initial_capital` → saved correctly
- Chat uses `capital` → mapped to `initial_capital` in `/execute-intent`
- Execution DOES use `initial_capital` correctly
- BUT: User complaint "we do not even have to define the entry balance" suggests:
  - Either not required when it should be?
  - Or not being displayed/validated properly?

**Code Locations:**
```typescript
// frontend/src/pages/CreateBacktest.tsx:392
<FormField label="INITIAL CAPITAL" required>
  <NumberInput
    value={formData.initial_capital || ''}
    // ...
  />
</FormField>
```

```typescript
// frontend/src/pages/ChatTradingInterface.tsx:39-40
const [formData, setFormData] = useState<FormData>({
  capital: null,  // Different field name!
  // ...
})
```

**User Impact:**
- Confusing field names across interfaces
- Unclear if capital is required
- Inconsistent validation

---

### Issue 4: Duplicate Backtest Records

**Problem:**
Each backtest execution creates TWO database records:
1. **Strategy Definition** (created by form/chat)
2. **Execution Results** (created by execution engine)

**Why This Is Bad:**
- Confusing data model
- Wastes database space
- Harder to query ("show all my strategies" vs "show all executions")
- execution_id hack to link them
- Can't re-run a strategy without creating more duplicates

**Code Locations:**
```python
# api/endpoints/backtests.py:181-197
backtest = Backtest(  # Record #1
    user_id=user.id,
    name=request.name,
    # ...
    status="pending",
)
```

```python
# api/endpoints/backtest_execution.py:131-149
backtest = Backtest(  # Record #2 (duplicate!)
    user_id=user.id,
    name=request.name,
    # ...
    status="pending",
)
```

```typescript
// frontend/src/services/api.ts:388-390
await this.client.put(`/api/v1/backtests/${id}`, {
    execution_id: response.data.id,  // Linking hack
})
```

**User Impact:**
- Backend has 2 records per backtest
- Frontend must fetch both and merge them
- Can't easily re-execute same strategy
- Database bloat

---

### Issue 5: Domain Model Confusion

**Problem:**
The `Backtest` table conflates two distinct concepts:

| Concept | What It Is | Fields |
|---------|-----------|--------|
| **Strategy Definition** | A trading strategy specification | strategy_description, strategy_code_python, ticker_list, date range, capital config |
| **Backtest Execution** | A run of that strategy | status, progress, results (final_value, sharpe, trades, equity_curve) |

**Proper Design:**
```
Strategy (1) ──has many──> Executions (N)
```
- One strategy can be executed multiple times
- Each execution has its own results
- Strategy is immutable after creation
- Execution has lifecycle (pending → running → completed)

**Current Design:**
```
Backtest (conflated)
- Strategy fields + Execution fields in same table
- execution_id to link to "real" execution
- Messy, confusing, error-prone
```

**User's Question:**
> "why are strategies even called backtests?"

This is the core issue - they AREN'T the same thing.

---

## Two Creation Flows

### Flow A: Multi-Step Form (CreateBacktest.tsx)

**Steps:**
1. Basic Info (name, description)
2. Strategy Definition (natural language → generate Python code)
3. Configuration (dates, capital, **tickers**, rebalance, sizing, max_positions)
4. Review & Submit

**Creates:**
- Backtest record with ALL fields including portfolio config
- Status: pending
- User then manually clicks "Execute"

**Issues:**
- Allows multiple tickers but execution only uses first
- Portfolio config fields collected but ignored
- No validation that execution engine doesn't support these features

---

### Flow B: Chat Interface (ChatTradingInterface.tsx)

**Steps:**
1. User chats with AI
2. AI extracts parameters (uses different field names!)
3. AI generates strategy code
4. User approves
5. Calls `/execute-intent` endpoint

**Creates:**
- Backtest record via `/execute-intent`
- Status: pending
- User still needs to click "Execute" (no auto-execution)

**Issues:**
- Different field names (`capital` vs `initial_capital`)
- Chat flow eventually ends up at same pending state as form
- Not actually "conversational execution" - just alternate creation method
- Redundant with form flow

---

## Affected Code Files

### Backend
- `api/database.py` - Conflated Backtest model
- `api/endpoints/backtests.py` - Creates Strategy+Execution record
- `api/endpoints/backtest_execution.py` - Creates ANOTHER Backtest record
- `api/backtest_executor.py` - Stores results in duplicate record
- `api/models/backtest.py` - Pydantic models with mixed concerns
- `litadel/backtest/types.py` - Single-ticker-only BacktestConfig
- `litadel/backtest/engine.py` - Single-ticker-only execution

### Frontend
- `frontend/src/pages/CreateBacktest.tsx` - Collects unused fields
- `frontend/src/pages/ChatTradingInterface.tsx` - Different field names
- `frontend/src/pages/BacktestDetail.tsx` - Merges two records
- `frontend/src/services/api.ts` - Strips tickers, links records
- `frontend/src/types/backtest.ts` - Types with execution_id hack

---

## Impact on User Experience

### What User Expects:
1. Create strategy with multiple tickers
2. Configure portfolio settings
3. Execute backtest
4. See results for ALL tickers with configured settings
5. Re-run same strategy later

### What Actually Happens:
1. ✅ Create strategy with multiple tickers
2. ✅ Configure portfolio settings
3. ✅ Execute backtest
4. ❌ See results for ONLY FIRST ticker
5. ❌ Portfolio settings ignored (no explanation)
6. ❌ Can't re-run without creating duplicate strategy

### User Complaints:
> "t seems right now we do not even have to define the entry balance and even if i define multiple tickers its being striped. there is so much flawed."

> "It seems you are confusing the 2 ways to create staregies and backtests, one via the multi step form and one via the chat."

> "why are strategies even called backtests?"

All valid complaints identifying real architectural problems.

---

## Recommended Architecture Refactor

### Proper Domain Model

```python
class Strategy(Base):
    """Immutable strategy definition."""
    __tablename__ = "strategies"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    # Identity
    name = Column(String)
    description = Column(Text)

    # Strategy Definition
    strategy_description = Column(Text)  # Natural language
    strategy_code = Column(Text)  # Python code

    # Universe (what to trade)
    strategy_type = Column(String)  # single_ticker, portfolio, ai_managed
    ticker_list = Column(Text)  # JSON array

    # Portfolio Configuration (for portfolio strategies)
    rebalance_frequency = Column(String, nullable=True)
    position_sizing = Column(String, nullable=True)
    max_positions = Column(Integer, nullable=True)

    # Metadata
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    # Relationships
    executions = relationship("BacktestExecution", back_populates="strategy")


class BacktestExecution(Base):
    """Single execution of a strategy."""
    __tablename__ = "backtest_executions"

    id = Column(Integer, primary_key=True)
    strategy_id = Column(Integer, ForeignKey("strategies.id"))
    user_id = Column(Integer, ForeignKey("users.id"))

    # Execution Configuration
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    initial_capital = Column(Float)
    commission = Column(Float)

    # Execution State
    status = Column(String)  # pending, running, completed, failed, cancelled
    progress_percentage = Column(Integer)

    # Results (null until completed)
    final_portfolio_value = Column(Float, nullable=True)
    total_return_pct = Column(Float, nullable=True)
    sharpe_ratio = Column(Float, nullable=True)
    max_drawdown_pct = Column(Float, nullable=True)
    win_rate = Column(Float, nullable=True)
    total_trades = Column(Integer, nullable=True)

    # Metadata
    created_at = Column(DateTime)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    execution_time_seconds = Column(Float, nullable=True)
    data_source = Column(String, nullable=True)
    error_traceback = Column(Text, nullable=True)

    # Relationships
    strategy = relationship("Strategy", back_populates="executions")
    trades = relationship("ExecutionTrade", back_populates="execution")
    equity_curve = relationship("ExecutionEquityCurve", back_populates="execution")
```

### Benefits:
1. **Clear Separation**: Strategy definition vs execution results
2. **Reusability**: One strategy, many executions
3. **No Duplicates**: Single source of truth for each concept
4. **Proper History**: Track all runs of a strategy
5. **Immutable Strategies**: Can't accidentally modify running backtest
6. **Better Queries**: "Show my strategies" vs "Show my recent backtests"

---

## Migration Path

### Phase 1: Backend Schema & Models
1. Create new `strategies` and `backtest_executions` tables
2. Migrate existing `backtests` table data:
   - Records with `execution_id=null` → strategies
   - Records with `execution_id!=null` → executions (link to strategy via execution_id initially)
3. Keep old `backtests` table for compatibility during migration

### Phase 2: Backend API
1. New endpoints:
   - `POST /api/v1/strategies` - Create strategy
   - `GET /api/v1/strategies` - List strategies
   - `GET /api/v1/strategies/{id}` - Get strategy
   - `POST /api/v1/strategies/{id}/execute` - Start execution
   - `GET /api/v1/executions/{id}` - Get execution results
2. Keep old `/api/v1/backtests` endpoints for backward compatibility
3. Update execution engine to use new models

### Phase 3: Frontend Updates
1. Update TypeScript types
2. Update API service calls
3. Update pages to use new endpoints
4. Add "Re-execute" button for completed strategies
5. Show execution history per strategy

### Phase 4: Cleanup
1. Remove old endpoints
2. Drop old `backtests` table
3. Remove execution_id hack
4. Update documentation

---

## Immediate Fixes (Before Full Refactor)

### Fix 1: Validate Single Ticker Limitation
```typescript
// frontend/src/pages/CreateBacktest.tsx
if (formData.ticker_list && formData.ticker_list.length > 1) {
  toast.error('Multiple ticker backtests not yet supported. Please use a single ticker.')
  return
}
```

### Fix 2: Hide Unused Portfolio Fields
```typescript
// Only show portfolio fields if strategy_type === 'portfolio'
{formData.strategy_type === 'portfolio' && (
  <>
    <FormField label="REBALANCE FREQUENCY">...</FormField>
    <FormField label="POSITION SIZING">...</FormField>
    <FormField label="MAX POSITIONS">...</FormField>
  </>
)}
```

### Fix 3: Warning Banner
```tsx
<Alert variant="warning">
  <AlertTitle>⚠️ Limited Backtesting Support</AlertTitle>
  <AlertDescription>
    Currently only single-ticker backtests are supported. Portfolio backtesting with
    rebalancing, position sizing, and multi-ticker strategies is coming soon.
  </AlertDescription>
</Alert>
```

### Fix 4: Require Initial Capital
```python
# api/models/backtest.py
initial_capital: float = Field(..., description="Initial capital", gt=0)  # Required, must be > 0
```

### Fix 5: Merge Chat & Form Flows
- Remove ChatTradingInterface OR
- Make it actually execute directly without manual "Execute" click OR
- Clearly communicate it's just an alternate way to create strategies

---

## Conclusion

The backtesting system has fundamental architectural issues rooted in:
1. **Domain Model Confusion**: Conflating Strategy with Execution
2. **Feature Mismatch**: UI collects data that backend can't use
3. **Silent Data Loss**: Multiple tickers stripped without warning
4. **Duplicate Records**: Two records per backtest with linking hacks
5. **Inconsistent UX**: Two creation flows with different field names

**User is 100% correct** - this needs a comprehensive refactor following proper domain-driven design principles.

The recommended path:
1. **Short-term**: Add validation/warnings about current limitations
2. **Long-term**: Refactor to proper Strategy/Execution separation
3. **Then**: Add portfolio backtesting support with proper multi-ticker handling

This architecture will be maintainable, extensible, and match user expectations.
