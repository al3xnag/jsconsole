export type PromiseState = {
  status: 'pending' | 'fulfilled' | 'rejected'
  value: unknown
}

export async function promiseState(promise: Promise<unknown>): Promise<PromiseState> {
  const pending = Symbol()
  const state = await Promise.race([promise, pending]).then(
    (value) =>
      value === pending
        ? { status: 'pending' as const, value: undefined }
        : { status: 'fulfilled' as const, value },
    (value) => ({ status: 'rejected' as const, value }),
  )

  return state
}
