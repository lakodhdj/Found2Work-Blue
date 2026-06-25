import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const server = spawn(process.execPath, ['server.js'], {
  cwd: root,
  stdio: 'inherit',
  shell: false,
})

const vite = spawn(process.execPath, [path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')], {
  cwd: root,
  stdio: 'inherit',
  shell: false,
})

let shuttingDown = false
function stopBoth(signal) {
  if (shuttingDown) return
  shuttingDown = true
  server.kill(signal)
  vite.kill(signal)
}

process.on('SIGINT', () => stopBoth('SIGINT'))
process.on('SIGTERM', () => stopBoth('SIGTERM'))

let exited = false
function onChildExit(code) {
  if (exited) return
  exited = true
  stopBoth('SIGTERM')
  process.exit(code ?? 0)
}

server.on('exit', (code) => onChildExit(code))
vite.on('exit', (code) => onChildExit(code))
