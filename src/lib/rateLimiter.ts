export class TokenBucket {
  tokens: number;
  capacity: number;
  refillRatePerSecond: number;
  lastRefill: number;

  constructor(capacity = 5, refillRatePerSecond = 1) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRatePerSecond = refillRatePerSecond;
    this.lastRefill = Date.now();
  }

  refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const refill = elapsed * this.refillRatePerSecond;
    if (refill > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + refill);
      this.lastRefill = now;
    }
  }

  take(count = 1) {
    this.refill();
    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }
    return false;
  }
}

// Global rate limiter instances
const userBuckets = new Map<string, TokenBucket>();

export function getUserBucket(userId: string): TokenBucket {
  if (!userBuckets.has(userId)) {
    userBuckets.set(userId, new TokenBucket(10, 0.5)); // 10 tokens, refill 0.5/sec
  }
  return userBuckets.get(userId)!;
}