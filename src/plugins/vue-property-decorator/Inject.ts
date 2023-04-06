import { ASTConverter, ASTResultKind, ReferenceKind } from '../types'
import type ts from 'typescript'
import { copySyntheticComments, getDecorator } from '../../utils'

const injectDecoratorName = 'Inject'

export const convertInject: ASTConverter<ts.PropertyDeclaration> = (node, options) => {

  const tsModule = options.typescript;
  const factory = tsModule.factory;
  const decorator = getDecorator(tsModule, node, injectDecoratorName);
  if (decorator) {
    const decoratorArguments = (decorator.expression as ts.CallExpression).arguments
    let injectKeyExpr: ts.Expression = factory.createStringLiteral(node.name.getText())
    let defaultValueExpr: ts.Expression | undefined
    if (decoratorArguments.length > 0) {
      const injectArgument = decoratorArguments[0]
      if (tsModule.isObjectLiteralExpression(injectArgument)) {
        const fromProperty = injectArgument.properties.find((el) => el.name?.getText() === 'from')
        if (fromProperty && tsModule.isPropertyAssignment(fromProperty)) {
          injectKeyExpr = fromProperty.initializer
        }
        const defaultProperty = injectArgument.properties.find((el) => el.name?.getText() === 'default')
        if (defaultProperty && tsModule.isPropertyAssignment(defaultProperty)) {
          defaultValueExpr = defaultProperty.initializer
        }
      } else {
        injectKeyExpr = injectArgument
      }
    }

    return {
      tag: 'Inject',
      kind: ASTResultKind.COMPOSITION,
      imports: [{
        named: ['inject'],
        external: 'vue'
      }],
      reference: ReferenceKind.VARIABLE,
      attributes: [node.name.getText()],
      nodes: [
        copySyntheticComments(
          tsModule,
          factory.createVariableStatement(
            undefined,
            factory.createVariableDeclarationList(
              [factory.createVariableDeclaration(
                factory.createIdentifier(node.name.getText()),
                undefined,
                undefined,
                factory.createCallExpression(
                  factory.createIdentifier('inject'),
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (node.type) ? [factory.createKeywordTypeNode(node.type.kind as any)] : undefined,
                  [
                    injectKeyExpr,
                    ...(defaultValueExpr) ? [defaultValueExpr] : []
                  ]
                )
              )],
              tsModule.NodeFlags.Const
            )
          ),
          node
        )
      ] as ts.Statement[]
    }
  }

  return false
}
