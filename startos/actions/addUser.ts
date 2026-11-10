import { sdk } from '../sdk'
import { i18n } from '../i18n'
import { storeJson } from '../fileModels/store.json'
import { isDatabaseInitialized, runPythonScript } from './linkdingUserHelpers'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  username: Value.text({
    name: i18n('Username'),
    description: i18n('New user account name.'),
    warning: null,
    required: true,
    default: null,
    masked: false,
    minLength: 1,
    maxLength: 150,
    patterns: [
      {
        regex: '^\\S+$',
        description: i18n('Username cannot contain spaces.'),
      },
    ],
  }),
  password: Value.text({
    name: i18n('Password'),
    description: i18n('Password for the new user.'),
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
  admin: Value.toggle({
    name: i18n('Admin'),
    description: i18n('Enable admin privileges for this user.'),
    warning: null,
    default: false,
  }),
})

export const addUser = sdk.Action.withInput(
  'add-user',
  async () => ({
    name: i18n('Add User'),
    description: i18n('Create a new Linkding user.'),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('User Management'),
    visibility: 'enabled',
  }),
  inputSpec,
  async () => ({}),
  async ({ effects, input }) => {
    if (!(await isDatabaseInitialized(effects))) {
      throw new Error(
        i18n(
          'Database not initialized yet. Start Linkding at least once, then retry.',
        ),
      )
    }

    if (!input.username.trim()) {
      throw new Error(i18n('Username cannot be empty.'))
    }
    const ownerUsername =
      (await storeJson.read((s) => s.adminUsername).once()) ?? 'owner'
    if (input.username === ownerUsername) {
      throw new Error(i18n('This username is reserved for the owner account.'))
    }

    await runPythonScript(
      effects,
      `
import os
import sys
from django.contrib.auth import get_user_model

User = get_user_model()
username = os.environ["NEW_USERNAME"]
password = os.environ["NEW_PASSWORD"]
is_admin = os.environ["NEW_IS_ADMIN"] == "true"

if User.objects.filter(username=username).exists():
    print(os.environ["ERROR_USER_EXISTS"], file=sys.stderr)
    sys.exit(1)

user = User(
    username=username,
    is_superuser=is_admin,
    is_staff=is_admin,
    is_active=True,
)
user.set_password(password)
user.save()
`.trim(),
      {
        NEW_USERNAME: input.username,
        NEW_PASSWORD: input.password,
        NEW_IS_ADMIN: input.admin ? 'true' : 'false',
        ERROR_USER_EXISTS: i18n('User already exists.'),
      },
    )

    return {
      version: '1' as const,
      title: i18n('User Created'),
      message: i18n('Copy and deliver these credentials to the user.'),
      result: {
        type: 'group',
        value: [
          {
            type: 'single' as const,
            name: i18n('Username'),
            description: null,
            value: input.username,
            masked: false,
            copyable: true,
            qr: false,
            launchable: false,
          },
          {
            type: 'single' as const,
            name: i18n('Password'),
            description: null,
            value: input.password,
            masked: true,
            copyable: true,
            qr: false,
            launchable: false,
          },
          {
            type: 'single' as const,
            name: i18n('Role'),
            description: null,
            value: input.admin ? i18n('admin') : i18n('regular user'),
            masked: false,
            copyable: false,
            qr: false,
            launchable: false,
          },
        ],
      },
    }
  },
)
