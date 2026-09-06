import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const dir = join(dirname(fileURLToPath(import.meta.url)), '../public')

const GREEN = [31, 138, 76]
const CREAM = [243, 246, 242]

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

function png(size, rgba) {
  const rows = []
  for (let y = 0; y < size; y++) {
    rows.push(Buffer.from([0]))
    rows.push(rgba.subarray(y * size * 4, (y + 1) * size * 4))
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

function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

function coverage(sdf) {
  return clamp01(0.5 - sdf)
}

function sdfRoundRect(px, py, cx, cy, hw, hh, r) {
  const dx = Math.abs(px - cx) - (hw - r)
  const dy = Math.abs(py - cy) - (hh - r)
  const ox = Math.max(dx, 0)
  const oy = Math.max(dy, 0)
  return Math.hypot(ox, oy) + Math.min(Math.max(dx, dy), 0) - r
}

function sdfSegment(px, py, ax, ay, bx, by, radius) {
  const vx = bx - ax
  const vy = by - ay
  const len2 = vx * vx + vy * vy
  const t = len2 === 0 ? 0 : clamp01(((px - ax) * vx + (py - ay) * vy) / len2)
  return Math.hypot(px - (ax + t * vx), py - (ay + t * vy)) - radius
}

function mapContent(nx, ny, scale) {
  return [0.5 + (nx - 0.5) * scale, 0.5 + (ny - 0.5) * scale]
}

function iconSdf(nx, ny, scale) {
  const [x, y] = mapContent(nx, ny, scale)
  const dumbbell = Math.min(
    sdfRoundRect(x, y, 0.22, 0.5, 0.105, 0.25, 0.045),
    sdfRoundRect(x, y, 0.315, 0.5, 0.042, 0.15, 0.022),
    sdfRoundRect(x, y, 0.5, 0.5, 0.205, 0.078, 0.04),
    sdfRoundRect(x, y, 0.685, 0.5, 0.042, 0.15, 0.022),
    sdfRoundRect(x, y, 0.78, 0.5, 0.105, 0.25, 0.045),
  )
  const check = Math.min(
    sdfSegment(x, y, 0.705, 0.515, 0.76, 0.575, 0.028),
    sdfSegment(x, y, 0.76, 0.575, 0.86, 0.4, 0.028),
  )
  return { dumbbell, check }
}

function drawIcon(size, { scale = 1 } = {}) {
  const raw = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x + 0.5) / size
      const ny = (y + 0.5) / size
      const { dumbbell, check } = iconSdf(nx, ny, scale)
      const cream = Math.max(0, coverage(dumbbell * size) - coverage(check * size))
      const i = (y * size + x) * 4
      raw[i] = Math.round(GREEN[0] + (CREAM[0] - GREEN[0]) * cream)
      raw[i + 1] = Math.round(GREEN[1] + (CREAM[1] - GREEN[1]) * cream)
      raw[i + 2] = Math.round(GREEN[2] + (CREAM[2] - GREEN[2]) * cream)
      raw[i + 3] = 255
    }
  }
  return png(size, raw)
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

const apple = drawIcon(180)
const pwa192 = drawIcon(192)
const pwa512 = drawIcon(512)
const maskable = drawIcon(512, { scale: 0.72 })
const favicon32 = drawIcon(32)

writeFileSync(join(dir, 'apple-touch-icon.png'), apple)
writeFileSync(join(dir, 'pwa-192.png'), pwa192)
writeFileSync(join(dir, 'pwa-512.png'), pwa512)
writeFileSync(join(dir, 'pwa-512-maskable.png'), maskable)
writeFileSync(join(dir, 'favicon.ico'), icoFromPng(favicon32, 32))

console.log('ok', createHash('sha1').update(apple).digest('hex').slice(0, 8))
