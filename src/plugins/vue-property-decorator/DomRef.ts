import { ASTConverter, ASTResultKind, ReferenceKind } from '../types'
import type ts from 'typescript'
import { copySyntheticComments, getDecorator } from '../../utils'

const refDecoratorName = 'Ref'

export const convertDomRef: ASTConverter<ts.PropertyDeclaration> = (node, options) => {

  const tsModule = options.typescript;
  const factory = tsModule.factory;
  const decorator = getDecorator(tsModule, node, refDecoratorName);
  if (decorator) {
    const refName = node.name.getText()

    return {
      tag: 'DomRef',
      kind: ASTResultKind.COMPOSITION,
      imports: [{
        named: ['ref'],
        external: 'vue'
      }],
      reference: ReferenceKind.VARIABLE_NON_NULL_VALUE,
      attributes: [refName],
      nodes: [
        copySyntheticComments(
          tsModule,
          factory.createVariableStatement(
            undefined,
            factory.createVariableDeclarationList([
              factory.createVariableDeclaration(
                factory.createIdentifier(refName),
                undefined,
                undefined,
                factory.createCallExpression(
                  factory.createIdentifier('ref'),
                  node.type ? [node.type] : [],
                  [factory.createNull()]
                )
              )
            ],
            tsModule.NodeFlags.Const)
          ),
          node
        )
      ]
    }
  }

  return false
}
