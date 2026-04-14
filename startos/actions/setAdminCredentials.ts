import { i18n } from '../i18n'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'
import { isDatabaseInitialized, runPythonScript } from './linkdingUserHelpers'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  username: Value.text({
    name: i18n('Username'),
    description: 'Username for the initial admin account.',
    warning: null,
    required: true,
    default: 'admin',
    masked: false,
    placeholder: 'admin',
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
    name: i18n('Password'),
    description: 'Password for the initial admin account.',
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

export const setAdminCredentials = sdk.Action.withInput(
  'set-admin-credentials',
  async () => ({
    name: 'Set Admin Credentials',
    description: 'Choose or rotate the initial admin username and password.',
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),
  inputSpec,
  async ({ effects }) => {
    const store = await storeJson.read((s) => s).const(effects)
    return {
      username: store?.adminUsername ?? 'admin',
      password: store?.adminPassword,
    }
  },
  async ({ effects, input }) => {
    const existing = await storeJson.read((s) => s).once()
    const dbReady = await isDatabaseInitialized(effects)

    if (dbReady) {
      await runPythonScript(
        effects,
        `
import os
import sys
from django.contrib.auth import get_user_model

User = get_user_model()
old_username = os.environ.get("OLD_ADMIN_USERNAME", "")
new_username = os.environ["NEW_ADMIN_USERNAME"]
new_password = os.environ["NEW_ADMIN_PASSWORD"]

existing_old = User.objects.filter(username=old_username).first() if old_username else None
existing_new = User.objects.filter(username=new_username).first()

if existing_old and existing_new and existing_old.pk != existing_new.pk:
    print("A different user with this username already exists.", file=sys.stderr)
    sys.exit(1)

user = existing_old or existing_new
if user is None:
    user = User(username=new_username)
else:
    user.username = new_username

user.is_superuser = True
user.is_staff = True
user.is_active = True
user.set_password(new_password)
user.save()
`.trim(),
        {
          OLD_ADMIN_USERNAME: existing?.adminUsername ?? '',
          NEW_ADMIN_USERNAME: input.username,
          NEW_ADMIN_PASSWORD: input.password,
        },
      )
    }

    await storeJson.merge(effects, {
      adminUsername: input.username,
      adminPassword: input.password,
    })
  },
)
