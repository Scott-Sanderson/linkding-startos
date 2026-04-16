import { utils } from '@start9labs/start-sdk'
import { getAdminCredentials } from '../actions/getAdminCredentials'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'

export const initializeService = sdk.setupOnInit(async (effects, kind) => {
  if (kind !== 'install') return

  const adminPassword = utils.getDefaultString({
    charset: 'a-z,A-Z,0-9',
    len: 24,
  })

  await storeJson.write(effects, {
    adminUsername: 'owner',
    adminPassword,
  })

  await sdk.action.createOwnTask(effects, getAdminCredentials, 'critical', {
    reason:
      'Retrieve your owner/admin account credentials, then open Web UI from Service Interfaces, sign in, and change the password.',
  })
})
