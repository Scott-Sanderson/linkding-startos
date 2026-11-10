import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { linkdingDataDir, linkdingWorkDir } from '../utils'

type LinkdingUserInfo = {
  username: string
  isSuperuser: boolean
  isStaff: boolean
  isActive: boolean
}

type ActionEffects = Parameters<typeof sdk.SubContainer.withTemp>[0]
type LinkdingSubcontainer = Parameters<
  Parameters<typeof sdk.SubContainer.withTemp>[4]
>[0]

const { Value } = sdk

export const noSelectableUsersOption = '__no-selectable-users__'

const toUserSelectValues = (usernames: string[]) =>
  usernames.reduce<Record<string, string>>((values, username) => {
    values[username] = username
    return values
  }, {})

export const withLinkdingSubcontainer = <T>(
  effects: ActionEffects,
  fn: (sub: LinkdingSubcontainer) => Promise<T>,
) =>
  sdk.SubContainer.withTemp(
    effects,
    { imageId: 'linkding' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'main',
      subpath: null,
      mountpoint: linkdingDataDir,
      readonly: false,
    }),
    'linkding-action-sub',
    fn,
  )

export const isDatabaseInitialized = (effects: ActionEffects) =>
  withLinkdingSubcontainer(effects, async (sub) => {
    const result = await sub.exec([
      'test',
      '-f',
      `${linkdingDataDir}/db.sqlite3`,
    ])
    return result.exitCode === 0
  })

export const ownerHasAdminAccess = (effects: ActionEffects, username: string) =>
  withLinkdingSubcontainer(effects, async (sub) => {
    const { stdout } = await sub.execFail(
      [
        'python',
        '-c',
        `import os, sqlite3
path = os.path.join(os.environ['DATA_DIR'], 'db.sqlite3')
if not os.path.isfile(path):
    print('false')
else:
    db = sqlite3.connect('file:' + path + '?mode=ro', uri=True)
    exists = db.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='auth_user'").fetchone()
    row = db.execute('SELECT is_superuser, is_staff, is_active FROM auth_user WHERE username = ?', (os.environ['OWNER'],)).fetchone() if exists else None
    print('true' if row and all(row) else 'false')`,
      ],
      { env: { DATA_DIR: linkdingDataDir, OWNER: username } },
    )
    return stdout.toString().trim() === 'true'
  })

export const dynamicNonOwnerUserSelect = (
  effects: ActionEffects,
  {
    name,
    description,
    warning = null,
    emptyDescription,
    emptyDisabledReason,
  }: {
    name: string
    description: string
    warning?: string | null
    emptyDescription: string
    emptyDisabledReason: string
  },
) =>
  Value.dynamicSelect(async () => {
    if (!(await isDatabaseInitialized(effects))) {
      return {
        name,
        description: i18n(
          'Database not initialized yet. Start Linkding at least once, then retry.',
        ),
        warning,
        default: noSelectableUsersOption,
        values: {
          [noSelectableUsersOption]: i18n('No selectable users found'),
        },
        disabled: i18n(
          'Database not initialized yet. Start Linkding at least once, then retry.',
        ),
      }
    }

    const ownerUsername =
      (await storeJson.read((s) => s.adminUsername).once()) ?? 'owner'
    const users = await listUsersFromDatabase(effects)
    const selectableUsernames = users
      .map((user) => user.username)
      .filter((username) => username !== ownerUsername)

    if (selectableUsernames.length === 0) {
      return {
        name,
        description: emptyDescription,
        warning,
        default: noSelectableUsersOption,
        values: {
          [noSelectableUsersOption]: i18n('No selectable users found'),
        },
        disabled: emptyDisabledReason,
      }
    }

    return {
      name,
      description,
      warning,
      default: selectableUsernames[0],
      values: toUserSelectValues(selectableUsernames),
      disabled: false,
    }
  })

export const runPythonScript = async (
  effects: ActionEffects,
  script: string,
  env: Record<string, string> = {},
) =>
  // Action scripts execute outside manage.py, so initialize Django explicitly.
  withLinkdingSubcontainer(effects, async (sub) =>
    sub.execFail(
      [
        'python',
        '-c',
        `
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "bookmarks.settings")
django.setup()

${script}
`.trim(),
      ],
      {
        cwd: linkdingWorkDir,
        env,
      },
    ),
  )

export const setUserPassword = async (
  effects: ActionEffects,
  {
    username,
    password,
  }: {
    username: string
    password: string
  },
) =>
  runPythonScript(
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
    print(os.environ["ERROR_USER_MISSING"], file=sys.stderr)
    sys.exit(1)

user.set_password(password)
user.save()
`.trim(),
    {
      TARGET_USERNAME: username,
      NEW_PASSWORD: password,
      ERROR_USER_MISSING: i18n('User does not exist.'),
    },
  )

export const restoreOwnerPassword = (
  effects: ActionEffects,
  { username, password }: { username: string; password: string },
) =>
  runPythonScript(
    effects,
    `
import os
import sys
from django.contrib.auth import get_user_model

User = get_user_model()
user = User.objects.filter(username=os.environ["TARGET_USERNAME"]).first()
if user is None:
    print(os.environ["ERROR_USER_MISSING"], file=sys.stderr)
    sys.exit(1)

user.is_superuser = True
user.is_staff = True
user.is_active = True
user.set_password(os.environ["NEW_PASSWORD"])
user.save(update_fields=["password", "is_superuser", "is_staff", "is_active"])
`.trim(),
    {
      TARGET_USERNAME: username,
      NEW_PASSWORD: password,
      ERROR_USER_MISSING: i18n('User does not exist.'),
    },
  )

export const listUsersFromDatabase = async (effects: ActionEffects) => {
  const { stdout } = await runPythonScript(
    effects,
    `
import json
from django.contrib.auth import get_user_model
User = get_user_model()
users = [
  {
    "username": u.username,
    "isSuperuser": u.is_superuser,
    "isStaff": u.is_staff,
    "isActive": u.is_active
  }
  for u in User.objects.order_by("username")
]
print(json.dumps(users))
`.trim(),
  )

  return JSON.parse(stdout.toString()) as LinkdingUserInfo[]
}
