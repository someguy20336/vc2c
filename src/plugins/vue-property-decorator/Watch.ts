import { ASTConverter, ASTResultKind, ReferenceKind } from '../types'
import type ts from 'typescript'
import { copySyntheticComments, createIdentifier, getDecorator } from '../../utils'

const watchDecoratorName = 'Watch'

export const convertWatch: ASTConverter<ts.MethodDeclaration> = (node, options) => {

  const tsModule = options.typescript;
  const factory = tsModule.factory;
  const decorator = getDecorator(tsModule, node, watchDecoratorName);
  if (decorator) {
    const decoratorArguments = (decorator.expression as ts.CallExpression).arguments
    if (decoratorArguments.length) {
      const keyName = (decoratorArguments[0] as ts.StringLiteral).text
      const watchArguments = decoratorArguments[1]
      const method = factory.createArrowFunction(
        tsModule.getModifiers(node),
        node.typeParameters,
        node.parameters,
        node.type,
        factory.createToken(tsModule.SyntaxKind.EqualsGreaterThanToken),
        node.body ?? factory.createBlock([], false)
      )
      const watchOptions: ts.PropertyAssignment[] = []
      if (watchArguments && tsModule.isObjectLiteralExpression(watchArguments)) {
        watchArguments.properties.forEach((el) => {
          if (!tsModule.isPropertyAssignment(el)) return
          watchOptions.push(el)
        })
      }

      const watchFuncs: ts.Expression[] = [
        factory.createPropertyAccessExpression(
          factory.createThis(),
          createIdentifier(tsModule, keyName)
        ),
        method,
      ]

      if (watchOptions.length) {
        watchFuncs.push(factory.createObjectLiteralExpression(watchOptions))
      }

      return {
        tag: 'Watch',
        kind: ASTResultKind.COMPOSITION,
        imports: [{
          named: ['watch'],
          external: 'vue'
        }],
        reference: ReferenceKind.VARIABLE,
        attributes: [keyName],
        nodes: [
          factory.createExpressionStatement(
            copySyntheticComments(
              tsModule,
              factory.createCallExpression(
                factory.createIdentifier('watch'),
                undefined,
                watchFuncs
              ),
              node
            )
          )
        ] as ts.Statement[]
      }
    }
  }

  return false
}
