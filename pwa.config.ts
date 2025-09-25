export type PwaConfig = {
  appName: string
  shortName: string
  themeColor: string
  backgroundColor: string
  baseIconPath: string
  outIconDir: string
  outManifestPath: string
}
const config: PwaConfig = {
  appName: 'Evenly',
  shortName: 'Evenly',
  themeColor: '#34b7d0',
  backgroundColor: '#34b7d0',
  baseIconPath: 'assets/pwa/base-icon.png',
  outIconDir: 'public/icons',
  outManifestPath: 'public/manifest.json'
}
export default config
