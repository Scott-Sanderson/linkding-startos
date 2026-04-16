import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'
import { isDatabaseInitialized, setUserPassword } from './linkdingUserHelpers'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  username: Value.text({
    name: 'Username',
    description: 'User to update.',
    warning: null,
    required: true,
    default: null,
    masked: false,
    minLength: 1,
    maxLength: 150,
    patterns: [
      {
        regex: '^\\S+$',
        description: 'Username cannot contain spaces.',
      },
    ],
  }),
  password: Value.text({
    name: 'Password',
    description: 'New password.',
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

export const resetUserPassword = sdk.Action.withInput(
  'reset-user-password',
  async () => ({
    name: 'Reset User Password',
    description: 'Set a new password for an existing user.',
    warning: null,
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
    if (input.username === (store?.adminUsername ?? 'owner')) {
      throw new Error(
        'Use Reset Owner Password for the configured owner/admin account.',
      )
    }

    await setUserPassword(effects, {
      username: input.username,
      password: input.password,
    })
  },
)
