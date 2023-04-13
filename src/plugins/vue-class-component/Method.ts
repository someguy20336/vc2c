import { ASTConverter, ASTResultKind, ReferenceKind } from '../types'
import type ts from 'typescript'
import { copySyntheticComments } from '../../utils'

export const convertMethod: ASTConverter<ts.MethodDeclaration> = (node, options) => {
  const tsModule = options.typescript;
  const factory = tsModule.factory;
  const methodName = node.name.getText()

  const outputMethod = factory.createArrowFunction(
    tsModule.getModifiers(node),
    node.typeParameters,
    node.parameters,
    node.type,
    factory.createToken(tsModule.SyntaxKind.EqualsGreaterThanToken),
    node.body ?? factory.createBlock([])
  )

  return {
    tag: 'Method',
    kind: ASTResultKind.COMPOSITION,
    imports: [],
    reference: ReferenceKind.VARIABLE,
    attributes: [methodName],
    nodes: [
      copySyntheticComments(
        tsModule,
        factory.createVariableStatement(
          undefined,
          factory.createVariableDeclarationList([
            factory.createVariableDeclaration(
              factory.createIdentifier(methodName),
              undefined,
              undefined,
              outputMethod
            )
          ],
          tsModule.NodeFlags.Const)
        ),
        node
      )
    ] as ts.Statement[]
  }
}
