import { promises as fs } from 'node:fs'
import { ExtendedVersion, VersionRange } from '@start9labs/start-sdk'
import { sdk } from './sdk'

export const { createBackup } = sdk.setupBackups(async () =>
  sdk.Backups.ofVolumes('main', 'startos'),
)

export const restoreInit: ReturnType<typeof sdk.setupBackups>['restoreInit'] = {
  async init(effects, kind, progress) {
    if (kind !== 'restore') return

    const path = '/media/startos/backup/volumes/startos'
    let hasStartosVolume = true
    try {
      await fs.stat(path)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      hasStartosVolume = false
    }

    if (!hasStartosVolume) {
      const version = (
        await fs.readFile('/media/startos/backup/dataVersion.txt', 'utf8')
      ).trim()
      let isLegacy: boolean
      try {
        isLegacy = ExtendedVersion.parse(version).lessThan(
          ExtendedVersion.parse('1.47.0:0'),
        )
      } catch {
        isLegacy = !VersionRange.parse(version).intersects(
          VersionRange.parse('>=1.47.0:0'),
        )
      }
      if (!isLegacy) throw new Error('Backup is missing the startos volume')
    }

    const backups = hasStartosVolume
      ? sdk.Backups.ofVolumes('main', 'startos')
      : sdk.Backups.ofVolumes('main')
    await backups.init(effects, kind, progress)
  },
}
