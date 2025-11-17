import { Scope } from '../types'
import { syncContext } from './syncContext'

export function createScope<T extends Scope>(scope: T): T {
  syncContext?.tmpRefs.add(scope)
  return scope
}
