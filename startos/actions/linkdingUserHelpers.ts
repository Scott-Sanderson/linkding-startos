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

export const runPythonScript = async (
  effects: ActionEffects,
  script: string,
  env: Record<string, string> = {},
) =>
  withLinkdingSubcontainer(effects, async (sub) =>
    sub.execFail(['python', '-c', script], {
      cwd: linkdingWorkDir,
      env,
    }),
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
  withLinkdingSubcontainer(effects, async (sub) => {
    const { stdout } = await sub.execFail(
      [
        'python',
        '-c',
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
      ],
      { cwd: linkdingWorkDir },
    )

    return JSON.parse(stdout.toString()) as LinkdingUserInfo[]
  })
