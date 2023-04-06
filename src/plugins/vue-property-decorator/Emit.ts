import { ASTConverter, ASTResultKind, ReferenceKind } from '../types'
import type ts from 'typescript'
import { copySyntheticComments, getDecorator } from '../../utils'

const emitDecoratorName = 'Emit'

// Code copied from Vue/src/shared/util.js
const hyphenateRE = /\B([A-Z])/g
const hyphenate = (str: string) => str.replace(hyphenateRE, '-$1').toLowerCase()

export const convertEmitMethod: ASTConverter<ts.MethodDeclaration> = (node, options) => {

  const tsModule = options.typescript;
  const factory = tsModule.factory;
  const decorator = getDecorator(tsModule, node, emitDecoratorName);
  if (decorator) {
    const methodName = node.name.getText()

    const decoratorArguments = (decorator.expression as ts.CallExpression).arguments
    const eventName = decoratorArguments.length > 0 && tsModule.isStringLiteral(decoratorArguments[0]) ? (decoratorArguments[0] as ts.StringLiteral).text : undefined

    const createEmit = (event: string, expressions: ts.Expression[]) => factory.createExpressionStatement(factory.createCallExpression(
      factory.createPropertyAccessExpression(
        factory.createIdentifier('context'),
        factory.createIdentifier('emit')
      ),
      undefined,
      [
        factory.createStringLiteral(hyphenate(methodName)),
        ...expressions
      ]
    ))

    const valueIdentifier = (node.parameters.length > 0) ? factory.createIdentifier(node.parameters[0].name.getText()) : undefined

    let haveResult = false
    const transformer: () => ts.TransformerFactory<ts.Statement> = () => {
      return (context) => {
        const deepVisitor: ts.Visitor = (node) => {
          if (tsModule.isReturnStatement(node)) {
            haveResult = true
            return createEmit(eventName || hyphenate(methodName), (node.expression ? [node.expression] : []).concat((valueIdentifier) ? [valueIdentifier] : []))
          }
          return tsModule.visitEachChild(node, deepVisitor, context)
        }

        return (node) => tsModule.visitNode(node, deepVisitor)
      }
    }

    const originalBodyStatements = (node.body) ? node.body.statements : factory.createNodeArray([])
    let bodyStatements = tsModule.transform(
      originalBodyStatements.map((el) => el),
      [transformer()],
      { module: tsModule.ModuleKind.ESNext }
    ).transformed
    if (!haveResult) {
      bodyStatements = [
        ...originalBodyStatements,
        createEmit(eventName || hyphenate(methodName), (valueIdentifier) ? [valueIdentifier] : [])
      ]
    }

    const outputMethod = factory.createArrowFunction(
      tsModule.getModifiers(node),
      node.typeParameters,
      node.parameters,
      node.type,
      factory.createToken(tsModule.SyntaxKind.EqualsGreaterThanToken),
      factory.createBlock(
        bodyStatements,
        true
      )
    )

    return {
      tag: 'Emit',
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

  return false
}
