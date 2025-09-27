let id = 0

export function nextId(): number {
  return id++
}

export function resetNextId(start: number): void {
  id = start
}
