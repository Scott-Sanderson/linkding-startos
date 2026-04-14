import { i18n } from '../i18n'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'

export const getAdminCredentials = sdk.Action.withoutInput(
  'get-admin-credentials',
  async () => ({
    name: i18n('Get Admin Credentials'),
    description: i18n('Retrieve the initial admin username and password'),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),
  async () => {
    const store = await storeJson.read((s) => s).once()

    return {
      version: '1' as const,
      title: i18n('Initial Admin Credentials'),
      message: i18n('Your initial admin credentials for linkding'),
      result: {
        type: 'group',
        value: [
          {
            type: 'single',
            name: i18n('Username'),
            description: null,
            value: store?.adminUsername ?? 'admin',
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
