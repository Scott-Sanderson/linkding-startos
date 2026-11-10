import { utils } from '@start9labs/start-sdk'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { linkdingWorkDir } from '../utils'
import {
  restoreOwnerPassword,
  withLinkdingSubcontainer,
} from './linkdingUserHelpers'

export const resetOwnerPassword = sdk.Action.withoutInput(
  'reset-owner-password',
  async ({ effects }) => {
    const username =
      (await storeJson.read((s) => s.adminUsername).const(effects)) ?? 'owner'
    return {
      name: i18n('Set Owner Password'),
      description: i18n('Generate a password for the owner account.'),
      warning: i18n(
        'This replaces the password for ${username} and restores administrator access, including reactivating a disabled account.',
        { username },
      ),
      allowedStatuses: 'any',
      group: i18n('Admin & Access'),
      visibility: 'enabled',
    }
  },
  async ({ effects }) => {
    const username =
      (await storeJson.read((s) => s.adminUsername).once()) ?? 'owner'
    const password = utils.getDefaultString({ charset: 'a-z,A-Z,0-9', len: 32 })

    await withLinkdingSubcontainer(effects, async (sub) => {
      await sub.execFail(['python', 'manage.py', 'migrate', '--noinput'], {
        cwd: linkdingWorkDir,
      })
      await sub.execFail(['python', 'manage.py', 'create_initial_superuser'], {
        cwd: linkdingWorkDir,
        env: { LD_SUPERUSER_NAME: username, LD_SUPERUSER_PASSWORD: password },
      })
    })
    await restoreOwnerPassword(effects, {
      username,
      password,
    })
    await storeJson.merge(effects, {
      adminUsername: username,
      adminConfigured: true,
    })

    return {
      version: '1',
      title: i18n('Owner Credentials'),
      message: i18n(
        'Save these credentials; the password cannot be displayed again.',
      ),
      result: {
        type: 'group',
        value: [
          {
            type: 'single',
            name: i18n('Username'),
            description: null,
            value: username,
            masked: false,
            copyable: true,
            qr: false,
            launchable: false,
          },
          {
            type: 'single',
            name: i18n('Password'),
            description: null,
            value: password,
            masked: true,
            copyable: true,
            qr: false,
            launchable: false,
          },
        ],
      },
    }
  },
)
