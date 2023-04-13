import { convertFile } from '../src'
import { FileKind } from '../src/file'
import path from 'path'
import util from 'util'
import { exec } from 'child_process'

const execAsync = util.promisify(exec)

describe('testTSFile', () => {
  const defComponentPath = 'fixture/Input.ts';
  const commonCompPath = 'fixture/CommonUseWithWhitespaceTest.ts';
  const multComponentPath = "fixture/MultipleComponents.ts";
  const multComponentDefaultPath = "fixture/MultipleComponentsWithDefault.ts";
  const componentAndNonCompPath = "fixture/ComponentWithNonComponentClass.ts";

  it('converts a file with a single default component', () => {
    const { file, result } = convertFile(defComponentPath, __dirname, '')
    expect(file.fsPath.includes(path.basename(defComponentPath))).toBeTruthy()
    expect(path.isAbsolute(file.fsPath)).toBeTruthy()
    expect(file.kind).toBe(FileKind.TS)
    expect(file).not.toHaveProperty('start')
    expect(file).not.toHaveProperty('end')
    expect(result.convertedContent).toMatchSnapshot()
  });

  it('converts a file with a single default component with vertical whitespace', () => {
    const { file, result } = convertFile(commonCompPath, __dirname, '')
    expect(file.fsPath.includes(path.basename(commonCompPath))).toBeTruthy()
    expect(path.isAbsolute(file.fsPath)).toBeTruthy()
    expect(file.kind).toBe(FileKind.TS)
    expect(file).not.toHaveProperty('start')
    expect(file).not.toHaveProperty('end')
    expect(result.convertedContent).toMatchSnapshot()
  });

  it('converts a file with multiple components', () => {
    const { file, result } = convertFile(multComponentPath, __dirname, '')
    expect(file.fsPath.includes(path.basename(multComponentPath))).toBeTruthy()
    expect(path.isAbsolute(file.fsPath)).toBeTruthy()
    expect(file.kind).toBe(FileKind.TS)
    expect(file).not.toHaveProperty('start')
    expect(file).not.toHaveProperty('end')
    expect(result.convertedContent).toMatchSnapshot()
  });

  it('converts a file with multiple components and one default', () => {
    const { file, result } = convertFile(multComponentDefaultPath, __dirname, '')
    expect(file.fsPath.includes(path.basename(multComponentDefaultPath))).toBeTruthy()
    expect(path.isAbsolute(file.fsPath)).toBeTruthy()
    expect(file.kind).toBe(FileKind.TS)
    expect(file).not.toHaveProperty('start')
    expect(file).not.toHaveProperty('end')
    expect(result.convertedContent).toMatchSnapshot()
  });

  it('converts a file with a component and non-component class', () => {
    const { file, result } = convertFile(componentAndNonCompPath, __dirname, '')
    expect(file.fsPath.includes(path.basename(componentAndNonCompPath))).toBeTruthy()
    expect(path.isAbsolute(file.fsPath)).toBeTruthy()
    expect(file.kind).toBe(FileKind.TS)
    expect(file).not.toHaveProperty('start')
    expect(file).not.toHaveProperty('end')
    expect(result.convertedContent).toMatchSnapshot()
  });
})
