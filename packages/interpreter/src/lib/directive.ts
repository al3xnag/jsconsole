import { ModuleDeclaration, Statement } from 'acorn'

export function hasDirective(body: (Statement | ModuleDeclaration)[], directive: string) {
  for (const child of body) {
    if (child.type !== 'ExpressionStatement' || child.directive === undefined) {
      return false
    }

    if (child.directive === directive) {
      return true
    }
  }

  return false
}
