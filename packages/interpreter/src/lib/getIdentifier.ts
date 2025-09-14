import { Scope } from '../types'
import { findIdentifier } from './findIdentifier'

export function getIdentifier(name: string, scope: Scope) {
  return findIdentifier(name, scope).identifier
}
