/**
 * Exhaust the microtask queue.
 */
export function exhaustMicrotaskQueue(): Promise<void> {
  if (typeof window.scheduler !== 'undefined') {
    // https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/postTask
    return window.scheduler.postTask(() => {}, { priority: 'user-blocking' })
  }

  return new Promise((resolve) => setTimeout(resolve, 0))
}
