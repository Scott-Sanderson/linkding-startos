import { i18n } from './i18n'
import { storeJson } from './fileModels/store.json'
import { sdk } from './sdk'
import { linkdingDataDir, uiPort } from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  const store = await storeJson.read((s) => s).const(effects)
  console.info(i18n('Starting linkding!'))

  return sdk.Daemons.of(effects).addDaemon('primary', {
    subcontainer: await sdk.SubContainer.of(
      effects,
      { imageId: 'linkding' },
      sdk.Mounts.of().mountVolume({
        volumeId: 'main',
        subpath: null,
        mountpoint: linkdingDataDir,
        readonly: false,
      }),
      'linkding-sub',
    ),
    exec: {
      command: sdk.useEntrypoint(),
      env: {
        LD_SERVER_HOST: '[::]',
        LD_SERVER_PORT: `${uiPort}`,
        LD_SUPERUSER_NAME: store?.adminUsername ?? 'admin',
        LD_SUPERUSER_PASSWORD: store?.adminPassword ?? '',
      },
    },
    ready: {
      display: i18n('Web Interface'),
      fn: () =>
        sdk.healthCheck.checkPortListening(effects, uiPort, {
          successMessage: i18n('The web interface is ready'),
          errorMessage: i18n('The web interface is not ready'),
        }),
    },
    requires: [],
  })
})
