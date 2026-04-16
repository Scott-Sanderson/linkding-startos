import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'
import { isDatabaseInitialized, setUserPassword } from './linkdingUserHelpers'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  password: Value.text({
    name: 'New Owner Password',
    description: 'New password for the configured owner/admin account.',
    warning: null,
    required: true,
    default: null,
    masked: true,
    minLength: 8,
    maxLength: 512,
    generate: {
      charset: 'a-z,A-Z,0-9',
      len: 24,
    },
  }),
})

export const resetOwnerPassword = sdk.Action.withInput(
  'reset-owner-password',
  async () => ({
    name: 'Reset Owner Password',
    description:
      'Safely reset the password for the configured owner/admin account.',
    warning:
      'This updates both the linkding account password and StartOS stored owner credentials.',
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),
  inputSpec,
  async () => ({}),
  async ({ effects, input }) => {
    if (!(await isDatabaseInitialized(effects))) {
      throw new Error(
        'Database not initialized yet. Start linkding at least once, then retry.',
      )
    }

    const store = await storeJson.read((s) => s).once()
    const ownerUsername = store?.adminUsername ?? 'owner'

    await setUserPassword(effects, {
      username: ownerUsername,
      password: input.password,
      requireSuperuser: true,
    })

    await storeJson.merge(effects, {
      adminUsername: ownerUsername,
      adminPassword: input.password,
    })

    return {
      version: '1' as const,
      title: 'Owner Password Reset',
      message:
        'Owner/admin password updated in both linkding and StartOS credential storage.',
      result: {
        type: 'group',
        value: [
          {
            type: 'single' as const,
            name: 'Username',
            description: null,
            value: ownerUsername,
            masked: false,
            copyable: true,
            qr: false,
          },
          {
            type: 'single' as const,
            name: 'New Password',
            description: null,
            value: input.password,
            masked: true,
            copyable: true,
            qr: false,
          },
        ],
      },
    }
  },
)
