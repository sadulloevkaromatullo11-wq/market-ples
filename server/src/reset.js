import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'db.json')
fs.rmSync(file, { force: true })
console.log('База тоза шуд. Серверро аз нав оғоз кунед, то маълумоти намунавӣ бор шавад.')
