import { convertFile } from '../src'
import { FileKind } from '../src/file'
import path from 'path'
import util from 'util'
import { exec } from 'child_process'

const execAsync = util.promisify(exec)

describe('testTSFile', () => {
  const defComponentPath = 'fixture/Input.ts';
  const multComponentPath = "fixture/MultipleComponents.ts";

  it('converts a file with a single default component', () => {
    const { file, result } = convertFile(defComponentPath, __dirname, '')
    expect(file.fsPath.includes(path.basename(defComponentPath))).toBeTruthy()
    expect(path.isAbsolute(file.fsPath)).toBeTruthy()
    expect(file.kind).toBe(FileKind.TS)
    expect(file).not.toHaveProperty('start')
    expect(file).not.toHaveProperty('end')
    expect(result).toMatchSnapshot()
  });

  it('converts a file with multiple components', () => {
    const { file, result } = convertFile(multComponentPath, __dirname, '')
    expect(file.fsPath.includes(path.basename(multComponentPath))).toBeTruthy()
    expect(path.isAbsolute(file.fsPath)).toBeTruthy()
    expect(file.kind).toBe(FileKind.TS)
    expect(file).not.toHaveProperty('start')
    expect(file).not.toHaveProperty('end')
    expect(result).toMatchSnapshot()
  });
})
