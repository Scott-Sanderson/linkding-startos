import { sdk } from '../sdk'
import { i18n } from '../i18n'
import {
  isDatabaseInitialized,
  listUsersFromDatabase,
} from './linkdingUserHelpers'

export const getUserList = sdk.Action.withoutInput(
  'get-user-list',
  async () => ({
    name: i18n('Get User List'),
    description: i18n('Show all Linkding users and their roles.'),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('User Management'),
    visibility: 'enabled',
  }),
  async ({ effects }) => {
    if (!(await isDatabaseInitialized(effects))) {
      throw new Error(
        i18n(
          'Database not initialized yet. Start Linkding at least once, then retry.',
        ),
      )
    }

    const users = await listUsersFromDatabase(effects)

    if (users.length === 0) {
      return {
        version: '1' as const,
        title: i18n('Linkding Users'),
        message: i18n('No users found.'),
        result: {
          type: 'group',
          value: [
            {
              type: 'single' as const,
              name: i18n('Users'),
              description: null,
              value: i18n('No users found.'),
              masked: false,
              copyable: false,
              qr: false,
              launchable: false,
            },
          ],
        },
      }
    }

    return {
      version: '1' as const,
      title: i18n('Linkding Users'),
      message: i18n('Current users and privileges.'),
      result: {
        type: 'group',
        value: users.map((user) => ({
          type: 'single' as const,
          name: user.username,
          description: null,
          value: [
            user.isSuperuser ? i18n('superuser') : i18n('regular'),
            user.isStaff ? i18n('staff') : i18n('non-staff'),
            user.isActive ? i18n('active') : i18n('inactive'),
          ].join(', '),
          masked: false,
          copyable: false,
          qr: false,
          launchable: false,
        })),
      },
    }
  },
)
