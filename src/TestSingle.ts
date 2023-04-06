import { convertFile } from ".";

const filePath = '../../tests/fixture/Input.ts'
const { file, result } = convertFile(filePath, __dirname, 'config/.compatible.vc2c.js');

console.log(result);