import type ts from 'typescript'
import { getClassDeclarationNodes, hasComponentDecorator } from './utils'
import { convertASTResultToImport, runPlugins } from './plugins'
import { Vc2cOptions } from './options'
import { log } from './debug'
import { ASTResult, ConvertResult } from './plugins/types'

const vueClassModules = [
  'vue-class-component',
  'vue-property-decorator'
]

export function convertAST (sourceFile: ts.SourceFile, options: Vc2cOptions, program: ts.Program): ConvertResult {
  const tsModule = options.typescript

  log('check vue class library')
  const vueClassModuleImportStatement = sourceFile.statements
    .find((statement) => {
      if (tsModule.isImportDeclaration(statement)) {
        if (vueClassModules.includes((statement.moduleSpecifier as ts.StringLiteral).text)) {
          return true
        }
      }
      return false
    })
  if (!vueClassModuleImportStatement) {
    return {
      success: false,
      convertedContent: "",
      error: "No vue class library in this file"
    }
  }

  log('check default export class')

  const otherStatements = sourceFile.statements
    .map((el) => el)
    .filter((el) =>
      !((tsModule.isClassDeclaration(el) && hasComponentDecorator(tsModule, el)) ||
      (tsModule.isImportDeclaration(el) && vueClassModules.includes((el.moduleSpecifier as ts.StringLiteral).text)) ||
      (tsModule.isImportDeclaration(el) && (el.moduleSpecifier as ts.StringLiteral).text === 'vue'))
    )

  let resultStatements = otherStatements;

  const classNodes = getClassDeclarationNodes(options.typescript, sourceFile)
  if (!classNodes) {
    return {
      success: false,
      convertedContent: "",
      error: "No vue class components found in this file"
    }
  }

  let astResults: ASTResult<ts.Node>[] = [];

  for (let cNode of classNodes) {
    const result = runPlugins(cNode, options, program);
    astResults = astResults.concat(result.astResults);
    resultStatements.push(result.statement);
  }
  
  log('Make ImportDeclaration')
  resultStatements = resultStatements.concat(convertASTResultToImport(astResults, options));

  resultStatements = [
    ...resultStatements.filter((el) => tsModule.isImportDeclaration(el)),
    ...resultStatements.filter((el) => !tsModule.isImportDeclaration(el))
  ]

  log('output result code')
  const printer = tsModule.createPrinter()
  const result = printer.printFile(tsModule.factory.updateSourceFile(sourceFile, resultStatements))

  return {
    success: true,
    convertedContent: result,
    error: ""
  };
}
