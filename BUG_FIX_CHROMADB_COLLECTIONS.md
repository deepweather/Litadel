# Bug Fix: ChromaDB Collection Name Collision

## Issue Description

When running multiple analyses through the API (either concurrently or sequentially), the system would fail with:

```
chromadb.errors.InternalError: Collection [bull_memory] already exists
```

### Root Cause

The `TradingAgentsGraph` class was creating ChromaDB memory collections with **hardcoded names**:
- `bull_memory`
- `bear_memory`
- `trader_memory`
- `invest_judge_memory`
- `risk_manager_memory`

When multiple analyses ran (even for different tickers), they all tried to create collections with the same names, causing ChromaDB to reject duplicate collection creation.

**Location of the bug:**
- `tradingagents/graph/trading_graph.py` lines 90-94
- `tradingagents/agents/utils/memory.py` line 14

## Solution Implemented

### Changes Made

1. **Modified `TradingAgentsGraph.__init__`** (`tradingagents/graph/trading_graph.py`):
   - Added optional `analysis_id` parameter
   - Collection names now include the analysis ID as a suffix: `bull_memory_{analysis_id}`
   - When `analysis_id` is None, collections use original names (backward compatibility)

2. **Modified `state_manager.py`** (`api/state_manager.py`):
   - Pass the unique `analysis_id` when creating `TradingAgentsGraph`
   - Added cleanup in `finally` block to delete collections after analysis completes

3. **Added cleanup method** (`tradingagents/graph/trading_graph.py`):
   - New `cleanup_memories()` method to delete ChromaDB collections
   - Called after each analysis (success or failure) to prevent memory leaks
   - Prevents accumulation of old collections in the database

### Backward Compatibility

The fix is **fully backward compatible**:
- CLI usage (`cli/main.py`) - continues to work without `analysis_id`
- Standalone usage (`main.py`) - continues to work without `analysis_id`
- API usage - now provides unique `analysis_id` for isolation

## Testing Recommendations

1. **Test concurrent analyses**: Run multiple analyses simultaneously for the same or different tickers
2. **Test sequential analyses**: Run multiple analyses one after another for the same ticker
3. **Test failure scenarios**: Ensure collections are cleaned up even when analysis fails
4. **Test CLI**: Verify CLI still works without regression

## Benefits

✅ Multiple analyses can now run concurrently without conflicts  
✅ Same ticker can be analyzed multiple times without errors  
✅ Memory collections are properly cleaned up after each analysis  
✅ No breaking changes to existing code  
✅ Prevents ChromaDB from accumulating stale collections

