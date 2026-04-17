import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'
import {
  dynamicNonOwnerUserSelect,
  isDatabaseInitialized,
  noSelectableUsersOption,
  runPythonScript,
} from './linkdingUserHelpers'

const { InputSpec } = sdk

export const removeUser = sdk.Action.withInput(
  'remove-user',
  async () => ({
    name: 'Remove User',
    description: 'Delete a user account.',
    warning: 'This permanently removes the user account.',
    allowedStatuses: 'any',
    group: 'User Management',
    visibility: 'enabled',
  }),
  async ({ effects }) =>
    InputSpec.of({
      username: dynamicNonOwnerUserSelect(effects, {
        name: 'User',
        description: 'Select the user account to delete.',
        warning: 'This permanently removes the selected user account.',
        emptyDescription: 'No non-owner users are currently available to remove.',
        emptyDisabledReason: 'No non-owner users are available to remove.',
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
          'No non-owner users are currently available to remove.',
        result: null,
      }
    }

    const store = await storeJson.read((s) => s).once()
    if (input.username === store?.adminUsername) {
      throw new Error(
        'Cannot remove the configured owner/admin account.',
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
