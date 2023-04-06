import { ASTConverter, ASTResultKind, ReferenceKind } from '../types'
import type ts from 'typescript'
import { isPrimitiveType, copySyntheticComments, removeComments } from '../../utils'

export const convertData: ASTConverter<ts.PropertyDeclaration> = (node, options, program) => {
  if (!node.initializer) {
    return false
  }
  const tsModule = options.typescript;
  const factory = tsModule.factory;
  const dataName = node.name.getText()

  const checker = program.getTypeChecker()
  const isRef = isPrimitiveType(tsModule, checker.getTypeAtLocation(node.initializer))

  const tag = (isRef) ? 'Data-ref' : 'Data-reactive'
  const named = (isRef) ? ['ref'] : ['reactive']
  const callExpr = (isRef)
    ? factory.createCallExpression(
      factory.createIdentifier('ref'),
      undefined,
      [removeComments(tsModule, node.initializer)]
    )
    : factory.createCallExpression(
      factory.createIdentifier('reactive'),
      undefined,
      [removeComments(tsModule, node.initializer)]
    )

  return {
    tag,
    kind: ASTResultKind.COMPOSITION,
    imports: [{
      named,
      external: 'vue'
    }],
    reference: (isRef) ? ReferenceKind.VARIABLE_VALUE : ReferenceKind.VARIABLE,
    attributes: [dataName],
    nodes: [
      copySyntheticComments(
        tsModule,
        factory.createVariableStatement(
          undefined,
          factory.createVariableDeclarationList([
            factory.createVariableDeclaration(
              factory.createIdentifier(dataName),
              undefined,
              undefined,
              callExpr
            )
          ],
          tsModule.NodeFlags.Const)
        ),
        node
      )
    ] as ts.Statement[]
  }
}
