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

    await runPythonScript(
      effects,
      `
import os
import sys
from django.contrib.auth import get_user_model

User = get_user_model()
username = os.environ["TARGET_USERNAME"]
password = os.environ["NEW_PASSWORD"]

user = User.objects.filter(username=username).first()
if user is None:
    print("User does not exist.", file=sys.stderr)
    sys.exit(1)

user.set_password(password)
user.save()
`.trim(),
      {
        TARGET_USERNAME: input.username,
        NEW_PASSWORD: input.password,
      },
    )
  },
)
