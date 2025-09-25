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
  themeColor: '#0EA5E9',
  backgroundColor: '#0EA5E9',
  baseIconPath: 'assets/pwa/base-icon.png',
  outIconDir: 'public/icons',
  outManifestPath: 'public/manifest.json'
}
export default config
