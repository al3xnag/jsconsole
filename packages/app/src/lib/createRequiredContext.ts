import React from 'react'

const NO_CONTEXT_VALUE = Symbol()

/**
 * `React.createContext` with no default value.
 * It throws an error when `useContext` is not called within a Provider with a value.
 */
export default function createRequiredContext<T>(): {
  useContext: () => T
  Provider: React.Provider<T>
} {
  const context = React.createContext<T | typeof NO_CONTEXT_VALUE>(NO_CONTEXT_VALUE)

  function useContext(): T {
    const c = React.useContext(context)
    if (c === NO_CONTEXT_VALUE) throw new Error('useContext must be within a Provider with a value')
    return c
  }

  return { useContext, Provider: context.Provider }
}
