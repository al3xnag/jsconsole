import { Node } from 'acorn'

export function* iterateAncestors(node: Node) {
  while (node.parent) {
    yield node.parent
    node = node.parent
  }
}
