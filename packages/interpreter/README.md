# JSConsole Interpreter

A JavaScript interpreter written in JavaScript, based on the Acorn parser.

**It is very experimental and a work in progress.**

## Features

- Non-isolated by design: uses built-in objects and prototypes from the current realm and returns normal objects, not internal representations
- Option `throwOnSideEffect: boolean` that stops execution when code has side effects
- Tracks metadata for objects and functions (e.g., WeakMap entries, Promise state, target of a bound function)
- Supports strict and non-strict modes
- Supports top-level await
- Option `wrapObjectLiteral: boolean` to ensure object-like input such as `{ a: 1 }` evaluates as an object rather than a block
- Result values comply with the ECMAScript specification – the same way `eval` returns the last expression's value (roughly speaking)
- Supports TypeScript via the `stripTypes: boolean` option – by stripping erasable types without performing type checking (similar to `--experimental-strip-types` flag in Node.js, which is enabled by default since Node.js 23.6.0)

## Usage

Basic usage:

```ts
import { evaluate } from '@jsconsole/interpreter'

evaluate('1 + 1') // { value: 2 }
evaluate('NaN') // { value: NaN }
evaluate('Math.min(1, 2, 3)') // { value: 1 }
```

`globalThis` is used as the default `globalObject`, but you can pass a custom one:

```ts
evaluate('a', { globalObject: { a: 1 } }) // { value: 1 }
```

If there is top-level await, the result is a Promise:

```ts
evaluate('await Promise.resolve(1)') // Promise<{ value: 1 }>
await evaluate('await Promise.resolve(1)') // { value: 1 }
// It is unambiguous when the expression itself returns a Promise:
evaluate('Promise.resolve(1)') // { value: Promise<1> }
```

To preserve context across sequential `evaluate` calls, define `globalObject`, `globalScope`, and `metadata` in advance and pass them to each call. The interpreter mutates these objects during evaluation.

```ts
const options = {
  globalObject: {},
  globalScope: { bindings: new Map() },
  metadata: new Metadata(),
}

evaluate('var a = 1', options) // globalObject: { a: 1 }, globalScope: { bindings: Map(0) }
evaluate('let b = 2', options) // globalObject: { a: 1 }, globalScope: { bindings: Map(1) { 'b' => { value: 2, kind: 'let' } } }
```

With option `throwOnSideEffect: true`, the interpreter stops execution when code (potentially) has side effects:

```ts
evaluate('a = 1', { throwOnSideEffect: true }) // throws a PossibleSideEffectError
evaluate('array.sort()', { throwOnSideEffect: true }) // throws a PossibleSideEffectError
evaluate('alert(1)', { throwOnSideEffect: true }) // throws a PossibleSideEffectError
```

This option is used by the JSConsole app to provide autocomplete and eager evaluation.
