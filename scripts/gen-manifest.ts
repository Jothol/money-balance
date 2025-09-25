import { promises as fs } from 'fs'
import config from '../pwa.config'

async function run() {
  const manifest = {
    name: config.appName,
    short_name: config.shortName,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: config.backgroundColor,
    theme_color: config.themeColor,
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  }
  await fs.mkdir('public', { recursive: true })
  await fs.writeFile(config.outManifestPath, JSON.stringify(manifest, null, 2))
}
run()
