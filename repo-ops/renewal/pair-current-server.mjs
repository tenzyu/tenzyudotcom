import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

if (!process.stdout.isTTY) throw new Error('Run this command in a private terminal, not a log or pipe')

const pid = execFileSync('systemctl', [
  '--user', 'show', 'opencode-neko7-persistent.service', '-p', 'MainPID', '--value',
], { encoding: 'utf8' }).trim()

if (!/^[1-9][0-9]*$/.test(pid)) throw new Error('OpenCode service is not running')

const environment = readFileSync(`/proc/${pid}/environ`).toString().split('\0')
const password = environment.find((entry) => entry.startsWith('OPENCODE_PASSWORD='))?.slice('OPENCODE_PASSWORD='.length)
if (!password) throw new Error('OpenCode service password is unavailable')

const response = await fetch('http://127.0.0.1:4096/api/pair', {
  method: 'POST',
  headers: { Authorization: `Basic ${Buffer.from(`opencode:${password}`).toString('base64')}` },
})
if (!response.ok) throw new Error(`Pairing request failed with HTTP ${response.status}`)
const result = await response.json()
if (typeof result.code !== 'string' || !/^[A-Za-z0-9_-]+$/.test(result.code)) {
  throw new Error('Unexpected pairing response')
}
process.stdout.write(`https://neko7.tail79927f.ts.net/auth/connect/${result.code}\n`)
