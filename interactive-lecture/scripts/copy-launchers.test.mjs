import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { copyLaunchers } from './copy-launchers.mjs'

test('copies named Windows and Mac launchers, replacing only legacy launcher names', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), '课堂 launchers '))
  t.after(() => rm(root, { recursive: true, force: true }))
  const source = path.join(root, '源目录')
  const destination = path.join(root, '输出 目录')
  await mkdir(source)
  await mkdir(destination)
  const windowsBytes = Buffer.from([0x40, 0x65, 0x63, 0x68, 0x6f, 0x20, 0xb4, 0xf3, 0x0d, 0x0a])
  const windowsServerBytes = Buffer.from('\ufeffWrite-Host "test"\r\n')
  await writeFile(path.join(source, '启动交互课堂-win.bat'), windowsBytes)
  await writeFile(path.join(source, 'serve-win.ps1'), windowsServerBytes)
  await writeFile(path.join(source, '启动交互课堂-mac.command'), '#!/bin/bash\r\necho "课堂"\r\n', { mode: 0o644 })
  await writeFile(path.join(source, 'serve-mac.py'), '#!/usr/bin/env python3\n')
  await writeFile(path.join(destination, 'index.html'), 'existing build')
  for (const oldName of ['启动交互课堂.bat', 'serve.ps1', '启动交互课堂.command', 'serve.py']) {
    await writeFile(path.join(destination, oldName), 'old launcher')
  }

  await copyLaunchers({ source, destination })

  assert.deepEqual(await readFile(path.join(destination, '启动交互课堂-win.bat')), windowsBytes)
  assert.deepEqual(await readFile(path.join(destination, 'serve-win.ps1')), windowsServerBytes)
  assert.equal(await readFile(path.join(destination, '启动交互课堂-mac.command'), 'utf8'), '#!/bin/bash\necho "课堂"\n')
  assert.deepEqual(await readFile(path.join(destination, 'serve-mac.py')), await readFile(path.join(source, 'serve-mac.py')))
  assert.equal(await readFile(path.join(destination, 'index.html'), 'utf8'), 'existing build')
  assert.deepEqual((await readdir(destination)).sort(), [
    'index.html', '启动交互课堂-win.bat', 'serve-win.ps1', '启动交互课堂-mac.command', 'serve-mac.py',
  ].sort())
  if (process.platform !== 'win32') {
    assert.equal((await stat(path.join(destination, '启动交互课堂-mac.command'))).mode & 0o777, 0o755)
  }
})

test('CLI finds the real launcher assets from another working directory', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), '课堂 CLI '))
  t.after(() => rm(root, { recursive: true, force: true }))
  const destination = path.join(root, '带 空格的发布目录')
  const script = fileURLToPath(new URL('./copy-launchers.mjs', import.meta.url))
  execFileSync(process.execPath, [script, destination], { cwd: root })
  for (const name of ['启动交互课堂-win.bat', 'serve-win.ps1', 'serve-mac.py']) {
    assert.deepEqual(
      await readFile(path.join(destination, name)),
      await readFile(new URL(`../../lecture_factory/assets/launcher/${name}`, import.meta.url)),
    )
  }
  const macLauncher = await readFile(path.join(destination, '启动交互课堂-mac.command'), 'utf8')
  assert.ok(macLauncher.startsWith('#!/bin/bash\n'))
  assert.match(macLauncher, /serve-mac\.py/)
  assert.match((await readFile(path.join(destination, '启动交互课堂-win.bat'))).toString('latin1'), /serve-win\.ps1/)
})
