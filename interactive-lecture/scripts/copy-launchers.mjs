import { chmod, cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const sourceDirectory = fileURLToPath(new URL('../../lecture_factory/assets/launcher/', import.meta.url))
const distDirectory = fileURLToPath(new URL('../dist/', import.meta.url))
const legacyLaunchers = ['启动交互课堂.bat', 'serve.ps1', '启动交互课堂.command', 'serve.py']

/** Resolve paths from this script so spaces, Chinese names and the caller's cwd are safe. */
export async function copyLaunchers({ source = sourceDirectory, destination = distDirectory } = {}) {
  await mkdir(destination, { recursive: true })
  await cp(source, destination, { recursive: true })
  await Promise.all(legacyLaunchers.map((name) => rm(path.join(destination, name), { force: true })))
  for (const entry of await readdir(destination, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.command')) continue
    const filename = path.join(destination, entry.name)
    const contents = await readFile(filename, 'utf8')
    await writeFile(filename, contents.replace(/\r\n?/g, '\n'))
    if (process.platform !== 'win32') await chmod(filename, 0o755)
  }
  return destination
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const destination = await copyLaunchers({ destination: process.argv[2] })
  console.log(`Local launchers copied to ${destination}`)
}
