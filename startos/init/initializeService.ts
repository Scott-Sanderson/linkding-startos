import { utils } from '@start9labs/start-sdk'
import { getAdminCredentials } from '../actions/getAdminCredentials'
import { setAdminCredentials } from '../actions/setAdminCredentials'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const initializeService = sdk.setupOnInit(async (effects, kind) => {
  if (kind !== 'install') return

  const adminPassword = utils.getDefaultString({
    charset: 'a-z,A-Z,0-9',
    len: 24,
  })

  await storeJson.write(effects, {
    adminUsername: 'admin',
    adminPassword,
  })

  await sdk.action.createOwnTask(effects, setAdminCredentials, 'critical', {
    reason: 'Choose your initial admin username and password.',
  })

  await sdk.action.createOwnTask(effects, getAdminCredentials, 'critical', {
    reason: i18n('Retrieve the admin password'),
  })
})
