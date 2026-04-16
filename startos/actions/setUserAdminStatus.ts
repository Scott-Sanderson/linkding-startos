import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'
import { isDatabaseInitialized, runPythonScript } from './linkdingUserHelpers'

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
  admin: Value.toggle({
    name: 'Admin',
    description: 'Enable or disable admin privileges for this user.',
    warning: null,
    default: false,
  }),
})

export const setUserAdminStatus = sdk.Action.withInput(
  'set-user-admin-status',
  async () => ({
    name: 'Set User Admin Status',
    description: 'Grant or revoke admin privileges for a user.',
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
    if (
      input.username === (store?.adminUsername ?? 'owner') &&
      !input.admin
    ) {
      throw new Error(
        'Cannot revoke admin privileges from the configured owner/admin account.',
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
    print("User does not exist.", file=sys.stderr)
    sys.exit(1)

if not make_admin and user.is_superuser and User.objects.filter(is_superuser=True).count() <= 1:
    print("Cannot demote the last superuser.", file=sys.stderr)
    sys.exit(1)

user.is_superuser = make_admin
user.is_staff = make_admin
user.save()
`.trim(),
      {
        TARGET_USERNAME: input.username,
        MAKE_ADMIN: input.admin ? 'true' : 'false',
      },
    )
  },
)
