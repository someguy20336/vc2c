import { ASTTransform, ASTResult, ReferenceKind, ASTResultKind } from './types'
import type ts from 'typescript'
import { addTodoComment } from '../utils'

export const removeThisAndSort: ASTTransform = (astResults, options) => {
  const tsModule = options.typescript
  const getReferences = (reference: ReferenceKind) => astResults
    .filter((el) => el.reference === reference)
    .map((el) => el.attributes)
    .reduce((array, el) => array.concat(el), [])

  const refVariables = getReferences(ReferenceKind.VARIABLE_VALUE)
  const domeRefVariables = getReferences(ReferenceKind.VARIABLE_NON_NULL_VALUE)
  const propVariables = getReferences(ReferenceKind.PROPS)
  const variables = getReferences(ReferenceKind.VARIABLE)

  const convertContextKey = (key: string) => {
    const contextKey = new Map([
      ['$attrs', 'attrs'],
      ['$slots', 'slots'],
      ['$parent', 'parent'],
      ['$root', 'root'],
      ['$listeners', 'listeners'],
      ['$emit', 'emit']
    ])

    return contextKey.get(key)
  }

  const convertCompositionAPIKey = (key: string) => {
    const keyMap = new Map([
      ['$router', 'router'],
      ['$route', 'route'],
      ['$watch', 'watch'],
      ['$store', 'store'],
      // ['$refs', ''],
      ['$nextTick', 'nextTick']
    ])

    return keyMap.get(key)
  }

  const IVIEW = ['$Message', '$Loading', '$Modal']

  let dependents: string[] = []

  const factory = tsModule.factory;
  const transformer: () => ts.TransformerFactory<ts.Node> = () => {
    return (context) => {
      const removeThisVisitor: ts.Visitor = (node) => {
        if (tsModule.isPropertyAccessExpression(node)) {
          if (node.expression.kind === tsModule.SyntaxKind.ThisKeyword) {
            const propertyName = node.name.getText()
            if (refVariables.includes(propertyName)) {
              dependents.push(propertyName)
              return factory.createPropertyAccessExpression(
                factory.createIdentifier(propertyName),
                factory.createIdentifier('value')
              )
            } else if (domeRefVariables.includes(propertyName)) {
              dependents.push(propertyName)
              return factory.createNonNullExpression(
                factory.createPropertyAccessExpression(
                  factory.createIdentifier(propertyName),
                  factory.createIdentifier('value')
                )
              )
            } else if (propVariables.includes(propertyName)) {
              dependents.push(propertyName)
              return factory.createPropertyAccessExpression(
                factory.createIdentifier(options.setupPropsKey),
                factory.createIdentifier(propertyName)
              )
            } else if (variables.includes(propertyName)) {
              dependents.push(propertyName)
              return factory.createIdentifier(propertyName)
            } else {
              const convertKey = convertContextKey(propertyName)
              if (convertKey) {
                return factory.createPropertyAccessExpression(
                  factory.createIdentifier(options.setupContextKey),
                  factory.createIdentifier(convertKey)
                )
              }

              const apiKey = convertCompositionAPIKey(propertyName)
              if (apiKey) {
                return factory.createIdentifier(apiKey)
              }

              if (IVIEW.includes(propertyName)) {
                return factory.createPropertyAccessExpression(
                  factory.createIdentifier('instance?.proxy?'),
                  factory.createIdentifier(propertyName)
                )
              }

              return addTodoComment(
                tsModule,
                factory.createPropertyAccessExpression(
                  factory.createPropertyAccessExpression(
                    factory.createIdentifier(options.setupContextKey),
                    factory.createIdentifier('root')
                  ),
                  factory.createIdentifier(propertyName)
                ),
                'Check this convert result, it can work well in 80% case.',
                true
              )
            }
          }
          return tsModule.visitEachChild(node, removeThisVisitor, context)
        }
        return tsModule.visitEachChild(node, removeThisVisitor, context)
      }

      return (node) => tsModule.visitNode(node, removeThisVisitor)
    }
  }

  const transformResults = astResults.map((astResult) => {
    if (astResult.kind === ASTResultKind.OBJECT) {
      return {
        ...astResult,
        nodeDependents: []
      }
    }
    dependents = []
    const nodes = tsModule.transform(
      astResult.nodes,
      [transformer()],
      { module: tsModule.ModuleKind.ESNext }
    ).transformed

    const nodeDependents = dependents.slice()

    return {
      ...astResult,
      nodes,
      nodeDependents
    }
  })

  const astResultNoDependents = transformResults.filter((el) => el.nodeDependents.length === 0)
  let otherASTResults = transformResults.filter((el) => el.nodeDependents.length !== 0)
  let result: ASTResult<ts.Node>[] = [...astResultNoDependents]
  const resultHaveDependents = astResultNoDependents.map((el) => el.attributes).reduce((array, el) => array.concat(el), [])
  do {
    let hasPush = false
    otherASTResults = otherASTResults.filter((el) => {
      if (el.nodeDependents.every((dependent) => resultHaveDependents.includes(dependent))) {
        result.push(el)
        hasPush = true
        return false
      } else {
        return true
      }
    })
    if (!hasPush) {
      result = result.concat(otherASTResults)
      break
    }
  } while (result.length < astResults.length)

  return result
}
