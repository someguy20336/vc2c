import { ASTConverter, ASTResultKind, ReferenceKind } from '../../types'
import type ts from 'typescript'

export const convertObjData: ASTConverter<ts.MethodDeclaration> = (node, options) => {
  if (node.name.getText() === 'data') {
    const tsModule = options.typescript
    const factory = tsModule.factory;
    const returnStatement = node.body?.statements.find((el) => tsModule.isReturnStatement(el)) as ts.ReturnStatement | undefined
    if (!returnStatement || !returnStatement.expression) return false
    const attrutibes = (returnStatement.expression as ts.ObjectLiteralExpression).properties.map((el) => el.name?.getText() ?? '')
    const arrowFn = factory.createArrowFunction(
      tsModule.getModifiers(node),
      [],
      [],
      undefined,
      factory.createToken(tsModule.SyntaxKind.EqualsGreaterThanToken),
      factory.createBlock(
        node.body?.statements.map((el) => {
          if (tsModule.isReturnStatement(el)) {
            return factory.createReturnStatement(
              factory.createCallExpression(
                factory.createIdentifier('toRefs'),
                undefined,
                [factory.createCallExpression(
                  factory.createIdentifier('reactive'),
                  undefined,
                  returnStatement.expression ? [returnStatement.expression] : []
                )]
              )
            )
          }
          return el
        }) ?? [],
        true
      )
    )

    return {
      tag: 'Data-ref',
      kind: ASTResultKind.COMPOSITION,
      imports: [{
        named: ['reactive', 'toRefs'],
        external: 'vue'
      }],
      reference: ReferenceKind.VARIABLE_VALUE,
      attributes: attrutibes,
      nodes: [
        factory.createVariableStatement(
          undefined,
          factory.createVariableDeclarationList(
            [factory.createVariableDeclaration(
              factory.createObjectBindingPattern(
                attrutibes.map((el) => factory.createBindingElement(
                  undefined,
                  undefined,
                  factory.createIdentifier(el),
                  undefined
                ))
              ),
              undefined,
              undefined,
              factory.createCallExpression(
                factory.createParenthesizedExpression(arrowFn),
                undefined,
                []
              )
            )]
            ,
            tsModule.NodeFlags.Const
          )
        )
      ] as ts.Statement[]
    }
  }

  return false
}
