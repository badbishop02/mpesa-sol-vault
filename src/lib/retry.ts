export async function retry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 300): Promise<T> {
  let attempt = 0;
  let lastErr: any;
  
  while (attempt < attempts) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      attempt++;
      if (attempt < attempts) {
        const backoff = delayMs * Math.pow(2, attempt - 1);
        await new Promise((res) => setTimeout(res, backoff));
      }
    }
  }
  throw lastErr;
}