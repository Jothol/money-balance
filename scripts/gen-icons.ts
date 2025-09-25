import sharp from 'sharp'
import { promises as fs } from 'fs'
import path from 'path'
import config from '../pwa.config'

const androidSizes = [192, 512]
const maskableSize = 512
const appleTouchSize = 180

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true })
}

async function genPng(size: number, name: string) {
  const out = path.join(config.outIconDir, name)
  await sharp(config.baseIconPath).resize(size, size).png().toFile(out)
  return out
}

async function genMaskable(size: number, name: string) {
  const out = path.join(config.outIconDir, name)
  const inset = Math.round(size * 0.9)
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: await sharp(config.baseIconPath).resize(inset, inset).png().toBuffer(), top: Math.round((size - inset) / 2), left: Math.round((size - inset) / 2) }])
    .png()
    .toFile(out)
  return out
}

async function genAppleTouch(size: number) {
  const out = path.join('public', 'apple-touch-icon.png')
  await sharp(config.baseIconPath).resize(size, size).png().toFile(out)
  return out
}

async function run() {
  await ensureDir(config.outIconDir)
  for (const s of androidSizes) {
    await genPng(s, `icon-${s}.png`)
  }
  await genMaskable(maskableSize, 'icon-maskable.png')
  await genAppleTouch(appleTouchSize)
}
run()
