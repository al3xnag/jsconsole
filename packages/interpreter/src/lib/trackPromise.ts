import { Context } from '../types'

export function trackPromise(promise: Promise<unknown>, context: Context) {
  const {
    metadata: { promises },
  } = context

  if (promises.has(promise)) {
    return
  }

  promises.set(promise, { state: 'pending', result: undefined })

  promise.then(
    (result) => {
      promises.set(promise, { state: 'fulfilled', result })
    },
    (result) => {
      promises.set(promise, { state: 'rejected', result })
    },
  )
}
