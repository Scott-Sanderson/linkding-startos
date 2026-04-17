import { storeJson } from '../fileModels/store.json'
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

const withLinkdingSubcontainer = <T>(
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
    const result = await sub.exec(['test', '-f', `${linkdingDataDir}/db.sqlite3`])
    return result.exitCode === 0
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
        description:
          'Database not initialized yet. Start linkding at least once, then retry.',
        warning,
        default: noSelectableUsersOption,
        values: {
          [noSelectableUsersOption]: 'No selectable users found',
        },
        disabled:
          'Database not initialized yet. Start linkding at least once, then retry.',
      }
    }

    const ownerUsername = (await storeJson.read((s) => s.adminUsername).once()) ?? 'owner'
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
          [noSelectableUsersOption]: 'No selectable users found',
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
    requireSuperuser = false,
  }: {
    username: string
    password: string
    requireSuperuser?: boolean
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
require_superuser = os.environ["REQUIRE_SUPERUSER"] == "true"

user = User.objects.filter(username=username).first()
if user is None:
    print("User does not exist.", file=sys.stderr)
    sys.exit(1)

if require_superuser and not user.is_superuser:
    print("Configured owner account is not a superuser.", file=sys.stderr)
    sys.exit(1)

user.set_password(password)
user.save()
`.trim(),
    {
      TARGET_USERNAME: username,
      NEW_PASSWORD: password,
      REQUIRE_SUPERUSER: requireSuperuser ? 'true' : 'false',
    },
  )

export const listUsersFromDatabase = async (
  effects: ActionEffects,
) =>
  withLinkdingSubcontainer(effects, async () => {
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
  })
