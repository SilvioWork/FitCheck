import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const root = dirname(fileURLToPath(import.meta.url))
const master = join(root, 'icon-master.png')
const dir = join(root, '../public')
const padColor = '0x070A08'

function ffmpeg(vf, out) {
  execFileSync(
    'ffmpeg',
    ['-y', '-i', master, '-vf', vf, '-frames:v', '1', '-update', '1', out],
    { stdio: 'pipe' },
  )
}

function icoFromPng(pngBuf, size) {
  const header = Buffer.alloc(22)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(1, 4)
  header[6] = size
  header[7] = size
  header.writeUInt16LE(1, 10)
  header.writeUInt16LE(32, 12)
  header.writeUInt32LE(pngBuf.length, 14)
  header.writeUInt32LE(22, 18)
  return Buffer.concat([header, pngBuf])
}

ffmpeg('scale=180:180:flags=lanczos', join(dir, 'apple-touch-icon.png'))
ffmpeg('scale=192:192:flags=lanczos', join(dir, 'pwa-192.png'))
ffmpeg('scale=512:512:flags=lanczos', join(dir, 'pwa-512.png'))
ffmpeg(
  `scale=369:369:flags=lanczos,pad=512:512:(ow-iw)/2:(oh-ih)/2:${padColor}`,
  join(dir, 'pwa-512-maskable.png'),
)
const tmp = mkdtempSync(join(tmpdir(), 'fitcheck-icons-'))
const fav32 = join(tmp, 'favicon-32.png')
ffmpeg('scale=32:32:flags=lanczos', fav32)
writeFileSync(join(dir, 'favicon.ico'), icoFromPng(readFileSync(fav32), 32))
rmSync(tmp, { recursive: true })

const apple = readFileSync(join(dir, 'apple-touch-icon.png'))
console.log('ok', createHash('sha1').update(apple).digest('hex').slice(0, 8))
