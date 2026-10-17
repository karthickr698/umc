/** Runs at most `max` tasks at once; the rest wait in FIFO order. */
export function createConcurrencyLimiter(max: number) {
  let active = 0;
  const queue: (() => void)[] = [];

  // A freed slot is handed straight to the next waiter so newcomers cannot jump the queue.
  function release(): void {
    const next = queue.shift();
    if (next) next();
    else active -= 1;
  }

  return async function run<T>(task: () => Promise<T>): Promise<T> {
    if (active < max) active += 1;
    else await new Promise<void>((resolve) => queue.push(resolve));
    try {
      return await task();
    } finally {
      release();
    }
  };
}
