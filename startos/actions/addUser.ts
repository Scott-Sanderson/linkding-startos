import { sdk } from '../sdk'
import { isDatabaseInitialized, runPythonScript } from './linkdingUserHelpers'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  username: Value.text({
    name: 'Username',
    description: 'New user account name.',
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
    description: 'Password for the new user.',
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
    name: 'Admin',
    description: 'Enable admin privileges for this user.',
    warning: null,
    default: false,
  }),
})

export const addUser = sdk.Action.withInput(
  'add-user',
  async () => ({
    name: 'Add User',
    description: 'Create a new linkding user.',
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
    print("User already exists.", file=sys.stderr)
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
      },
    )
  },
)
