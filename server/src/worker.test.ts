// --- Unit tests for retry / backoff logic ---
// These test the core retry policy independently of MongoDB / network.

const MAX_ATTEMPTS = 5;
const BASE_BACKOFF_MS = 1000;

/** Mirrors the backoff calculation in worker.ts */
function calculateBackoff(attempt: number): { backoff: number; jitter: number; total: number } {
  const backoff = BASE_BACKOFF_MS * Math.pow(2, attempt - 1);
  const jitter = Math.floor(Math.random() * 1000);
  return { backoff, jitter, total: backoff + jitter };
}

/** Mirrors the retry decision logic in worker.ts */
function shouldRetry(attempts: number, statusCode: number): boolean {
  const isRetryable = statusCode === 0 || statusCode >= 500;
  return isRetryable && attempts < MAX_ATTEMPTS;
}

describe('Exponential Backoff Calculation', () => {
  it('should double the base delay with each attempt', () => {
    // attempt 1 → 1s, attempt 2 → 2s, attempt 3 → 4s, attempt 4 → 8s, attempt 5 → 16s
    expect(BASE_BACKOFF_MS * Math.pow(2, 0)).toBe(1000);
    expect(BASE_BACKOFF_MS * Math.pow(2, 1)).toBe(2000);
    expect(BASE_BACKOFF_MS * Math.pow(2, 2)).toBe(4000);
    expect(BASE_BACKOFF_MS * Math.pow(2, 3)).toBe(8000);
    expect(BASE_BACKOFF_MS * Math.pow(2, 4)).toBe(16000);
  });

  it('should add jitter between 0 and 999ms', () => {
    for (let i = 0; i < 100; i++) {
      const { jitter } = calculateBackoff(1);
      expect(jitter).toBeGreaterThanOrEqual(0);
      expect(jitter).toBeLessThan(1000);
    }
  });

  it('should always produce a positive total delay', () => {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const { total } = calculateBackoff(attempt);
      expect(total).toBeGreaterThan(0);
    }
  });
});

describe('Retry Decision Logic', () => {
  it('should retry on 5xx errors when under max attempts', () => {
    expect(shouldRetry(1, 500)).toBe(true);
    expect(shouldRetry(1, 502)).toBe(true);
    expect(shouldRetry(1, 503)).toBe(true);
    expect(shouldRetry(4, 500)).toBe(true);
  });

  it('should retry on network errors (status 0) when under max attempts', () => {
    expect(shouldRetry(1, 0)).toBe(true);
    expect(shouldRetry(3, 0)).toBe(true);
  });

  it('should NOT retry on 4xx errors — these are permanent client failures', () => {
    expect(shouldRetry(1, 400)).toBe(false);
    expect(shouldRetry(1, 401)).toBe(false);
    expect(shouldRetry(1, 403)).toBe(false);
    expect(shouldRetry(1, 404)).toBe(false);
    expect(shouldRetry(1, 422)).toBe(false);
  });

  it('should NOT retry when max attempts reached, even for 5xx', () => {
    expect(shouldRetry(5, 500)).toBe(false);
    expect(shouldRetry(5, 0)).toBe(false);
    expect(shouldRetry(6, 500)).toBe(false);
  });

  it('should NOT retry when max attempts reached for network errors', () => {
    expect(shouldRetry(5, 0)).toBe(false);
  });
});

describe('Event Type Matching', () => {
  // Mirrors the matchesFilter function from index.ts
  const matchesFilter = (eventType: string, filter: string): boolean => {
    if (filter === '*' || filter === eventType) return true;
    if (filter.endsWith('.*')) {
      const prefix = filter.slice(0, -2);
      return eventType.startsWith(prefix);
    }
    return false;
  };

  it('should match exact event types', () => {
    expect(matchesFilter('user.created', 'user.created')).toBe(true);
    expect(matchesFilter('order.shipped', 'order.shipped')).toBe(true);
  });

  it('should match wildcard patterns', () => {
    expect(matchesFilter('user.created', 'user.*')).toBe(true);
    expect(matchesFilter('user.deleted', 'user.*')).toBe(true);
    expect(matchesFilter('user.updated', 'user.*')).toBe(true);
  });

  it('should match the global wildcard', () => {
    expect(matchesFilter('user.created', '*')).toBe(true);
    expect(matchesFilter('anything.here', '*')).toBe(true);
  });

  it('should NOT match unrelated event types', () => {
    expect(matchesFilter('order.created', 'user.*')).toBe(false);
    expect(matchesFilter('user.created', 'order.created')).toBe(false);
  });

  it('should NOT match partial prefixes without wildcard', () => {
    expect(matchesFilter('user.created', 'user')).toBe(false);
    expect(matchesFilter('user.created', 'user.c')).toBe(false);
  });
});
