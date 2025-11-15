import { findGetter } from './findGetter'

export const SIDE_EFFECT_FREE = 1 // 1 << 0
export const SIDE_EFFECT_CHECK_INVOKER_TMP_OBJ = 2 // 1 << 1
export const SIDE_EFFECT_CHECK_ARG0_FN_NO_SIDE_EFFECT = 4 // 1 << 2
export const SIDE_EFFECT_CHECK_ARG1_FN_NO_SIDE_EFFECT = 8 // 1 << 3
export const SIDE_EFFECT_CHECK_ARG2_FN_NO_SIDE_EFFECT = 16 // 1 << 4
export const SIDE_EFFECT_CHECK_ARG0_TMP_OBJ = 32 // 1 << 5
export const SIDE_EFFECT_CHECK_ARG1_TMP_OBJ = 64 // 1 << 6
export const SIDE_EFFECT_CHECK_ARG2_TMP_OBJ = 128 // 1 << 7

export type SideEffectFlags = number

export class SideEffectInfo {
  functions = new WeakMap<Function, SideEffectFlags>()

  static withDefaults(global: typeof globalThis) {
    const info = new SideEffectInfo()
    const defaultFunctions = getDefaultFunctions(global)
    info.functions = new WeakMap(defaultFunctions)
    return info
  }
}

// WIP: This whitelist is not complete.
function getDefaultFunctions(global: typeof globalThis): [Function, SideEffectFlags][] {
  const list: [Function | undefined, SideEffectFlags][] = [
    // Global
    [global.isNaN, SIDE_EFFECT_FREE],
    [global.isFinite, SIDE_EFFECT_FREE],
    [global.parseFloat, SIDE_EFFECT_FREE],
    [global.parseInt, SIDE_EFFECT_FREE],

    // Number
    [global.Number, SIDE_EFFECT_FREE],
    [global.Number.isFinite, SIDE_EFFECT_FREE],
    [global.Number.isInteger, SIDE_EFFECT_FREE],
    [global.Number.isNaN, SIDE_EFFECT_FREE],
    [global.Number.isSafeInteger, SIDE_EFFECT_FREE],
    [global.Number.parseFloat, SIDE_EFFECT_FREE],
    [global.Number.parseInt, SIDE_EFFECT_FREE],
    [global.Number.prototype.toFixed, SIDE_EFFECT_FREE],
    [global.Number.prototype.toExponential, SIDE_EFFECT_FREE],
    [global.Number.prototype.toPrecision, SIDE_EFFECT_FREE],
    [global.Number.prototype.toString, SIDE_EFFECT_FREE],
    [global.Number.prototype.valueOf, SIDE_EFFECT_FREE],

    // Date
    [global.Date, SIDE_EFFECT_FREE],
    [global.Date.prototype.getDate, SIDE_EFFECT_FREE],
    [global.Date.prototype.setDate, SIDE_EFFECT_FREE | SIDE_EFFECT_CHECK_INVOKER_TMP_OBJ],

    // Math
    [global.Math.abs, SIDE_EFFECT_FREE],
    [global.Math.acos, SIDE_EFFECT_FREE],
    [global.Math.acosh, SIDE_EFFECT_FREE],
    [global.Math.asin, SIDE_EFFECT_FREE],
    [global.Math.asinh, SIDE_EFFECT_FREE],
    [global.Math.atan, SIDE_EFFECT_FREE],
    [global.Math.atan2, SIDE_EFFECT_FREE],
    [global.Math.atanh, SIDE_EFFECT_FREE],
    [global.Math.cbrt, SIDE_EFFECT_FREE],
    [global.Math.ceil, SIDE_EFFECT_FREE],
    [global.Math.clz32, SIDE_EFFECT_FREE],
    [global.Math.cos, SIDE_EFFECT_FREE],
    [global.Math.cosh, SIDE_EFFECT_FREE],
    [global.Math.exp, SIDE_EFFECT_FREE],
    [global.Math.expm1, SIDE_EFFECT_FREE],
    [global.Math.floor, SIDE_EFFECT_FREE],
    [global.Math.fround, SIDE_EFFECT_FREE],
    [global.Math.hypot, SIDE_EFFECT_FREE],
    [global.Math.imul, SIDE_EFFECT_FREE],
    [global.Math.log, SIDE_EFFECT_FREE],
    [global.Math.log10, SIDE_EFFECT_FREE],
    [global.Math.log1p, SIDE_EFFECT_FREE],
    [global.Math.log2, SIDE_EFFECT_FREE],
    [global.Math.max, SIDE_EFFECT_FREE],
    [global.Math.min, SIDE_EFFECT_FREE],
    [global.Math.pow, SIDE_EFFECT_FREE],
    [global.Math.random, SIDE_EFFECT_FREE],
    [global.Math.round, SIDE_EFFECT_FREE],
    [global.Math.sign, SIDE_EFFECT_FREE],
    [global.Math.sin, SIDE_EFFECT_FREE],
    [global.Math.sinh, SIDE_EFFECT_FREE],
    [global.Math.sqrt, SIDE_EFFECT_FREE],
    [global.Math.tan, SIDE_EFFECT_FREE],
    [global.Math.tanh, SIDE_EFFECT_FREE],
    [global.Math.trunc, SIDE_EFFECT_FREE],

    // Object
    [global.Object, SIDE_EFFECT_FREE],
    [global.Object.prototype.hasOwnProperty, SIDE_EFFECT_FREE],
    [global.Object.prototype.isPrototypeOf, SIDE_EFFECT_FREE],
    [global.Object.prototype.propertyIsEnumerable, SIDE_EFFECT_FREE],
    [global.Object.prototype.toLocaleString, SIDE_EFFECT_FREE],
    [global.Object.prototype.toString, SIDE_EFFECT_FREE],
    [global.Object.prototype.valueOf, SIDE_EFFECT_FREE],
    [global.Object.assign, SIDE_EFFECT_FREE | SIDE_EFFECT_CHECK_ARG0_TMP_OBJ],
    [global.Object.create, SIDE_EFFECT_FREE],
    // Object.defineProperties,
    // Object.defineProperty,
    [global.Object.keys, SIDE_EFFECT_FREE],
    [global.Object.values, SIDE_EFFECT_FREE],
    [global.Object.entries, SIDE_EFFECT_FREE],
    [global.Object.fromEntries, SIDE_EFFECT_FREE],
    [global.Object.isExtensible, SIDE_EFFECT_FREE],
    [global.Object.isFrozen, SIDE_EFFECT_FREE],
    [global.Object.isSealed, SIDE_EFFECT_FREE],
    [global.Object.getOwnPropertyDescriptor, SIDE_EFFECT_FREE],
    [global.Object.getOwnPropertyDescriptors, SIDE_EFFECT_FREE],
    [global.Object.getOwnPropertyNames, SIDE_EFFECT_FREE],
    [global.Object.getOwnPropertySymbols, SIDE_EFFECT_FREE],
    [global.Object.getPrototypeOf, SIDE_EFFECT_FREE],
    // Object.setPrototypeOf,
    // Object.freeze,
    // Object.seal,
    // Object.preventExtensions,
    [global.Object.hasOwn, SIDE_EFFECT_FREE],
    [global.Object.is, SIDE_EFFECT_FREE],

    // Reflect
    [global.Reflect.getPrototypeOf, SIDE_EFFECT_FREE],
    [global.Reflect.getOwnPropertyDescriptor, SIDE_EFFECT_FREE],
    [global.Reflect.has, SIDE_EFFECT_FREE],
    [global.Reflect.isExtensible, SIDE_EFFECT_FREE],
    [global.Reflect.ownKeys, SIDE_EFFECT_FREE],

    // Array
    [global.Array, SIDE_EFFECT_FREE],
    [global.Array.prototype.at, SIDE_EFFECT_FREE],
    [global.Array.prototype.concat, SIDE_EFFECT_FREE],
    [global.Array.prototype.copyWithin, SIDE_EFFECT_FREE | SIDE_EFFECT_CHECK_INVOKER_TMP_OBJ],
    [global.Array.prototype.entries, SIDE_EFFECT_FREE],
    [global.Array.prototype.every, SIDE_EFFECT_FREE],
    [global.Array.prototype.fill, SIDE_EFFECT_FREE | SIDE_EFFECT_CHECK_INVOKER_TMP_OBJ],
    [global.Array.prototype.filter, SIDE_EFFECT_FREE | SIDE_EFFECT_CHECK_ARG0_FN_NO_SIDE_EFFECT],
    [global.Array.prototype.find, SIDE_EFFECT_FREE | SIDE_EFFECT_CHECK_ARG0_FN_NO_SIDE_EFFECT],
    [global.Array.prototype.findIndex, SIDE_EFFECT_FREE | SIDE_EFFECT_CHECK_ARG0_FN_NO_SIDE_EFFECT],
    [global.Array.prototype.flat, SIDE_EFFECT_FREE],
    [global.Array.prototype.flatMap, SIDE_EFFECT_FREE | SIDE_EFFECT_CHECK_ARG0_FN_NO_SIDE_EFFECT],
    [global.Array.prototype.forEach, SIDE_EFFECT_FREE | SIDE_EFFECT_CHECK_ARG0_FN_NO_SIDE_EFFECT],
    [global.Array.prototype.includes, SIDE_EFFECT_FREE],
    [global.Array.prototype.indexOf, SIDE_EFFECT_FREE],
    [global.Array.prototype.join, SIDE_EFFECT_FREE],
    [global.Array.prototype.keys, SIDE_EFFECT_FREE],
    [global.Array.prototype.lastIndexOf, SIDE_EFFECT_FREE],
    [global.Array.prototype.map, SIDE_EFFECT_FREE | SIDE_EFFECT_CHECK_ARG0_FN_NO_SIDE_EFFECT],
    [global.Array.prototype.pop, SIDE_EFFECT_FREE | SIDE_EFFECT_CHECK_INVOKER_TMP_OBJ],
    [global.Array.prototype.push, SIDE_EFFECT_FREE | SIDE_EFFECT_CHECK_INVOKER_TMP_OBJ],
    [global.Array.prototype.reduce, SIDE_EFFECT_FREE | SIDE_EFFECT_CHECK_ARG0_FN_NO_SIDE_EFFECT],
    [
      global.Array.prototype.reduceRight,
      SIDE_EFFECT_FREE | SIDE_EFFECT_CHECK_ARG0_FN_NO_SIDE_EFFECT,
    ],
    [global.Array.prototype.reverse, SIDE_EFFECT_FREE | SIDE_EFFECT_CHECK_INVOKER_TMP_OBJ],
    [global.Array.prototype.shift, SIDE_EFFECT_FREE | SIDE_EFFECT_CHECK_INVOKER_TMP_OBJ],
    [global.Array.prototype.slice, SIDE_EFFECT_FREE],
    [global.Array.prototype.some, SIDE_EFFECT_FREE | SIDE_EFFECT_CHECK_ARG0_FN_NO_SIDE_EFFECT],
    [
      global.Array.prototype.sort,
      SIDE_EFFECT_FREE |
        SIDE_EFFECT_CHECK_INVOKER_TMP_OBJ |
        SIDE_EFFECT_CHECK_ARG0_FN_NO_SIDE_EFFECT,
    ],
    [global.Array.prototype.splice, SIDE_EFFECT_FREE | SIDE_EFFECT_CHECK_INVOKER_TMP_OBJ],
    [global.Array.prototype.toLocaleString, SIDE_EFFECT_FREE],
    [global.Array.isArray, SIDE_EFFECT_FREE],
    [global.Array.from, SIDE_EFFECT_FREE],
    [global.Array.of, SIDE_EFFECT_FREE],
    [global.Array.prototype[Symbol.iterator], SIDE_EFFECT_FREE /* custom runtime check */],

    // Function
    [global.Function.prototype.bind, SIDE_EFFECT_FREE],
    [global.Function.prototype[Symbol.hasInstance], SIDE_EFFECT_FREE],
  ]

  if ('window' in global && global === global.window) {
    list.push([findGetter(global, 'window'), SIDE_EFFECT_FREE])
    list.push([findGetter(global, 'document'), SIDE_EFFECT_FREE])
    list.push([findGetter(global, 'location'), SIDE_EFFECT_FREE])
    list.push([findGetter(global.location, 'ancestorOrigins'), SIDE_EFFECT_FREE])
    list.push([findGetter(global.location, 'href'), SIDE_EFFECT_FREE])
    list.push([findGetter(global.location, 'origin'), SIDE_EFFECT_FREE])
    list.push([findGetter(global.location, 'protocol'), SIDE_EFFECT_FREE])
    list.push([findGetter(global.location, 'host'), SIDE_EFFECT_FREE])
    list.push([findGetter(global.location, 'hostname'), SIDE_EFFECT_FREE])
    list.push([findGetter(global.location, 'port'), SIDE_EFFECT_FREE])
    list.push([findGetter(global.location, 'pathname'), SIDE_EFFECT_FREE])
    list.push([findGetter(global.location, 'search'), SIDE_EFFECT_FREE])
    list.push([findGetter(global.location, 'hash'), SIDE_EFFECT_FREE])
    list.push([findGetter(global.AbortController.prototype, 'signal'), SIDE_EFFECT_FREE])
    list.push([findGetter(global.AbortSignal.prototype, 'aborted'), SIDE_EFFECT_FREE])
    list.push([findGetter(global.AbortSignal.prototype, 'reason'), SIDE_EFFECT_FREE])
    list.push([findGetter(global.AbortSignal.prototype, 'onabort'), SIDE_EFFECT_FREE])

    // DOM
    list.push(
      [findGetter(global.Document.prototype, 'body'), SIDE_EFFECT_FREE],
      [global.Document.prototype.querySelector, SIDE_EFFECT_FREE],
      [global.Element.prototype.querySelector, SIDE_EFFECT_FREE],
    )
  }

  return list.filter((item): item is [Function, SideEffectFlags] => item[0] !== undefined)
}
