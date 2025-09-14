import { TimeoutError } from './TimeoutError'
import { syncContext } from './syncContext'

export function throwIfTimedOut(): void {
  if (
    syncContext?.timeout &&
    performance.now() - syncContext.startTimestamp > syncContext.timeout
  ) {
    throw new TimeoutError('Evaluation timed out')
  }
}
