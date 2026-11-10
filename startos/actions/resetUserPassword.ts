import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
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
    name: i18n('Reset User Password'),
    description: i18n('Set a new password for an existing user.'),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('User Management'),
    visibility: 'enabled',
  }),
  async ({ effects }) =>
    InputSpec.of({
      username: dynamicNonOwnerUserSelect(effects, {
        name: i18n('User'),
        description: i18n(
          'Select the user account whose password should be reset.',
        ),
        emptyDescription: i18n(
          'No non-owner users are currently available for password reset.',
        ),
        emptyDisabledReason: i18n(
          'No non-owner users are available for password reset.',
        ),
      }),
      password: Value.text({
        name: i18n('Password'),
        description: i18n('New password.'),
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
        i18n(
          'Database not initialized yet. Start Linkding at least once, then retry.',
        ),
      )
    }

    if (input.username === noSelectableUsersOption) {
      return {
        version: '1' as const,
        title: i18n('No Users Available'),
        message: i18n(
          'No non-owner users are currently available for password reset.',
        ),
        result: null,
      }
    }

    const store = await storeJson.read((s) => s).once()
    if (input.username === (store?.adminUsername ?? 'owner')) {
      throw new Error(
        i18n('Use Set Owner Password for the configured owner/admin account.'),
      )
    }

    await setUserPassword(effects, {
      username: input.username,
      password: input.password,
    })
  },
)
