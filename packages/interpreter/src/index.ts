import { parse, Program } from 'acorn'
import tsBlankSpace from 'ts-blank-space'
import { EMPTY } from './constants'
import { Metadata } from './lib/Metadata'
import { run } from './lib/run'
import { SideEffectInfo } from './lib/SideEffectInfo'
import { setSyncContext } from './lib/syncContext'
import { wrapObjectLiteral } from './lib/wrapObjectLiteral'
import { evaluateNode } from './nodes'
import { Context, EvaluatedNode, EvaluateOptions, EvaluateResult, GlobalScope } from './types'

export type { EvaluateOptions, EvaluateResult, PublicGlobalScope as GlobalScope } from './types'

export * from './lib/Metadata'
export * from './lib/SideEffectInfo'

export { InternalError } from './lib/InternalError'
export { PossibleSideEffectError } from './lib/PossibleSideEffectError'
export { TimeoutError } from './lib/TimeoutError'
export { UnsupportedOperationError } from './lib/UnsupportedOperationError'

/**
 * Evaluate JavaScript code.
 */
export function evaluate(
  code: string,
  options?: EvaluateOptions,
): EvaluateResult | Promise<EvaluateResult> {
  if (options?.wrapObjectLiteral) {
    code = wrapObjectLiteral(code)
  }

  const ast = options?.stripTypes ? parseCodeStripTypes(code) : parseCode(code)

  const globalObject = (options?.globalObject ?? globalThis) as Record<PropertyKey, unknown>
  const globalScope: GlobalScope = {
    kind: 'global',
    bindings: options?.globalScope?.bindings ?? new Map(),
    parent: null,
    hasThisBinding: true,
    thisValue: globalObject,
  }

  const metadata = options?.metadata ?? new Metadata(globalObject)
  const sideEffectInfo =
    options?.sideEffectInfo ??
    (options?.throwOnSideEffect ? SideEffectInfo.withDefaults(globalThis) : new SideEffectInfo())

  const context: Context = {
    type: 'script',
    code,
    strict: false,
    globalObject,
    globalScope,
    metadata,
    sideEffectInfo,
    debug: options?.debug,
  }

  setSyncContext({
    throwOnSideEffect: !!options?.throwOnSideEffect,
    tmpRefs: new WeakSet(),
    timeout: options?.timeout,
    startTimestamp: performance.now(),
  })

  try {
    const evaluated: EvaluatedNode | Promise<EvaluatedNode> = run(
      evaluateNode(ast, context.globalScope, context),
      context,
    )

    if (evaluated instanceof Promise) {
      DEBUG_INT && context.debug?.('Result: <top-level await promise>')
      return evaluated.then((evaluated) => {
        const resultValue = evaluated.value !== EMPTY ? evaluated.value : undefined
        DEBUG_INT && context.debug?.('Resolved result:', resultValue)
        return { value: resultValue }
      })
    }

    const resultValue = evaluated.value !== EMPTY ? evaluated.value : undefined
    DEBUG_INT && context.debug?.('Result:', resultValue)
    return { value: resultValue }
  } finally {
    setSyncContext(null)
  }
}

function parseCodeStripTypes(code: string): Program {
  try {
    return parseCode(code)
  } catch (error) {
    if (error instanceof SyntaxError) {
      const js = tsBlankSpace(code)
      if (js === code) {
        throw error
      }

      return parseCode(js)
    }

    throw error
  }
}

function parseCode(code: string): Program {
  return parse(code, {
    ecmaVersion: 'latest',
    locations: true,
    allowAwaitOutsideFunction: true,
  })
}
