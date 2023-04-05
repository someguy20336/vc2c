import { ASTConverter, ASTResultKind, ReferenceKind } from '../types'
import type ts from 'typescript'
import { copySyntheticComments, getDecorator } from '../../utils'

const refDecoratorName = 'Ref'

export const convertDomRef: ASTConverter<ts.PropertyDeclaration> = (node, options) => {

  const tsModule = options.typescript;
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
          tsModule.createVariableStatement(
            undefined,
            tsModule.createVariableDeclarationList([
              tsModule.createVariableDeclaration(
                tsModule.createIdentifier(refName),
                undefined,
                tsModule.createCall(
                  tsModule.createIdentifier('ref'),
                  node.type ? [node.type] : [],
                  [tsModule.createNull()]
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
