import { findGetter } from './findGetter'

export const SIDE_EFFECT_CALL_FREE = 1 << 1
export const SIDE_EFFECT_CONSTRUCT_FREE = 1 << 2
export const SIDE_EFFECT_FREE = SIDE_EFFECT_CALL_FREE | SIDE_EFFECT_CONSTRUCT_FREE

export const SIDE_EFFECT_CALL_CHECK_RECEIVER_TMP_OBJ = 1 << 3
export const SIDE_EFFECT_CALL_CHECK_ARG0_TMP_OBJ = 1 << 4
export const SIDE_EFFECT_CALL_CHECK_ARG1_TMP_OBJ = 1 << 5
export const SIDE_EFFECT_CALL_CHECK_ARG2_TMP_OBJ = 1 << 6
export const SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER = 1 << 7
export const SIDE_EFFECT_CALL_CHECK_ARG1_TO_NUMBER = 1 << 8
export const SIDE_EFFECT_CALL_CHECK_ALL_ARGS_TO_NUMBER = 1 << 9
export const SIDE_EFFECT_CALL_CHECK_ARG0_TO_STRING = 1 << 10
export const SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMERIC = 1 << 11
export const SIDE_EFFECT_CALL_CHECK_ARG0_TO_PRIMITIVE = 1 << 12
export const SIDE_EFFECT_CALL_CHECK_ARG0_ARRAY_CALLBACK = 1 << 13
export const SIDE_EFFECT_CONSTRUCT_CHECK_ARG0_TO_NUMERIC = 1 << 14
export const SIDE_EFFECT_CONSTRUCT_CHECK_ALL_ARGS_TO_NUMBER = 1 << 15

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
  // https://tc39.es/ecma262/#sec-well-known-intrinsic-objects
  const list: [Function | undefined, SideEffectFlags][] = [
    // Global functions (https://tc39.es/ecma262/#sec-function-properties-of-the-global-object)
    [global.isNaN, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER],
    [global.isFinite, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER],
    [global.parseFloat, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_STRING],
    [global.parseInt, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_STRING],
    [global.decodeURI, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_STRING],
    [global.decodeURIComponent, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_STRING],
    [global.encodeURI, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_STRING],
    [global.encodeURIComponent, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_STRING],
    [global.escape, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_STRING],
    [global.unescape, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_STRING],

    // Number (https://tc39.es/ecma262/#sec-number-objects)
    [
      global.Number,
      SIDE_EFFECT_FREE |
        SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMERIC |
        SIDE_EFFECT_CONSTRUCT_CHECK_ARG0_TO_NUMERIC,
    ],
    [global.Number.isFinite, SIDE_EFFECT_FREE],
    [global.Number.isInteger, SIDE_EFFECT_FREE],
    [global.Number.isNaN, SIDE_EFFECT_FREE],
    [global.Number.isSafeInteger, SIDE_EFFECT_FREE],
    // NOTE: Number.parseFloat === parseFloat (https://tc39.es/ecma262/#sec-number.parsefloat)
    // [global.Number.parseFloat, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_STRING],
    // NOTE: Number.parseInt === parseInt (https://tc39.es/ecma262/#sec-number.parseint)
    // [global.Number.parseInt, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_STRING],
    [global.Number.prototype.toExponential, SIDE_EFFECT_FREE],
    [global.Number.prototype.toFixed, SIDE_EFFECT_FREE],
    [global.Number.prototype.toPrecision, SIDE_EFFECT_FREE],
    [global.Number.prototype.toString, SIDE_EFFECT_FREE],
    [global.Number.prototype.toLocaleString, SIDE_EFFECT_FREE],
    [global.Number.prototype.valueOf, SIDE_EFFECT_FREE],

    // BigInt (https://tc39.es/ecma262/#sec-bigint-objects)
    [global.BigInt, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_PRIMITIVE],
    // TODO: BigInt.asIntN
    // TODO: BigInt.asUintN
    [global.BigInt.prototype.toString, SIDE_EFFECT_FREE],
    [global.BigInt.prototype.toLocaleString, SIDE_EFFECT_FREE],
    [global.BigInt.prototype.valueOf, SIDE_EFFECT_FREE],

    // Math (https://tc39.es/ecma262/#sec-math-object)
    [global.Math.abs, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER],
    [global.Math.acos, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER],
    [global.Math.acosh, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER],
    [global.Math.asin, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER],
    [global.Math.asinh, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER],
    [global.Math.atan, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER],
    [global.Math.atanh, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER],
    [
      global.Math.atan2,
      SIDE_EFFECT_FREE |
        SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER |
        SIDE_EFFECT_CALL_CHECK_ARG1_TO_NUMBER,
    ],
    [global.Math.cbrt, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER],
    [global.Math.ceil, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER],
    [global.Math.clz32, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER],
    [global.Math.cos, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER],
    [global.Math.cosh, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER],
    [global.Math.exp, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER],
    [global.Math.expm1, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER],
    [global.Math.floor, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER],
    [global.Math.fround, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER],
    [(global.Math as any).f16round, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER],
    [global.Math.hypot, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ALL_ARGS_TO_NUMBER],
    [
      global.Math.imul,
      SIDE_EFFECT_FREE |
        SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER |
        SIDE_EFFECT_CALL_CHECK_ARG1_TO_NUMBER,
    ],
    [global.Math.log, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER],
    [global.Math.log1p, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER],
    [global.Math.log10, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER],
    [global.Math.log2, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER],
    [global.Math.max, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ALL_ARGS_TO_NUMBER],
    [global.Math.min, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ALL_ARGS_TO_NUMBER],
    [
      global.Math.pow,
      SIDE_EFFECT_FREE |
        SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER |
        SIDE_EFFECT_CALL_CHECK_ARG1_TO_NUMBER,
    ],
    [global.Math.random, SIDE_EFFECT_FREE],
    [global.Math.round, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER],
    [global.Math.sign, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER],
    [global.Math.sin, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER],
    [global.Math.sinh, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER],
    [global.Math.sqrt, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER],
    // TODO: Math.sumPrecise
    [global.Math.tan, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER],
    [global.Math.tanh, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER],
    [global.Math.trunc, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER],

    // Date (https://tc39.es/ecma262/#sec-date-objects)
    [
      global.Date,
      SIDE_EFFECT_FREE |
        SIDE_EFFECT_CONSTRUCT_CHECK_ALL_ARGS_TO_NUMBER /* TODO: actually, 7 args only */,
    ],
    [global.Date.now, SIDE_EFFECT_FREE],
    [global.Date.parse, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TO_STRING],
    [
      global.Date.UTC,
      SIDE_EFFECT_FREE |
        SIDE_EFFECT_CALL_CHECK_ALL_ARGS_TO_NUMBER /* TODO: actually, 7 args only */,
    ],
    [global.Date.prototype.getDate, SIDE_EFFECT_FREE],
    [global.Date.prototype.getDay, SIDE_EFFECT_FREE],
    [global.Date.prototype.getFullYear, SIDE_EFFECT_FREE],
    [global.Date.prototype.getHours, SIDE_EFFECT_FREE],
    [global.Date.prototype.getMilliseconds, SIDE_EFFECT_FREE],
    [global.Date.prototype.getMinutes, SIDE_EFFECT_FREE],
    [global.Date.prototype.getMonth, SIDE_EFFECT_FREE],
    [global.Date.prototype.getSeconds, SIDE_EFFECT_FREE],
    [global.Date.prototype.getTime, SIDE_EFFECT_FREE],
    [global.Date.prototype.getTimezoneOffset, SIDE_EFFECT_FREE],
    [global.Date.prototype.getUTCDate, SIDE_EFFECT_FREE],
    [global.Date.prototype.getUTCDay, SIDE_EFFECT_FREE],
    [global.Date.prototype.getUTCFullYear, SIDE_EFFECT_FREE],
    [global.Date.prototype.getUTCHours, SIDE_EFFECT_FREE],
    [global.Date.prototype.getUTCMilliseconds, SIDE_EFFECT_FREE],
    [global.Date.prototype.getUTCMinutes, SIDE_EFFECT_FREE],
    [global.Date.prototype.getUTCMonth, SIDE_EFFECT_FREE],
    [global.Date.prototype.getUTCSeconds, SIDE_EFFECT_FREE],
    [
      global.Date.prototype.setDate,
      SIDE_EFFECT_FREE |
        SIDE_EFFECT_CALL_CHECK_RECEIVER_TMP_OBJ |
        SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER,
    ],
    [
      global.Date.prototype.setFullYear,
      SIDE_EFFECT_FREE |
        SIDE_EFFECT_CALL_CHECK_RECEIVER_TMP_OBJ |
        SIDE_EFFECT_CALL_CHECK_ALL_ARGS_TO_NUMBER /* TODO: actually, 3 args only */,
    ],
    [
      global.Date.prototype.setHours,
      SIDE_EFFECT_FREE |
        SIDE_EFFECT_CALL_CHECK_RECEIVER_TMP_OBJ |
        SIDE_EFFECT_CALL_CHECK_ALL_ARGS_TO_NUMBER /* TODO: actually, 4 args only */,
    ],
    [
      global.Date.prototype.setMilliseconds,
      SIDE_EFFECT_FREE |
        SIDE_EFFECT_CALL_CHECK_RECEIVER_TMP_OBJ |
        SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER,
    ],
    [
      global.Date.prototype.setMinutes,
      SIDE_EFFECT_FREE |
        SIDE_EFFECT_CALL_CHECK_RECEIVER_TMP_OBJ |
        SIDE_EFFECT_CALL_CHECK_ALL_ARGS_TO_NUMBER /* TODO: actually, 3 args only */,
    ],
    [
      global.Date.prototype.setMonth,
      SIDE_EFFECT_FREE |
        SIDE_EFFECT_CALL_CHECK_RECEIVER_TMP_OBJ |
        SIDE_EFFECT_CALL_CHECK_ARG0_TO_NUMBER |
        SIDE_EFFECT_CALL_CHECK_ARG1_TO_NUMBER,
    ],
    [global.Date.prototype[Symbol.toPrimitive], SIDE_EFFECT_FREE],

    // Object (https://tc39.es/ecma262/#sec-object-objects)
    [global.Object, SIDE_EFFECT_FREE],
    [global.Object.prototype.hasOwnProperty, SIDE_EFFECT_FREE],
    [global.Object.prototype.isPrototypeOf, SIDE_EFFECT_FREE],
    [global.Object.prototype.propertyIsEnumerable, SIDE_EFFECT_FREE],
    [global.Object.prototype.toLocaleString, SIDE_EFFECT_FREE],
    [global.Object.prototype.toString, SIDE_EFFECT_FREE],
    [global.Object.prototype.valueOf, SIDE_EFFECT_FREE],
    [global.Object.assign, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_TMP_OBJ],
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

    // Array (https://tc39.es/ecma262/#sec-array-objects)
    [global.Array, SIDE_EFFECT_FREE],
    [global.Array.prototype.at, SIDE_EFFECT_FREE],
    [global.Array.prototype.concat, SIDE_EFFECT_FREE],
    [global.Array.prototype.copyWithin, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_RECEIVER_TMP_OBJ],
    [global.Array.prototype.entries, SIDE_EFFECT_FREE],
    [global.Array.prototype.every, SIDE_EFFECT_FREE],
    [global.Array.prototype.fill, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_RECEIVER_TMP_OBJ],
    [global.Array.prototype.filter, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_ARRAY_CALLBACK],
    [global.Array.prototype.find, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_ARRAY_CALLBACK],
    [
      global.Array.prototype.findIndex,
      SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_ARRAY_CALLBACK,
    ],
    [global.Array.prototype.flat, SIDE_EFFECT_FREE],
    [global.Array.prototype.flatMap, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_ARRAY_CALLBACK],
    [global.Array.prototype.forEach, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_ARRAY_CALLBACK],
    [global.Array.prototype.includes, SIDE_EFFECT_FREE],
    [global.Array.prototype.indexOf, SIDE_EFFECT_FREE],
    [global.Array.prototype.join, SIDE_EFFECT_FREE],
    [global.Array.prototype.keys, SIDE_EFFECT_FREE],
    [global.Array.prototype.lastIndexOf, SIDE_EFFECT_FREE],
    [global.Array.prototype.map, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_ARRAY_CALLBACK],
    [global.Array.prototype.pop, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_RECEIVER_TMP_OBJ],
    [global.Array.prototype.push, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_RECEIVER_TMP_OBJ],
    [global.Array.prototype.reduce, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_ARRAY_CALLBACK],
    [
      global.Array.prototype.reduceRight,
      SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_ARRAY_CALLBACK,
    ],
    [global.Array.prototype.reverse, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_RECEIVER_TMP_OBJ],
    [global.Array.prototype.shift, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_RECEIVER_TMP_OBJ],
    [global.Array.prototype.slice, SIDE_EFFECT_FREE],
    [global.Array.prototype.some, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_ARG0_ARRAY_CALLBACK],
    [
      global.Array.prototype.sort,
      SIDE_EFFECT_FREE |
        SIDE_EFFECT_CALL_CHECK_RECEIVER_TMP_OBJ |
        SIDE_EFFECT_CALL_CHECK_ARG0_ARRAY_CALLBACK,
    ],
    [global.Array.prototype.splice, SIDE_EFFECT_FREE | SIDE_EFFECT_CALL_CHECK_RECEIVER_TMP_OBJ],
    [global.Array.prototype.toLocaleString, SIDE_EFFECT_FREE],
    [global.Array.isArray, SIDE_EFFECT_FREE],
    [global.Array.from, SIDE_EFFECT_FREE],
    [global.Array.of, SIDE_EFFECT_FREE],
    [global.Array.prototype[Symbol.iterator], SIDE_EFFECT_FREE /* custom runtime check */],

    // Function (TODO: call, apply)
    [global.Function.prototype.bind, SIDE_EFFECT_FREE],
    [global.Function.prototype.toString, SIDE_EFFECT_FREE],
    [global.Function.prototype[Symbol.hasInstance], SIDE_EFFECT_FREE],
  ]

  if ('window' in global && global === global.window) {
    list.push(
      [findGetter(global, 'window'), SIDE_EFFECT_FREE],
      [findGetter(global, 'document'), SIDE_EFFECT_FREE],
      [findGetter(global, 'location'), SIDE_EFFECT_FREE],
      [findGetter(global.location, 'ancestorOrigins'), SIDE_EFFECT_FREE],
      [findGetter(global.location, 'href'), SIDE_EFFECT_FREE],
      [findGetter(global.location, 'origin'), SIDE_EFFECT_FREE],
      [findGetter(global.location, 'protocol'), SIDE_EFFECT_FREE],
      [findGetter(global.location, 'host'), SIDE_EFFECT_FREE],
      [findGetter(global.location, 'hostname'), SIDE_EFFECT_FREE],
      [findGetter(global.location, 'port'), SIDE_EFFECT_FREE],
      [findGetter(global.location, 'pathname'), SIDE_EFFECT_FREE],
      [findGetter(global.location, 'search'), SIDE_EFFECT_FREE],
      [findGetter(global.location, 'hash'), SIDE_EFFECT_FREE],
      [findGetter(global.AbortController.prototype, 'signal'), SIDE_EFFECT_FREE],
      [findGetter(global.AbortSignal.prototype, 'aborted'), SIDE_EFFECT_FREE],
      [findGetter(global.AbortSignal.prototype, 'reason'), SIDE_EFFECT_FREE],
      [findGetter(global.AbortSignal.prototype, 'onabort'), SIDE_EFFECT_FREE],
      [findGetter(global.Document.prototype, 'body'), SIDE_EFFECT_FREE],
      [global.Document.prototype.querySelector, SIDE_EFFECT_FREE],
      // EventTarget (TODO) (https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/EventTarget)
      [global.EventTarget, SIDE_EFFECT_FREE],
      // Node (TODO) (https://developer.mozilla.org/en-US/docs/Web/API/Node)
      [findGetter(global.Node.prototype, 'baseURI'), SIDE_EFFECT_FREE],
      [findGetter(global.Node.prototype, 'childNodes'), SIDE_EFFECT_FREE],
      [findGetter(global.Node.prototype, 'firstChild'), SIDE_EFFECT_FREE],
      [findGetter(global.Node.prototype, 'isConnected'), SIDE_EFFECT_FREE],
      [findGetter(global.Node.prototype, 'lastChild'), SIDE_EFFECT_FREE],
      [findGetter(global.Node.prototype, 'nextSibling'), SIDE_EFFECT_FREE],
      [findGetter(global.Node.prototype, 'nodeName'), SIDE_EFFECT_FREE],
      [findGetter(global.Node.prototype, 'nodeType'), SIDE_EFFECT_FREE],
      [findGetter(global.Node.prototype, 'nodeValue'), SIDE_EFFECT_FREE],
      [findGetter(global.Node.prototype, 'ownerDocument'), SIDE_EFFECT_FREE],
      [findGetter(global.Node.prototype, 'parentElement'), SIDE_EFFECT_FREE],
      [findGetter(global.Node.prototype, 'parentNode'), SIDE_EFFECT_FREE],
      [findGetter(global.Node.prototype, 'previousSibling'), SIDE_EFFECT_FREE],
      [findGetter(global.Node.prototype, 'textContent'), SIDE_EFFECT_FREE],
      // Element (TODO) (https://developer.mozilla.org/en-US/docs/Web/API/Element)
      [findGetter(global.Element.prototype, 'childElementCount'), SIDE_EFFECT_FREE],
      [findGetter(global.Element.prototype, 'children'), SIDE_EFFECT_FREE],
      [findGetter(global.Element.prototype, 'classList'), SIDE_EFFECT_FREE],
      [findGetter(global.Element.prototype, 'className'), SIDE_EFFECT_FREE],
      [findGetter(global.Element.prototype, 'clientHeight'), SIDE_EFFECT_FREE],
      [findGetter(global.Element.prototype, 'clientLeft'), SIDE_EFFECT_FREE],
      [findGetter(global.Element.prototype, 'clientTop'), SIDE_EFFECT_FREE],
      [findGetter(global.Element.prototype, 'clientWidth'), SIDE_EFFECT_FREE],
      [findGetter(global.Element.prototype, 'firstElementChild'), SIDE_EFFECT_FREE],
      [findGetter(global.Element.prototype, 'id'), SIDE_EFFECT_FREE],
      [findGetter(global.Element.prototype, 'innerHTML'), SIDE_EFFECT_FREE],
      [findGetter(global.Element.prototype, 'lastElementChild'), SIDE_EFFECT_FREE],
      [findGetter(global.Element.prototype, 'localName'), SIDE_EFFECT_FREE],
      [findGetter(global.Element.prototype, 'namespaceURI'), SIDE_EFFECT_FREE],
      [findGetter(global.Element.prototype, 'nextElementSibling'), SIDE_EFFECT_FREE],
      [findGetter(global.Element.prototype, 'outerHTML'), SIDE_EFFECT_FREE],
      [findGetter(global.Element.prototype, 'part'), SIDE_EFFECT_FREE],
      [findGetter(global.Element.prototype, 'prefix'), SIDE_EFFECT_FREE],
      [findGetter(global.Element.prototype, 'previousElementSibling'), SIDE_EFFECT_FREE],
      [findGetter(global.Element.prototype, 'role'), SIDE_EFFECT_FREE],
      [findGetter(global.Element.prototype, 'scrollHeight'), SIDE_EFFECT_FREE],
      [findGetter(global.Element.prototype, 'scrollLeft'), SIDE_EFFECT_FREE],
      [findGetter(global.Element.prototype, 'scrollTop'), SIDE_EFFECT_FREE],
      [findGetter(global.Element.prototype, 'scrollWidth'), SIDE_EFFECT_FREE],
      [findGetter(global.Element.prototype, 'shadowRoot'), SIDE_EFFECT_FREE],
      [findGetter(global.Element.prototype, 'slot'), SIDE_EFFECT_FREE],
      [findGetter(global.Element.prototype, 'tagName'), SIDE_EFFECT_FREE],
      [global.Element.prototype.querySelector, SIDE_EFFECT_FREE],
    )
  }

  return list.filter((item): item is [Function, SideEffectFlags] => item[0] !== undefined)
}
