import { Identifier, Pattern, VariableDeclarator, Function } from 'acorn'
import { assertNever } from './assert'

export function getVariableDeclaratorIdentifiers(declarator: VariableDeclarator): Identifier[] {
  const identifiers: Identifier[] = []
  visitLeftHandPatternIdentifiers(declarator.id, (identifier) => {
    identifiers.push(identifier)
  })
  return identifiers
}

export function getFunctionParamIdentifiers(node: Function): Identifier[] {
  const identifiers: Identifier[] = []
  node.params.forEach((param) => {
    visitLeftHandPatternIdentifiers(param, (identifier) => {
      identifiers.push(identifier)
    })
  })
  return identifiers
}

export function getLeftHandPatternIdentifiers(node: Pattern): Identifier[] {
  const identifiers: Identifier[] = []
  visitLeftHandPatternIdentifiers(node, (identifier) => {
    identifiers.push(identifier)
  })
  return identifiers
}

function visitLeftHandPatternIdentifiers(id: Pattern, callback: (identifier: Identifier) => void) {
  switch (id.type) {
    case 'Identifier': {
      callback(id)
      break
    }

    case 'ArrayPattern': {
      id.elements.forEach((element) => {
        if (element !== null) {
          visitLeftHandPatternIdentifiers(element, callback)
        }
      })
      break
    }

    case 'AssignmentPattern': {
      visitLeftHandPatternIdentifiers(id.left, callback)
      break
    }

    case 'ObjectPattern': {
      id.properties.forEach((property) => {
        switch (property.type) {
          case 'Property': {
            visitLeftHandPatternIdentifiers(property.value, callback)
            break
          }

          case 'RestElement': {
            visitLeftHandPatternIdentifiers(property.argument, callback)
            break
          }
        }
      })
      break
    }

    case 'RestElement': {
      visitLeftHandPatternIdentifiers(id.argument, callback)
      break
    }

    case 'MemberExpression':
      break

    default: {
      assertNever(id, 'Unexpected pattern type')
    }
  }
}
