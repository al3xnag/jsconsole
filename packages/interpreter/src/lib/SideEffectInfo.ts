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

  static withDefaults(globalObject: typeof globalThis) {
    const info = new SideEffectInfo()
    const defaultFunctions = getDefaultFunctions(globalObject)
    info.functions = new WeakMap(defaultFunctions)
    return info
  }
}

function getDefaultFunctions(self: typeof globalThis): [Function, SideEffectFlags][] {
  const list: [Function | undefined, SideEffectFlags][] = [
    // Global
    [self.isNaN, SIDE_EFFECT_FREE],
    [self.isFinite, SIDE_EFFECT_FREE],
    [self.parseFloat, SIDE_EFFECT_FREE],
    [self.parseInt, SIDE_EFFECT_FREE],

    // Number
    [self.Number, SIDE_EFFECT_FREE],
    [self.Number.isFinite, SIDE_EFFECT_FREE],
    [self.Number.isInteger, SIDE_EFFECT_FREE],
    [self.Number.isNaN, SIDE_EFFECT_FREE],
    [self.Number.isSafeInteger, SIDE_EFFECT_FREE],
    [self.Number.parseFloat, SIDE_EFFECT_FREE],
    [self.Number.parseInt, SIDE_EFFECT_FREE],
    [self.Number.prototype.toFixed, SIDE_EFFECT_FREE],
    [self.Number.prototype.toExponential, SIDE_EFFECT_FREE],
    [self.Number.prototype.toPrecision, SIDE_EFFECT_FREE],
    [self.Number.prototype.toString, SIDE_EFFECT_FREE],
    [self.Number.prototype.valueOf, SIDE_EFFECT_FREE],

    // Date
    [self.Date, SIDE_EFFECT_FREE],
    [self.Date.prototype.getDate, SIDE_EFFECT_FREE],
    [self.Date.prototype.setDate, SIDE_EFFECT_FREE | SIDE_EFFECT_CHECK_INVOKER_TMP_OBJ],

    // Math
    [self.Math.abs, SIDE_EFFECT_FREE],
    [self.Math.acos, SIDE_EFFECT_FREE],
    [self.Math.acosh, SIDE_EFFECT_FREE],
    [self.Math.asin, SIDE_EFFECT_FREE],
    [self.Math.asinh, SIDE_EFFECT_FREE],
    [self.Math.atan, SIDE_EFFECT_FREE],
    [self.Math.atan2, SIDE_EFFECT_FREE],
    [self.Math.atanh, SIDE_EFFECT_FREE],
    [self.Math.cbrt, SIDE_EFFECT_FREE],
    [self.Math.ceil, SIDE_EFFECT_FREE],
    [self.Math.clz32, SIDE_EFFECT_FREE],
    [self.Math.cos, SIDE_EFFECT_FREE],
    [self.Math.cosh, SIDE_EFFECT_FREE],
    [self.Math.exp, SIDE_EFFECT_FREE],
    [self.Math.expm1, SIDE_EFFECT_FREE],
    [self.Math.floor, SIDE_EFFECT_FREE],
    [self.Math.fround, SIDE_EFFECT_FREE],
    [self.Math.hypot, SIDE_EFFECT_FREE],
    [self.Math.imul, SIDE_EFFECT_FREE],
    [self.Math.log, SIDE_EFFECT_FREE],
    [self.Math.log10, SIDE_EFFECT_FREE],
    [self.Math.log1p, SIDE_EFFECT_FREE],
    [self.Math.log2, SIDE_EFFECT_FREE],
    [self.Math.max, SIDE_EFFECT_FREE],
    [self.Math.min, SIDE_EFFECT_FREE],
    [self.Math.pow, SIDE_EFFECT_FREE],
    [self.Math.random, SIDE_EFFECT_FREE],
    [self.Math.round, SIDE_EFFECT_FREE],
    [self.Math.sign, SIDE_EFFECT_FREE],
    [self.Math.sin, SIDE_EFFECT_FREE],
    [self.Math.sinh, SIDE_EFFECT_FREE],
    [self.Math.sqrt, SIDE_EFFECT_FREE],
    [self.Math.tan, SIDE_EFFECT_FREE],
    [self.Math.tanh, SIDE_EFFECT_FREE],
    [self.Math.trunc, SIDE_EFFECT_FREE],

    // Object
    [self.Object, SIDE_EFFECT_FREE],
    [self.Object.prototype.hasOwnProperty, SIDE_EFFECT_FREE],
    [self.Object.prototype.isPrototypeOf, SIDE_EFFECT_FREE],
    [self.Object.prototype.propertyIsEnumerable, SIDE_EFFECT_FREE],
    [self.Object.prototype.toLocaleString, SIDE_EFFECT_FREE],
    [self.Object.prototype.toString, SIDE_EFFECT_FREE],
    [self.Object.prototype.valueOf, SIDE_EFFECT_FREE],
    [self.Object.assign, SIDE_EFFECT_FREE | SIDE_EFFECT_CHECK_ARG0_TMP_OBJ],
    [self.Object.create, SIDE_EFFECT_FREE],
    // Object.defineProperties,
    // Object.defineProperty,
    [self.Object.keys, SIDE_EFFECT_FREE],
    [self.Object.values, SIDE_EFFECT_FREE],
    [self.Object.entries, SIDE_EFFECT_FREE],
    [self.Object.fromEntries, SIDE_EFFECT_FREE],
    [self.Object.isExtensible, SIDE_EFFECT_FREE],
    [self.Object.isFrozen, SIDE_EFFECT_FREE],
    [self.Object.isSealed, SIDE_EFFECT_FREE],
    [self.Object.getOwnPropertyDescriptor, SIDE_EFFECT_FREE],
    [self.Object.getOwnPropertyDescriptors, SIDE_EFFECT_FREE],
    [self.Object.getOwnPropertyNames, SIDE_EFFECT_FREE],
    [self.Object.getOwnPropertySymbols, SIDE_EFFECT_FREE],
    [self.Object.getPrototypeOf, SIDE_EFFECT_FREE],
    // Object.setPrototypeOf,
    // Object.freeze,
    // Object.seal,
    // Object.preventExtensions,
    [self.Object.hasOwn, SIDE_EFFECT_FREE],
    [self.Object.is, SIDE_EFFECT_FREE],

    // Reflect
    [self.Reflect.getPrototypeOf, SIDE_EFFECT_FREE],
    [self.Reflect.getOwnPropertyDescriptor, SIDE_EFFECT_FREE],
    [self.Reflect.has, SIDE_EFFECT_FREE],
    [self.Reflect.isExtensible, SIDE_EFFECT_FREE],
    [self.Reflect.ownKeys, SIDE_EFFECT_FREE],

    // Array
    [self.Array, SIDE_EFFECT_FREE],
    [self.Array.prototype.at, SIDE_EFFECT_FREE],
    [self.Array.prototype.concat, SIDE_EFFECT_FREE],
    [self.Array.prototype.copyWithin, SIDE_EFFECT_FREE | SIDE_EFFECT_CHECK_INVOKER_TMP_OBJ],
    [self.Array.prototype.entries, SIDE_EFFECT_FREE],
    [self.Array.prototype.every, SIDE_EFFECT_FREE],
    [self.Array.prototype.fill, SIDE_EFFECT_FREE | SIDE_EFFECT_CHECK_INVOKER_TMP_OBJ],
    [self.Array.prototype.filter, SIDE_EFFECT_FREE | SIDE_EFFECT_CHECK_ARG0_FN_NO_SIDE_EFFECT],
    [self.Array.prototype.find, SIDE_EFFECT_FREE | SIDE_EFFECT_CHECK_ARG0_FN_NO_SIDE_EFFECT],
    [self.Array.prototype.findIndex, SIDE_EFFECT_FREE | SIDE_EFFECT_CHECK_ARG0_FN_NO_SIDE_EFFECT],
    [self.Array.prototype.flat, SIDE_EFFECT_FREE],
    [self.Array.prototype.flatMap, SIDE_EFFECT_FREE | SIDE_EFFECT_CHECK_ARG0_FN_NO_SIDE_EFFECT],
    [self.Array.prototype.forEach, SIDE_EFFECT_FREE | SIDE_EFFECT_CHECK_ARG0_FN_NO_SIDE_EFFECT],
    [self.Array.prototype.includes, SIDE_EFFECT_FREE],
    [self.Array.prototype.indexOf, SIDE_EFFECT_FREE],
    [self.Array.prototype.join, SIDE_EFFECT_FREE],
    [self.Array.prototype.keys, SIDE_EFFECT_FREE],
    [self.Array.prototype.lastIndexOf, SIDE_EFFECT_FREE],
    [self.Array.prototype.map, SIDE_EFFECT_FREE | SIDE_EFFECT_CHECK_ARG0_FN_NO_SIDE_EFFECT],
    [self.Array.prototype.pop, SIDE_EFFECT_FREE | SIDE_EFFECT_CHECK_INVOKER_TMP_OBJ],
    [self.Array.prototype.push, SIDE_EFFECT_FREE | SIDE_EFFECT_CHECK_INVOKER_TMP_OBJ],
    [self.Array.prototype.reduce, SIDE_EFFECT_FREE | SIDE_EFFECT_CHECK_ARG0_FN_NO_SIDE_EFFECT],
    [self.Array.prototype.reduceRight, SIDE_EFFECT_FREE | SIDE_EFFECT_CHECK_ARG0_FN_NO_SIDE_EFFECT],
    [self.Array.prototype.reverse, SIDE_EFFECT_FREE | SIDE_EFFECT_CHECK_INVOKER_TMP_OBJ],
    [self.Array.prototype.shift, SIDE_EFFECT_FREE | SIDE_EFFECT_CHECK_INVOKER_TMP_OBJ],
    [self.Array.prototype.slice, SIDE_EFFECT_FREE],
    [self.Array.prototype.some, SIDE_EFFECT_FREE | SIDE_EFFECT_CHECK_ARG0_FN_NO_SIDE_EFFECT],
    [
      self.Array.prototype.sort,
      SIDE_EFFECT_FREE |
        SIDE_EFFECT_CHECK_INVOKER_TMP_OBJ |
        SIDE_EFFECT_CHECK_ARG0_FN_NO_SIDE_EFFECT,
    ],
    [self.Array.prototype.splice, SIDE_EFFECT_FREE | SIDE_EFFECT_CHECK_INVOKER_TMP_OBJ],
    [self.Array.prototype.toLocaleString, SIDE_EFFECT_FREE],
    [self.Array.isArray, SIDE_EFFECT_FREE],
    [self.Array.from, SIDE_EFFECT_FREE],
    [self.Array.of, SIDE_EFFECT_FREE],
    [self.Array.prototype[Symbol.iterator], SIDE_EFFECT_FREE /* custom runtime check */],
  ]

  if (typeof window !== 'undefined') {
    list.push([findGetter(self, 'window'), SIDE_EFFECT_FREE])
    list.push([findGetter(self, 'document'), SIDE_EFFECT_FREE])
    list.push([findGetter(self, 'location'), SIDE_EFFECT_FREE])
    list.push([findGetter(self.location, 'ancestorOrigins'), SIDE_EFFECT_FREE])
    list.push([findGetter(self.location, 'href'), SIDE_EFFECT_FREE])
    list.push([findGetter(self.location, 'origin'), SIDE_EFFECT_FREE])
    list.push([findGetter(self.location, 'protocol'), SIDE_EFFECT_FREE])
    list.push([findGetter(self.location, 'host'), SIDE_EFFECT_FREE])
    list.push([findGetter(self.location, 'hostname'), SIDE_EFFECT_FREE])
    list.push([findGetter(self.location, 'port'), SIDE_EFFECT_FREE])
    list.push([findGetter(self.location, 'pathname'), SIDE_EFFECT_FREE])
    list.push([findGetter(self.location, 'search'), SIDE_EFFECT_FREE])
    list.push([findGetter(self.location, 'hash'), SIDE_EFFECT_FREE])
    list.push([findGetter(self.AbortController.prototype, 'signal'), SIDE_EFFECT_FREE])
    list.push([findGetter(self.AbortSignal.prototype, 'aborted'), SIDE_EFFECT_FREE])
    list.push([findGetter(self.AbortSignal.prototype, 'reason'), SIDE_EFFECT_FREE])
    list.push([findGetter(self.AbortSignal.prototype, 'onabort'), SIDE_EFFECT_FREE])

    // DOM
    list.push(
      [findGetter(self.Document.prototype, 'body'), SIDE_EFFECT_FREE],
      [self.Document.prototype.querySelector, SIDE_EFFECT_FREE],
      [self.Element.prototype.querySelector, SIDE_EFFECT_FREE],
    )
  }

  return list.filter((item): item is [Function, SideEffectFlags] => item[0] !== undefined)
}
