export type SyncContext = {
  throwOnSideEffect: boolean
  tmpRefs: WeakSet<object>
  timeout: number | undefined
  startTimestamp: number
}

export let syncContext: SyncContext | null = null

export function setSyncContext(context: SyncContext | null) {
  syncContext = context
}
