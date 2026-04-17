import { i18n } from '../i18n'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'

export const getAdminCredentials = sdk.Action.withoutInput(
  'get-admin-credentials',
  async () => ({
    name: 'Get Owner/Admin Credentials',
    description: 'Retrieve the current owner/admin username and password.',
    warning: null,
    allowedStatuses: 'any',
    group: 'Admin & Access',
    visibility: 'enabled',
  }),
  async () => {
    const store = await storeJson.read((s) => s).once()

    return {
      version: '1' as const,
      title: 'Owner/Admin Account Credentials',
      message:
        'Use these credentials to sign in as the owner/admin account. For single-user setups, use this as your primary account. If needed, rotate this password using Reset Owner Password.',
      result: {
        type: 'group',
        value: [
          {
            type: 'single',
            name: i18n('Username'),
            description: null,
            value: store?.adminUsername ?? 'owner',
            masked: false,
            copyable: true,
            qr: false,
          },
          {
            type: 'single',
            name: i18n('Password'),
            description: null,
            value: store?.adminPassword ?? '',
            masked: true,
            copyable: true,
            qr: false,
          },
        ],
      },
    }
  },
)
