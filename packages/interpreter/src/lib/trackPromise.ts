import { Context } from '../types'

const then = Promise.prototype.then

export function trackPromise(promise: Promise<unknown>, context: Context) {
  const {
    metadata: { promises },
  } = context

  if (promises.has(promise)) {
    return
  }

  try {
    then.call(
      promise,
      (result) => promises.set(promise, { state: 'fulfilled', result }),
      (reason) => {
        const handled = promises.get(promise)?.handled
        promises.set(promise, { state: 'rejected', result: reason, handled })
        if (!handled) {
          context.onUnhandledRejection?.(reason, promise)
        }
      },
    )

    promises.set(promise, { state: 'pending', result: undefined })
  } catch {
    // NOTE: Reflect.construct(function(){}, [], Promise).then(() => 999)
    // throws TypeError: Method Promise.prototype.then called on incompatible receiver #<Promise>
    // See also test262/test/built-ins/Promise/is-a-constructor.js.
  }
}
