import { Property } from './getAllProperties'

export class AutocompleteCache {
  evaluate = new Map<string, unknown>()
  getAllProperties = new Map<unknown, Property[]>()

  clear() {
    this.evaluate.clear()
    this.getAllProperties.clear()
  }
}
