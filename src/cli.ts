import glob from 'glob'
import program from 'commander'
import { convertFile } from './index.js'
import { writeFileInfo } from './file'

function camelize (str: string) {
  return str.replace(/-(\w)/g, (_, c: string) => c ? c.toUpperCase() : '')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCmdOptions (cmd: { options: Array<{ long: string }> }) {
  const args: { [key: string]: boolean | string } = {}
  cmd.options.forEach((o: { long: string }) => {
    const key = camelize(o.long.replace(/^--/, ''))

    if (typeof (cmd as unknown as Record<string, string>)[key] !== 'function' && typeof (cmd as unknown as Record<string, string>)[key] !== 'undefined') {
      args[key] = (cmd as unknown as Record<string, string>)[key]
    }
  })
  return args
}

program
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  .version((require('../../package.json') as { version: string }).version)
  .usage('<command> [options]')

program
  .command('convert <filePath>')
  .description('convert vue component file from class to composition api')
  .option('-v, --view', 'Output file content on stdout, and no write file.')
  .option('-r, --root <root>', 'Set root path for calc file absolute path. Default:`process.cwd()`')
  .option('-c, --config <config>', 'Set vc2c config file path. Default: `\'.vc2c.js\'`')
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  .action(async (filePath: string, cmd) => {
    const cmdOptions = getCmdOptions(cmd)
    const targetFiles = glob.sync(filePath)

    targetFiles.forEach((targetFile) => {
      const { file, result } = convertFile(targetFile, cmdOptions.root as string, cmdOptions.config as string)

      if (!result.success) {
        console.log("Skipping file: " + targetFile);
        console.log(result.error);
        return;
      }

      if (cmdOptions.view) {
        console.log(result.convertedContent)
        return
      }

      writeFileInfo(file, result.convertedContent)
      console.log('Please check the TODO comments on result.')
    })
  })

program.parse(process.argv)
