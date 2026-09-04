import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const dir = join(dirname(fileURLToPath(import.meta.url)), '../public')

function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) {
    c ^= b
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const t = Buffer.from(type)
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([t, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function png(size, paint) {
  const raw = Buffer.alloc(size * size * 4, 0)
  paint((x, y, r, g, b, a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const i = (y * size + x) * 4
    raw[i] = r
    raw[i + 1] = g
    raw[i + 2] = b
    raw[i + 3] = a
  })
  const rows = []
  for (let y = 0; y < size; y++) {
    rows.push(Buffer.from([0]))
    rows.push(raw.subarray(y * size * 4, (y + 1) * size * 4))
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.concat(rows))),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function drawIcon(size) {
  return png(size, (set) => {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) set(x, y, 31, 138, 76)
    }
    const pts = [
      [0.28, 0.54],
      [0.42, 0.68],
      [0.72, 0.34],
    ].map(([x, y]) => [x * size, y * size])
    const w = Math.max(2, size * 0.045)
    const stroke = (x0, y0, x1, y1) => {
      const steps = Math.hypot(x1 - x0, y1 - y0) * 2
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        const cx = x0 + (x1 - x0) * t
        const cy = y0 + (y1 - y0) * t
        const r = Math.ceil(w)
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            if (dx * dx + dy * dy <= w * w) set(Math.round(cx + dx), Math.round(cy + dy), 243, 246, 242)
          }
        }
      }
    }
    stroke(pts[0][0], pts[0][1], pts[1][0], pts[1][1])
    stroke(pts[1][0], pts[1][1], pts[2][0], pts[2][1])
  })
}

writeFileSync(join(dir, 'apple-touch-icon.png'), drawIcon(180))
writeFileSync(join(dir, 'pwa-192.png'), drawIcon(192))
writeFileSync(join(dir, 'pwa-512.png'), drawIcon(512))
console.log('ok', createHash('sha1').update(drawIcon(180)).digest('hex').slice(0, 8))
