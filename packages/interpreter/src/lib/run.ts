import { TYPE_AWAIT } from '../constants'
import { EvaluatedNode } from '../types'

export function run(
  iter: Iterator<EvaluatedNode, EvaluatedNode, EvaluatedNode>,
  cur?: EvaluatedNode & { isError?: boolean },
): EvaluatedNode | Promise<EvaluatedNode> {
  const { value, done } =
    cur === undefined ? iter.next() : cur.isError ? iter.throw!(cur.value) : iter.next(cur)

  if (done) {
    return value
  }

  if (value.type === TYPE_AWAIT) {
    return Promise.resolve(value.value).then(
      (result) => {
        return run(iter, { value: result })
      },
      (error) => {
        return run(iter, { value: error, isError: true })
      },
    )
  }

  return run(iter, value)
}
