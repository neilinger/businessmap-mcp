---
name: BusinessMap Best Practices
description: Performance optimization, rate limiting strategies, security hardening, and production-ready patterns for BusinessMap/Kanbanize API integrations. Use when optimizing API usage, implementing bulk operations, caching strategies, or production deployment.
---

# BusinessMap Best Practices

Production-ready patterns for BusinessMap (Kanbanize) API integrations.

## When to Use This Skill

Trigger when:
- "How to optimize BusinessMap API performance?"
- "Best practices for bulk operations"
- "Rate limiting strategy"
- "How to cache BusinessMap data?"
- "Production deployment checklist"
- "Security hardening for API integration"
- Planning high-volume API usage

## Performance Optimization

### 1. Minimize API Calls with Bulk Operations

**Problem**: Making N individual API calls for N resources

**Solution**: Use bulk operations (max 50 resources per call)

```bash
# ❌ Inefficient: 50 API calls
for card_id in card_ids:
    delete_card(card_id)

# ✅ Efficient: 1 API call
bulk_delete_cards(resource_ids=card_ids)  # Max 50 per call

# For >50 resources, batch:
for batch in chunks(card_ids, 50):
    bulk_delete_cards(resource_ids=batch)
    time.sleep(0.5)  # Rate limiting
```

**Available Bulk Operations**:
- `bulk_delete_cards` - Delete up to 50 cards with dependency analysis
- `bulk_update_cards` - Update up to 50 cards with same changes
- `bulk_delete_boards` - Delete up to 50 boards with confirmation
- `bulk_update_boards` - Update up to 50 boards
- `bulk_archive_workspaces` - Archive up to 50 workspaces

**Benefits**:
- 50x fewer API calls (50 → 1)
- Built-in dependency analysis
- Consolidated confirmation prompts
- Automatic error aggregation

### 2. Pagination Strategy

**Problem**: Fetching 10,000 cards with page_size=100 = 100 API calls

**Solution**: Maximize page size to minimize requests

```bash
# ❌ Inefficient: 100 requests for 10,000 cards
cards = []
for page in range(1, 101):
    batch = list_cards(board_id=123, page=page, per_page=100)
    cards.extend(batch)

# ✅ Efficient: 10 requests for 10,000 cards
cards = []
for page in range(1, 11):
    batch = list_cards(board_id=123, page=page, per_page=1000)  # Max
    cards.extend(batch)
```

**Pagination Best Practices**:
- **Always use max page size**: `per_page=1000` for list_cards
- **Use filters to reduce dataset**: Only fetch what you need
- **Cache pagination metadata**: Avoid re-fetching for counts
- **Implement cursor-based pagination**: For real-time data

```bash
# Example: Get only cards updated in last 24 hours
from datetime import datetime, timedelta

yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")

cards = list_cards(
    board_id=123,
    last_modified_from_date=yesterday,
    per_page=1000
)
```

### 3. Selective Field Fetching

**Problem**: Fetching entire card objects when only needing IDs

**Solution**: Use appropriate tools for the data needed

```bash
# ❌ Inefficient: Fetch full card data just for count
all_cards = list_cards(board_id=123)
count = len(all_cards)

# ✅ Efficient: Use pagination metadata
response = list_cards(board_id=123, per_page=1)
count = response.pagination.total

# ❌ Inefficient: Fetch all custom fields to find one
all_fields = list_custom_fields()
priority_field = [f for f in all_fields if f.name == "Priority"][0]

# ✅ Efficient: Use board-specific query
fields = list_board_custom_fields(board_id=123)
priority_field = [f for f in fields if f.name == "Priority"][0]
```

### 4. Parallel Requests (Where Safe)

**Problem**: Sequential API calls blocking each other

**Solution**: Parallel requests for independent operations

```python
import asyncio
from concurrent.futures import ThreadPoolExecutor

# ✅ Parallel: Fetch multiple boards simultaneously
async def fetch_boards_parallel(board_ids):
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [
            executor.submit(get_current_board_structure, board_id=bid)
            for bid in board_ids
        ]
        results = [f.result() for f in futures]
    return results

# Respects rate limits: 10 workers < 120 requests/min
```

**Parallelization Guidelines**:
- **Safe for reads**: list_*, get_*, search_* operations
- **Unsafe for writes**: create_*, update_*, delete_* (use bulk instead)
- **Respect rate limits**: Max 10-20 parallel workers
- **Handle errors gracefully**: One failure shouldn't crash all

## Rate Limiting Strategies

### Understanding Rate Limits

**BusinessMap API Limits**:
- **120 requests/minute** per API token
- **Burst tolerance**: Short bursts allowed, sustained traffic throttled
- **Per-token basis**: Each token has independent limit
- **Reset period**: 60-second rolling window

### Strategy 1: Token Bucket Algorithm

```python
import time
from collections import deque

class RateLimiter:
    def __init__(self, max_requests=120, window=60):
        self.max_requests = max_requests
        self.window = window
        self.requests = deque()

    def wait_if_needed(self):
        now = time.time()

        # Remove requests outside window
        while self.requests and self.requests[0] < now - self.window:
            self.requests.popleft()

        # If at limit, wait
        if len(self.requests) >= self.max_requests:
            sleep_time = self.requests[0] + self.window - now
            time.sleep(sleep_time)
            self.wait_if_needed()  # Recursive check

        # Record this request
        self.requests.append(now)

# Usage
limiter = RateLimiter(max_requests=100, window=60)  # Conservative

for card_id in card_ids:
    limiter.wait_if_needed()
    delete_card(card_id)
```

### Strategy 2: Exponential Backoff

```python
import time
import random

def api_call_with_backoff(tool_call, max_retries=5):
    """
    Retry API calls with exponential backoff
    """
    for attempt in range(max_retries):
        try:
            return tool_call()
        except RateLimitError as e:
            if attempt == max_retries - 1:
                raise  # Final attempt failed

            # Exponential backoff with jitter
            base_delay = 2 ** attempt  # 1s, 2s, 4s, 8s, 16s
            jitter = random.uniform(0, 1)
            wait_time = base_delay + jitter

            time.sleep(wait_time)
        except ServerError as e:
            if attempt == max_retries - 1:
                raise
            time.sleep(2 ** attempt)

# Usage
cards = api_call_with_backoff(
    lambda: list_cards(board_id=123)
)
```

### Strategy 3: Multiple API Tokens

**Use case**: Very high-volume applications (>120 req/min)

```python
from itertools import cycle

# Distribute load across multiple tokens
api_tokens = [
    "token1_for_workspace_A",
    "token2_for_workspace_B",
    "token3_for_workspace_C"
]

token_cycle = cycle(api_tokens)

def get_next_client():
    token = next(token_cycle)
    return BusinessMapClient(api_token=token)

# Round-robin across tokens
for batch in card_batches:
    client = get_next_client()
    client.bulk_delete_cards(batch)
```

### Strategy 4: Request Prioritization

```python
from queue import PriorityQueue

class PriorityRateLimiter:
    def __init__(self):
        self.queue = PriorityQueue()
        self.limiter = RateLimiter()

    def schedule(self, priority, task):
        """
        Lower priority number = higher priority
        0 = critical, 1 = high, 2 = normal, 3 = low
        """
        self.queue.put((priority, task))

    def execute(self):
        while not self.queue.empty():
            priority, task = self.queue.get()
            self.limiter.wait_if_needed()
            task()

# Usage
scheduler = PriorityRateLimiter()

# Critical operations first
scheduler.schedule(0, lambda: create_card(...))  # Critical
scheduler.schedule(1, lambda: update_card(...))  # High
scheduler.schedule(2, lambda: list_cards(...))   # Normal
scheduler.schedule(3, lambda: get_card_comments(...))  # Low

scheduler.execute()
```

## Caching Strategies

### 1. Board Structure Caching

**Problem**: Board structure rarely changes, but fetched repeatedly

**Solution**: Cache with TTL (time-to-live)

```python
import time
from functools import lru_cache

class BoardStructureCache:
    def __init__(self, ttl=3600):  # 1 hour TTL
        self.cache = {}
        self.ttl = ttl

    def get(self, board_id):
        if board_id in self.cache:
            data, timestamp = self.cache[board_id]
            if time.time() - timestamp < self.ttl:
                return data

        # Cache miss or expired
        structure = get_current_board_structure(board_id=board_id)
        self.cache[board_id] = (structure, time.time())
        return structure

    def invalidate(self, board_id):
        """Invalidate cache when structure changes"""
        if board_id in self.cache:
            del self.cache[board_id]

# Usage
cache = BoardStructureCache(ttl=3600)

# First call: API request
structure = cache.get(board_id=123)

# Subsequent calls within 1 hour: cached
structure = cache.get(board_id=123)  # No API call

# After updating board structure
create_lane(board_id=123, ...)
cache.invalidate(board_id=123)  # Clear cache
```

### 2. User Data Caching

**Problem**: User list rarely changes, fetched on every operation

**Solution**: Cache with manual invalidation

```python
@lru_cache(maxsize=1)
def get_all_users_cached():
    """
    Cache user list (rarely changes)
    Clear cache: get_all_users_cached.cache_clear()
    """
    return list_users()

# Usage
users = get_all_users_cached()  # First call: API request
users = get_all_users_cached()  # Subsequent calls: cached

# When users change (rare)
get_all_users_cached.cache_clear()
```

### 3. Custom Field Schema Caching

**Problem**: Custom field definitions rarely change per board

**Solution**: Board-scoped caching with invalidation

```python
class CustomFieldCache:
    def __init__(self):
        self.cache = {}  # board_id -> {field_name -> field_id}

    def get_field_id(self, board_id, field_name):
        if board_id not in self.cache:
            fields = list_board_custom_fields(board_id=board_id)
            self.cache[board_id] = {
                f.name: f.field_id for f in fields
            }

        return self.cache[board_id].get(field_name)

    def invalidate(self, board_id):
        if board_id in self.cache:
            del self.cache[board_id]

# Usage
field_cache = CustomFieldCache()

# Fast field ID lookup (no repeated API calls)
priority_id = field_cache.get_field_id(123, "Priority")
size_id = field_cache.get_field_id(123, "Size")
```

### 4. Read-Through Caching Pattern

```python
from functools import wraps

def cached(ttl=300, key_func=None):
    """
    Decorator for caching API responses
    """
    cache = {}

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            if key_func:
                key = key_func(*args, **kwargs)
            else:
                key = (args, tuple(sorted(kwargs.items())))

            # Check cache
            if key in cache:
                data, timestamp = cache[key]
                if time.time() - timestamp < ttl:
                    return data

            # Cache miss: fetch and store
            result = func(*args, **kwargs)
            cache[key] = (result, time.time())
            return result

        # Add cache clear method
        wrapper.cache_clear = lambda: cache.clear()
        return wrapper

    return decorator

# Usage
@cached(ttl=600)  # 10-minute cache
def get_board_cards(board_id):
    return list_cards(board_id=board_id, per_page=1000)

# Cached calls
cards = get_board_cards(123)  # API call
cards = get_board_cards(123)  # Cached (within 10 min)
```

## Security Best Practices

### 1. API Token Management

```python
import os
from typing import Optional

def get_api_token() -> str:
    """
    Securely retrieve API token
    """
    # Priority order:
    # 1. Environment variable (production)
    # 2. Secret manager (AWS/GCP/Azure)
    # 3. Config file (development only)

    token = os.environ.get('BUSINESSMAP_API_TOKEN')

    if not token:
        raise ValueError(
            "BUSINESSMAP_API_TOKEN not set. "
            "Set environment variable or use secret manager."
        )

    if not token.startswith('ace_') and not token.startswith('pat_'):
        raise ValueError(
            "Invalid token format. "
            "Must start with 'ace_' or 'pat_'"
        )

    return token

# ❌ Never hardcode tokens
API_TOKEN = "ace_xxxxxxxxxxxxx"  # BAD!

# ✅ Use environment variables
API_TOKEN = get_api_token()  # GOOD
```

### 2. Input Validation

```python
def validate_board_id(board_id: int) -> int:
    """Validate board ID before API call"""
    if not isinstance(board_id, int):
        raise TypeError(f"board_id must be int, got {type(board_id)}")

    if board_id <= 0:
        raise ValueError(f"board_id must be positive, got {board_id}")

    return board_id

def validate_card_data(card_data: dict) -> dict:
    """Validate card data before creation"""
    required_fields = ['title', 'column_id']

    for field in required_fields:
        if field not in card_data:
            raise ValueError(f"Missing required field: {field}")

    # Sanitize title (prevent XSS)
    card_data['title'] = sanitize_html(card_data['title'])

    return card_data
```

### 3. Read-Only Mode for Production Safety

```python
import os

class SafeBusinessMapClient:
    def __init__(self, read_only=None):
        if read_only is None:
            # Auto-detect production environment
            read_only = os.environ.get('ENV') == 'production'

        self.read_only = read_only
        self.client = BusinessMapClient()

    def create_card(self, **kwargs):
        if self.read_only:
            raise PermissionError(
                "Write operations disabled in read-only mode"
            )
        return self.client.create_card(**kwargs)

    # All write operations check read_only flag
    # Read operations allowed always
    def list_cards(self, **kwargs):
        return self.client.list_cards(**kwargs)

# Usage
client = SafeBusinessMapClient()  # Auto-detects environment
cards = client.list_cards(board_id=123)  # Allowed
client.create_card(...)  # Raises error in production
```

### 4. Audit Logging

```python
import logging
from datetime import datetime

def audit_log(operation, resource_type, resource_id, user, success):
    """
    Log all API operations for compliance
    """
    log_entry = {
        'timestamp': datetime.utcnow().isoformat(),
        'operation': operation,
        'resource_type': resource_type,
        'resource_id': resource_id,
        'user': user,
        'success': success
    }

    logging.info(f"AUDIT: {log_entry}")

    # Also send to SIEM/security monitoring
    send_to_monitoring(log_entry)

# Usage
try:
    delete_card(card_id=123)
    audit_log('delete', 'card', 123, get_current_user(), True)
except Exception as e:
    audit_log('delete', 'card', 123, get_current_user(), False)
    raise
```

## Error Handling Patterns

### 1. Graceful Degradation

```python
def get_card_with_fallback(card_id):
    """
    Try to get card, fall back to cached data if API fails
    """
    try:
        return get_card(card_id=card_id)
    except APIError as e:
        logging.warning(f"API failed, using cached data: {e}")
        return get_cached_card(card_id)
    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        return None
```

### 2. Circuit Breaker Pattern

```python
class CircuitBreaker:
    def __init__(self, failure_threshold=5, timeout=60):
        self.failure_count = 0
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.last_failure_time = None
        self.state = 'CLOSED'  # CLOSED, OPEN, HALF_OPEN

    def call(self, func, *args, **kwargs):
        if self.state == 'OPEN':
            if time.time() - self.last_failure_time > self.timeout:
                self.state = 'HALF_OPEN'
            else:
                raise CircuitBreakerOpen("Too many failures")

        try:
            result = func(*args, **kwargs)
            self.on_success()
            return result
        except Exception as e:
            self.on_failure()
            raise

    def on_success(self):
        self.failure_count = 0
        self.state = 'CLOSED'

    def on_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.time()

        if self.failure_count >= self.failure_threshold:
            self.state = 'OPEN'

# Usage
breaker = CircuitBreaker(failure_threshold=5, timeout=60)

for card_id in card_ids:
    try:
        breaker.call(delete_card, card_id=card_id)
    except CircuitBreakerOpen:
        logging.error("Circuit breaker open, skipping remaining cards")
        break
```

## Production Deployment Checklist

### Environment Configuration
- [ ] API token stored securely (env variable or secret manager)
- [ ] API URL configured correctly
- [ ] Read-only mode set appropriately per environment
- [ ] Rate limiting configured (max 100 req/min recommended)
- [ ] Timeouts configured (30s for reads, 60s for writes)

### Error Handling
- [ ] Exponential backoff implemented for retries
- [ ] Circuit breaker pattern for API failures
- [ ] Graceful degradation with fallback data
- [ ] Comprehensive error logging
- [ ] User-friendly error messages

### Performance
- [ ] Bulk operations used where possible (>5 resources)
- [ ] Caching implemented for static data (users, board structure)
- [ ] Pagination optimized (max page size)
- [ ] Parallel requests for independent operations
- [ ] Connection pooling configured

### Security
- [ ] Input validation on all user-provided data
- [ ] API token rotation schedule defined
- [ ] Audit logging for all write operations
- [ ] HTTPS enforced (never HTTP)
- [ ] Sensitive data sanitized in logs

### Monitoring
- [ ] API call volume metrics
- [ ] Error rate tracking
- [ ] Latency monitoring (p50, p95, p99)
- [ ] Rate limit consumption tracking
- [ ] Cache hit/miss ratios

### Testing
- [ ] Unit tests for API client wrapper
- [ ] Integration tests with test environment
- [ ] Load testing (simulate peak traffic)
- [ ] Failure scenario testing (rate limits, timeouts)
- [ ] Security testing (token validation, input sanitization)
