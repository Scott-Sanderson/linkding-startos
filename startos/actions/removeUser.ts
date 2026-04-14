import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'
import { isDatabaseInitialized, runPythonScript } from './linkdingUserHelpers'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  username: Value.text({
    name: 'Username',
    description: 'Username to remove.',
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
})

export const removeUser = sdk.Action.withInput(
  'remove-user',
  async () => ({
    name: 'Remove User',
    description: 'Delete a user account.',
    warning: 'This permanently removes the user account.',
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
    if (input.username === store?.adminUsername) {
      throw new Error(
        'Cannot remove the configured bootstrap admin user. Set different admin credentials first.',
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

user = User.objects.filter(username=username).first()
if user is None:
    print("User does not exist.", file=sys.stderr)
    sys.exit(1)

if user.is_superuser and User.objects.filter(is_superuser=True).count() <= 1:
    print("Cannot remove the last superuser.", file=sys.stderr)
    sys.exit(1)

user.delete()
`.trim(),
      {
        TARGET_USERNAME: input.username,
      },
    )
  },
)
