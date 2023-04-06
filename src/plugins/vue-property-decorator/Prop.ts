import { ASTConverter, ASTResultKind, ASTTransform, ASTResultToObject, ReferenceKind } from '../types'
import type ts from 'typescript'
import { copySyntheticComments, getDecorator } from '../../utils'

const propDecoratorName = 'Prop'

export const convertProp: ASTConverter<ts.PropertyDeclaration> = (node, options) => {

  const tsModule = options.typescript;
  const factory = tsModule.factory;
  const decorator = getDecorator(tsModule, node, propDecoratorName);
  if (decorator) {
    
    const decoratorArguments = (decorator.expression as ts.CallExpression).arguments
    if (decoratorArguments.length > 0) {
      const propName = node.name.getText()
      const propArguments = decoratorArguments[0]

      return {
        tag: 'Prop',
        kind: ASTResultKind.OBJECT,
        imports: [],
        reference: ReferenceKind.PROPS,
        attributes: [propName],
        nodes: [
          copySyntheticComments(
            tsModule,
            factory.createPropertyAssignment(
              factory.createIdentifier(propName),
              propArguments
            ),
            node
          )
        ]
      }
    }
  }

  return false
}
export const mergeProps: ASTTransform = (astResults, options) => {
  const tsModule = options.typescript
  const factory = tsModule.factory;
  const propTags = ['Prop', 'Model']

  const propASTResults = astResults.filter((el) => propTags.includes(el.tag))
  const otherASTResults = astResults.filter((el) => !propTags.includes(el.tag))
  const modelASTResult = astResults.find((el) => el.tag === 'Model')

  const mergeASTResult: ASTResultToObject = {
    tag: 'Prop',
    kind: ASTResultKind.OBJECT,
    imports: [],
    reference: ReferenceKind.PROPS,
    attributes: propASTResults.map((el) => el.attributes).reduce((array, el) => array.concat(el), []),
    nodes: [
      factory.createPropertyAssignment(
        factory.createIdentifier('props'),
        factory.createObjectLiteralExpression(
          [
            ...propASTResults.map((el) => (el.tag === 'Prop') ? el.nodes : [el.nodes[1]])
              .reduce((array, el) => array.concat(el), [] as ts.ObjectLiteralElementLike[])
          ] as ts.ObjectLiteralElementLike[],
          true
        )
      )
    ]
  }

  return [
    ...(modelASTResult) ? [{
      ...modelASTResult,
      nodes: modelASTResult.nodes.slice(0, 1) as ts.PropertyAssignment[]
    }] : [],
    mergeASTResult,
    ...otherASTResults
  ]
}
