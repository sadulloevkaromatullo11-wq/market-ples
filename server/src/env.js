import fs from 'fs'
import path from 'path'

export function loadEnv() {
  const files = [path.join(process.cwd(), '.env'), path.join(process.cwd(), '..', '.env')]
  for (const file of files) {
    if (!fs.existsSync(file)) continue
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const index = trimmed.indexOf('=')
      if (index < 1) continue
      const key = trimmed.slice(0, index).trim()
      const value = trimmed.slice(index + 1).trim()
      if (!(key in process.env)) process.env[key] = value
    }
  }
}
