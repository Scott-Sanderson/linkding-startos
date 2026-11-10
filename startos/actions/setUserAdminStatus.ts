import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import {
  dynamicNonOwnerUserSelect,
  isDatabaseInitialized,
  noSelectableUsersOption,
  runPythonScript,
} from './linkdingUserHelpers'

const { InputSpec, Value } = sdk

export const setUserAdminStatus = sdk.Action.withInput(
  'set-user-admin-status',
  async () => ({
    name: i18n('Set User Admin Status'),
    description: i18n('Grant or revoke admin privileges for a user.'),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('User Management'),
    visibility: 'enabled',
  }),
  async ({ effects }) =>
    InputSpec.of({
      username: dynamicNonOwnerUserSelect(effects, {
        name: i18n('User'),
        description: i18n('Select the user account to update.'),
        emptyDescription: i18n(
          'No non-owner users are currently available to update.',
        ),
        emptyDisabledReason: i18n(
          'No non-owner users are available to update.',
        ),
      }),
      admin: Value.toggle({
        name: i18n('Admin'),
        description: i18n('Enable or disable admin privileges for this user.'),
        warning: null,
        default: false,
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
        message: i18n('No non-owner users are currently available to update.'),
        result: null,
      }
    }

    const store = await storeJson.read((s) => s).once()
    if (input.username === (store?.adminUsername ?? 'owner') && !input.admin) {
      throw new Error(
        i18n(
          'Cannot revoke admin privileges from the configured owner/admin account.',
        ),
      )
    }

    await runPythonScript(
      effects,
      `
import os
import sys
from django.contrib.auth import get_user_model

User = get_user_model()
username = os.environ["TARGET_USERNAME"]
make_admin = os.environ["MAKE_ADMIN"] == "true"

user = User.objects.filter(username=username).first()
if user is None:
    print(os.environ["ERROR_USER_MISSING"], file=sys.stderr)
    sys.exit(1)

if not make_admin and user.is_superuser and User.objects.filter(is_superuser=True).count() <= 1:
    print(os.environ["ERROR_LAST_SUPERUSER"], file=sys.stderr)
    sys.exit(1)

user.is_superuser = make_admin
user.is_staff = make_admin
user.save()
`.trim(),
      {
        TARGET_USERNAME: input.username,
        MAKE_ADMIN: input.admin ? 'true' : 'false',
        ERROR_USER_MISSING: i18n('User does not exist.'),
        ERROR_LAST_SUPERUSER: i18n('Cannot demote the last superuser.'),
      },
    )
  },
)
