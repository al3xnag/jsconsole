import type { Completion } from '@codemirror/autocomplete'

export class CompletionSet {
  #completions: Completion[] = []
  #seen: Set<string> = new Set()

  constructor(completions?: Iterable<Completion>) {
    if (completions) {
      for (const completion of completions) {
        this.add(completion)
      }
    }
  }

  get completions(): Completion[] {
    return this.#completions
  }

  add(completion: Completion): void {
    if (!this.#seen.has(completion.label)) {
      this.#seen.add(completion.label)
      this.#completions.push(completion)
    }
  }
}
