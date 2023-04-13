import { ASTConverter, ASTResultKind, ReferenceKind } from '../types'
import type ts from 'typescript'
import { copySyntheticComments, getDecorator } from '../../utils'

const modelDecoratorName = 'Model'

export const convertModel: ASTConverter<ts.PropertyDeclaration> = (node, options) => {

  const tsModule = options.typescript;
  const factory = tsModule.factory;
  const decorator = getDecorator(tsModule, node, modelDecoratorName);
  if (decorator) {
    const decoratorArguments = (decorator.expression as ts.CallExpression).arguments
    if (decoratorArguments.length > 1) {
      const eventName = (decoratorArguments[0] as ts.StringLiteral).text
      const propArguments = decoratorArguments[1]

      return {
        tag: 'Model',
        kind: ASTResultKind.OBJECT,
        imports: [],
        reference: ReferenceKind.NONE,
        attributes: [node.name.getText()],
        nodes: [
          copySyntheticComments(
            tsModule,
            factory.createPropertyAssignment(
              factory.createIdentifier('model'),
              factory.createObjectLiteralExpression(
                [factory.createPropertyAssignment(
                  factory.createIdentifier('prop'),
                  factory.createStringLiteral(node.name.getText())
                ), factory.createPropertyAssignment(
                  factory.createIdentifier('event'),
                  factory.createStringLiteral(eventName)
                )],
                true
              )
            ),
            node
          ),
          factory.createPropertyAssignment(
            factory.createIdentifier(node.name.getText()),
            propArguments
          )
        ] as ts.PropertyAssignment[]
      }
    }
  }

  return false
}
