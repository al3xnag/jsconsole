const WELL_KNOWN_SYMBOLS = [
  Symbol.toStringTag,
  Symbol.toPrimitive,
  Symbol.iterator,
  Symbol.hasInstance,
  Symbol.isConcatSpreadable,
  Symbol.matchAll,
  Symbol.match,
  Symbol.replace,
  Symbol.search,
  Symbol.species,
  Symbol.split,
  Symbol.unscopables,
  Symbol.asyncIterator,
]

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol#well-known_symbols
export function isWellKnownSymbol(key: symbol) {
  return WELL_KNOWN_SYMBOLS.includes(key)
}

export function getWellKnownSymbolByDescription(description: string): symbol | undefined {
  return WELL_KNOWN_SYMBOLS.find((symbol) => symbol.description === description)
}
