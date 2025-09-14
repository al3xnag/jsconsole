import { TYPE_AWAIT } from '../constants'
import { Context, EvaluatedNode } from '../types'
import { throwIfTimedOut } from './throwIfTimedOut'

export function run(
  iter: Iterator<EvaluatedNode, EvaluatedNode, EvaluatedNode>,
  context: Context,
  cur?: EvaluatedNode & { isError?: boolean },
): EvaluatedNode | Promise<EvaluatedNode> {
  throwIfTimedOut()

  const { value, done } =
    cur === undefined ? iter.next() : cur.isError ? iter.throw!(cur.value) : iter.next(cur)

  if (done) {
    return value
  }

  if (value.type === TYPE_AWAIT) {
    return Promise.resolve(value.value).then(
      (result) => {
        return run(iter, context, { value: result })
      },
      (error) => {
        return run(iter, context, { value: error, isError: true })
      },
    )
  }

  if (value.value instanceof Promise) {
    trackPromise(value.value, context)
  }

  return run(iter, context, value)
}

function trackPromise(promise: Promise<unknown>, context: Context) {
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
