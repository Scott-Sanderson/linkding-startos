import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'
import {
  dynamicNonOwnerUserSelect,
  isDatabaseInitialized,
  noSelectableUsersOption,
  setUserPassword,
} from './linkdingUserHelpers'

const { InputSpec, Value } = sdk

export const resetUserPassword = sdk.Action.withInput(
  'reset-user-password',
  async () => ({
    name: 'Reset User Password',
    description: 'Set a new password for an existing user.',
    warning: null,
    allowedStatuses: 'any',
    group: 'User Management',
    visibility: 'enabled',
  }),
  async ({ effects }) =>
    InputSpec.of({
      username: dynamicNonOwnerUserSelect(effects, {
        name: 'User',
        description: 'Select the user account whose password should be reset.',
        emptyDescription:
          'No non-owner users are currently available for password reset.',
        emptyDisabledReason:
          'No non-owner users are available for password reset.',
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
    }),
  async () => ({}),
  async ({ effects, input }) => {
    if (!(await isDatabaseInitialized(effects))) {
      throw new Error(
        'Database not initialized yet. Start linkding at least once, then retry.',
      )
    }

    if (input.username === noSelectableUsersOption) {
      return {
        version: '1' as const,
        title: 'No Users Available',
        message:
          'No non-owner users are currently available for password reset.',
        result: null,
      }
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
