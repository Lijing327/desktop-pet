import * as zlib from 'zlib'
import { nativeImage } from 'electron'
import type { NativeImage } from 'electron'

// ── CRC32（PNG chunk 校验需要）──────────────────────────────────────────────
let _crcTable: Uint32Array | null = null
function getCrcTable(): Uint32Array {
  if (_crcTable) return _crcTable
  _crcTable = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    _crcTable[i] = c
  }
  return _crcTable
}

function crc32(buf: Buffer): number {
  const table = getCrcTable()
  let crc = 0xffffffff
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

// ── PNG 块构造 ──────────────────────────────────────────────────────────────
function pngChunk(type: string, data: Buffer): Buffer {
  const t = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])), 0)
  return Buffer.concat([len, t, data, crcBuf])
}

// ── 构造纯色 PNG ────────────────────────────────────────────────────────────
function buildSolidPng(w: number, h: number, r: number, g: number, b: number): Buffer {
  // PNG 文件签名
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // IHDR：图像头部（13 字节）
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8  // bit depth = 8
  ihdr[9] = 2  // color type = RGB（无 alpha）

  // 原始像素数据：每行 = 1(filter) + w×3(RGB)
  const rowLen = 1 + w * 3
  const raw = Buffer.alloc(h * rowLen)
  for (let y = 0; y < h; y++) {
    const rowOff = y * rowLen
    raw[rowOff] = 0  // filter: None
    for (let x = 0; x < w; x++) {
      const px = rowOff + 1 + x * 3
      raw[px]     = r
      raw[px + 1] = g
      raw[px + 2] = b
    }
  }

  const idat = zlib.deflateSync(raw, { level: 6 })

  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

/**
 * 构建纯色方块 NativeImage
 * @param size  像素尺寸（宽=高）
 * @param hex   十六进制颜色，如 '#FFB7D5'
 */
export function buildColorIcon(size: number, hex: string): NativeImage {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return nativeImage.createFromBuffer(buildSolidPng(size, size, r, g, b))
}
