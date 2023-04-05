import { ASTConverter, ASTResultKind, ReferenceKind } from '../types'
import type ts from 'typescript'
import { copySyntheticComments, getDecorator } from '../../utils'

const provideDecoratorName = 'Provide'

export const convertProvide: ASTConverter<ts.PropertyDeclaration> = (node, options) => {

  const tsModule = options.typescript;
  const decorator = getDecorator(tsModule, node, provideDecoratorName);
  if (decorator) {
    const decoratorArguments = (decorator.expression as ts.CallExpression).arguments
    const provideKeyExpr: ts.Expression = (decoratorArguments.length > 0) ? decoratorArguments[0] : tsModule.createStringLiteral(node.name.getText())

    return {
      tag: 'Provide',
      kind: ASTResultKind.COMPOSITION,
      imports: [{
        named: ['provide'],
        external: 'vue'
      }],
      reference: ReferenceKind.NONE,
      attributes: [],
      nodes: [
        copySyntheticComments(
          tsModule,
          tsModule.createExpressionStatement(tsModule.createCall(
            tsModule.createIdentifier('provide'),
            undefined,
            [
              provideKeyExpr,
              ...(node.initializer) ? [node.initializer] : []
            ]
          )),
          node
        )
      ] as ts.Statement[]
    }
  }

  return false
}
