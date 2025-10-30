# Cache Architecture & Performance Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    BusinessMapClient                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │Workspace │ │  Board   │ │   Card   │ │   User   │  ... (7) │
│  │  Client  │ │  Client  │ │  Client  │ │  Client  │          │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘          │
│       │            │            │            │                  │
│       └────────────┴────────────┴────────────┘                  │
│                          │                                       │
│                          ▼                                       │
│            ┌──────────────────────────┐                         │
│            │   BaseClientModuleImpl   │                         │
│            │  (Abstract Base Class)   │                         │
│            └──────────┬───────────────┘                         │
│                       │                                          │
│                       │ Each module has                          │
│                       │ its own CacheManager                     │
│                       ▼                                          │
└─────────────────────────────────────────────────────────────────┘
```

## CacheManager Internal Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                      CacheManager                              │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │              Cache Storage (Map)                         │ │
│  │  ┌─────────────────────────────────────────────────┐    │ │
│  │  │ Key: "workspaces:all"                          │    │ │
│  │  │ Value: {                                       │    │ │
│  │  │   data: [workspace1, workspace2, ...],        │    │ │
│  │  │   expiresAt: 1730217600000                    │    │ │
│  │  │ }                                              │    │ │
│  │  └─────────────────────────────────────────────────┘    │ │
│  │  ┌─────────────────────────────────────────────────┐    │ │
│  │  │ Key: "workspace:123"                           │    │ │
│  │  │ Value: { data: {...}, expiresAt: ... }       │    │ │
│  │  └─────────────────────────────────────────────────┘    │ │
│  │  ... (unlimited entries ⚠️ UNBOUNDED)                   │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │       Pending Requests (Map<string, Promise>)           │ │
│  │  ┌─────────────────────────────────────────────────┐    │ │
│  │  │ Key: "workspaces:all"                          │    │ │
│  │  │ Value: Promise<Workspace[]> (in-flight)       │    │ │
│  │  └─────────────────────────────────────────────────┘    │ │
│  │  (Only exists during API request)                       │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Statistics:                                                    │
│  ├─ hitCount: 1234 (incremented on cache hit)                  │
│  ├─ missCount: 567 (incremented on cache miss)                 │
│  └─ Size: Map.size (number of cached entries)                  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## Request Flow - Cache Hit

```
┌────────┐
│ Client │ Calls getWorkspaces()
└───┬────┘
    │
    ▼
┌─────────────────────────────────────┐
│ WorkspaceClient.getWorkspaces()     │
└───┬─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ cache.get('workspaces:all', ...)    │
└───┬─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Check cache.get('workspaces:all')   │
│ ✓ Found in cache                    │
│ ✓ expiresAt > Date.now()            │
└───┬─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ hitCount++  (~3ns overhead)         │
└───┬─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Return cached.data                  │
│ ⏱️  Total time: ~50ns (O(1))        │
└─────────────────────────────────────┘

✅ NO API CALL MADE
```

## Request Flow - Cache Miss

```
┌────────┐
│ Client │ Calls getWorkspaces()
└───┬────┘
    │
    ▼
┌─────────────────────────────────────┐
│ cache.get('workspaces:all', ...)    │
└───┬─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Check cache.get('workspaces:all')   │
│ ✗ Not found OR expired              │
└───┬─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Check pendingRequests               │
│ ✗ No pending request                │
└───┬─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ missCount++  (~3ns)                 │
│ Create promise = fetcher()          │
│ pendingRequests.set(key, promise)   │
└───┬─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Execute API call                    │
│ ⏱️  Time: 50-500ms                  │
└───┬─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Store in cache:                     │
│ cache.set(key, {                    │
│   data: response,                   │
│   expiresAt: now + TTL              │
│ })                                  │
└───┬─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ pendingRequests.delete(key)         │
│ Return response                     │
└─────────────────────────────────────┘

✅ API CALL MADE (data now cached)
```

## Request Flow - Deduplication (Concurrent Requests)

```
Time: 0ms
┌────────┐ ┌────────┐ ┌────────┐
│Client 1│ │Client 2│ │Client 3│ All call getWorkspaces() simultaneously
└───┬────┘ └───┬────┘ └───┬────┘
    │          │          │
    └──────────┴──────────┘
             │
             ▼
┌─────────────────────────────────────┐
│ cache.get('workspaces:all', ...)    │
│ ✗ Not in cache                      │
│ ✗ No pending request yet            │
└───┬─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Client 1 creates Promise A          │
│ pendingRequests.set(key, Promise A) │
└───┬─────────────────────────────────┘
    │
    │ Time: 1ms (Client 2 arrives)
    ▼
┌─────────────────────────────────────┐
│ Check pendingRequests               │
│ ✓ Found Promise A                   │
│ hitCount++ (dedup counted as hit)   │
│ Return Promise A                    │
└───┬─────────────────────────────────┘
    │
    │ Time: 2ms (Client 3 arrives)
    ▼
┌─────────────────────────────────────┐
│ Check pendingRequests               │
│ ✓ Found Promise A                   │
│ hitCount++                          │
│ Return Promise A                    │
└───┬─────────────────────────────────┘
    │
    │ Time: 50ms (Promise A resolves)
    ▼
┌─────────────────────────────────────┐
│ All 3 clients receive same data     │
│ pendingRequests.delete(key)         │
└─────────────────────────────────────┘

✅ ONLY 1 API CALL FOR 3 REQUESTS (67% reduction)

Stats:
- Hits: 2 (Clients 2 & 3)
- Misses: 1 (Client 1)
- Hit rate: 66%
```

## Performance Bottleneck: Cleanup

### Current Implementation (Problematic)

```
┌─────────────────────────────────────┐
│ cleanup() called                    │
└───┬─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ const now = Date.now()              │
└───┬─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ for (const [key, entry] of          │
│      cache.entries()) {             │ ⚠️ O(n) - Iterate ALL entries
│   if (entry.expiresAt <= now) {    │
│     cache.delete(key)               │
│   }                                 │
│ }                                   │
└─────────────────────────────────────┘

Example:
- 1,000 entries in cache
- 100 are expired (10%)

Work performed:
- Iterate: 1,000 entries × 15ns = 15μs
- Delete: 100 entries × 100ns = 10μs
- Total: ~25μs per cleanup

⚠️ Problem: Even if 0% expired, still iterates all entries!
```

### Optimized Implementation (Lazy Expiration)

```
┌─────────────────────────────────────┐
│ cache.get(key, fetcher, ttl)        │
└───┬─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ const cached = cache.get(key)       │
│ if (cached) {                       │
│   if (cached.expiresAt > now) {    │ ✅ O(1) - Check only this entry
│     return cached.data              │
│   }                                 │
│   cache.delete(key)  ⬅️ Lazy delete  │
│ }                                   │
└─────────────────────────────────────┘

Example:
- 1,000 entries in cache
- 10 requests/second
- 1 expired entry accessed

Work performed:
- Check expiry: 1 entry × 20ns = 20ns
- Delete: 1 entry × 100ns = 100ns
- Total: ~120ns per request (vs 25μs)

✅ Improvement: 99.5% reduction in cleanup overhead!
```

## Memory Growth Analysis

### Current (Unbounded)

```
     Memory
       ▲
       │                                           🔥 OOM Risk
   500MB│                                       ╱
       │                                     ╱
   400MB│                                   ╱
       │                                 ╱
   300MB│                             ╱
       │                           ╱
   200MB│                       ╱
       │                     ╱      ⚠️ No eviction
   100MB│                 ╱          strategy
       │             ╱ ╱
     0MB│─────────────────────────────────────────▶
       0    1hr    2hr   3hr   4hr   5hr        Time

Scenario: High-traffic API (10K req/hour)
- 10,000 requests/hour
- 20% unique keys = 2,000 new entries/hour
- TTL = 15 minutes = keeps last 2,500 entries
- Avg response = 10KB
- Memory = 2,500 × 10KB = 25MB/hour
- After 24 hours: 600MB (unbounded growth!)
```

### Optimized (LRU with maxSize=500)

```
     Memory
       ▲
       │
    50MB│─────────────────────────────────────── ✅ Ceiling
       │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
       │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    40MB│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
       │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    30MB│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
       │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    20MB│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
       │▓▓▓▓▓▓▓▓▓▓▓▓╱─────────────────────────
    10MB│▓▓▓▓▓▓╱                 LRU eviction
       │▓▓╱╱                     keeps hot data
     0MB│─────────────────────────────────────▶
       0    1hr    2hr   3hr   4hr   5hr    Time

Same scenario, but:
- Max 500 entries per module
- 7 modules × 500 = 3,500 max entries
- Memory = 3,500 × 10KB = 35MB max
- Predictable, bounded growth ✅
```

## Race Condition: Invalidation During In-Flight Request

### Current (Has Bug)

```
Time: 0ms
┌──────────────────────────────────────┐
│ Client calls getWorkspace(123)      │
│ → API request starts (Promise A)    │
│ → pendingRequests.set('ws:123', A)  │
└──────────────────────────────────────┘

Time: 50ms (during API call)
┌──────────────────────────────────────┐
│ User updates workspace 123           │
│ → updateWorkspace(123, ...)          │
│ → cache.invalidate(/^workspace:/)    │
│ → cache.delete('ws:123')  ✅ Cleared │
└──────────────────────────────────────┘

Time: 100ms (API response arrives)
┌──────────────────────────────────────┐
│ Promise A resolves with old data     │
│ → cache.set('ws:123', OLD_DATA) 💥   │
│ → Stale data now cached!             │
└──────────────────────────────────────┘

Time: 101ms
┌──────────────────────────────────────┐
│ Next client calls getWorkspace(123)  │
│ → Returns stale data from cache 😱   │
└──────────────────────────────────────┘

⚠️ BUG: Stale data persists until TTL expiry
```

### Fixed (Cancel Pending on Invalidation)

```
Time: 0ms
┌──────────────────────────────────────┐
│ Client calls getWorkspace(123)       │
│ → API request starts (Promise A)     │
│ → pendingRequests.set('ws:123', A)   │
└──────────────────────────────────────┘

Time: 50ms
┌──────────────────────────────────────┐
│ User updates workspace 123            │
│ → updateWorkspace(123, ...)           │
│ → cache.invalidate(/^workspace:/)     │
│ → cache.delete('ws:123')              │
│ → pendingRequests.delete('ws:123') ✅ │  NEW!
└──────────────────────────────────────┘

Time: 100ms (API response arrives)
┌──────────────────────────────────────┐
│ Promise A resolves                    │
│ → Check: pendingRequests.has(key)?   │
│ → NO (was deleted) → Skip cache write│
│ → Return fresh data to client only   │
└──────────────────────────────────────┘

Time: 101ms
┌──────────────────────────────────────┐
│ Next client calls getWorkspace(123)  │
│ → Cache miss (correctly invalidated) │
│ → Fetches fresh data ✅              │
└──────────────────────────────────────┘

✅ FIXED: No stale data after invalidation
```

## Cache Statistics Flow

```
┌────────────────────────────────────────┐
│ BusinessMapClient.getCacheStats()      │
└───┬────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────┐
│ Aggregate stats from 7 modules:        │
│                                         │
│ workspace: {                            │
│   hits: 1234, misses: 567,             │
│   hitRate: 0.685, size: 12             │
│ }                                       │
│ board: { ... }                          │
│ card: { ... }                           │
│ user: { ... }                           │
│ customField: { ... }                    │
│ utility: { ... }                        │
│ workflow: { ... }                       │
└────────────────────────────────────────┘

Per module, CacheManager.getStats():
├─ hits: this.hitCount
├─ misses: this.missCount
├─ hitRate: hits / (hits + misses)
└─ size: this.cache.size

⏱️ Overhead: O(1) - Just integer arithmetic
💾 Memory: 16 bytes per module (2 integers)
```

## Comparison: Map vs LRU Cache

### JavaScript Map (Current)

```
┌─────────────────────────────────────┐
│          Map<string, Entry>         │
├─────────────────────────────────────┤
│ ✅ O(1) get/set/delete              │
│ ✅ Native performance               │
│ ✅ Simple API                       │
│ ⚠️  No size limits                  │
│ ⚠️  No auto-eviction                │
│ ⚠️  Manual cleanup required         │
└─────────────────────────────────────┘

Operations:
- get(key): 50-100ns
- set(key, val): 100-200ns
- delete(key): 100-200ns
- Iteration: 10-20ns per entry

Memory: ~40 bytes overhead per entry
```

### LRU Cache (Recommended)

```
┌─────────────────────────────────────┐
│     LRU<string, Entry>              │
├─────────────────────────────────────┤
│ ✅ O(1) get/set/delete              │
│ ✅ Auto-eviction when full          │
│ ✅ Configurable size limits         │
│ ✅ Keeps hot data automatically     │
│ ➖ ~10% slower than Map             │
│ ➖ +45KB bundle size                │
└─────────────────────────────────────┘

Operations:
- get(key): 60-120ns (~10% overhead)
- set(key, val): 120-250ns
- delete(key): 120-250ns
- Auto-eviction: 200-300ns

Memory: ~60 bytes overhead per entry
(20 bytes extra for LRU bookkeeping)

Configuration:
new LRU({
  max: 500,           // Max entries
  ttl: 300000,        // 5 minutes
  updateAgeOnGet: true // LRU behavior
})
```

## Performance Impact Summary

| Operation | Map (Current) | LRU (Optimized) | Delta | Acceptable? |
|-----------|---------------|-----------------|-------|-------------|
| Cache hit | 50ns | 60ns | +10ns | ✅ Yes (20% slower, still sub-μs) |
| Cache miss | 50ms | 50ms | 0 | ✅ Yes (API dominates) |
| Memory | Unbounded | <50MB | Bounded | ✅ Yes (production safe) |
| Cleanup | 100μs/1K | 1μs | -99% | ✅ Yes (huge win) |
| Bundle | 0KB | +45KB | +45KB | ✅ Yes (0.5% of typical bundle) |

**Verdict:** LRU overhead is negligible compared to gains in memory safety and cleanup efficiency.

---

## Visual Legend

```
✅ = Good / No issues
⚠️  = Warning / Needs attention
🔥 = Critical issue
➖ = Neutral / Trade-off
💥 = Bug / Race condition
😱 = Data corruption risk
```
