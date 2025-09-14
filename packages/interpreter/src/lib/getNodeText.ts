import { Node } from 'acorn'

export function getNodeText(node: Node, code: string): string {
  return code.substring(node.start, node.end)
}
