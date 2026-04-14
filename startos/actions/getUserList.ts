import { sdk } from '../sdk'
import { isDatabaseInitialized, listUsersFromDatabase } from './linkdingUserHelpers'

export const getUserList = sdk.Action.withoutInput(
  'get-user-list',
  async () => ({
    name: 'Get User List',
    description: 'Show all linkding users and their roles.',
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),
  async ({ effects }) => {
    if (!(await isDatabaseInitialized(effects))) {
      throw new Error(
        'Database not initialized yet. Start linkding at least once, then retry.',
      )
    }

    const users = await listUsersFromDatabase(effects)

    if (users.length === 0) {
      return {
        version: '1' as const,
        title: 'Linkding Users',
        message: 'No users found.',
        result: {
          type: 'group',
          value: [
            {
              type: 'single' as const,
              name: 'Users',
              description: null,
              value: 'No users found.',
              masked: false,
              copyable: false,
              qr: false,
            },
          ],
        },
      }
    }

    return {
      version: '1' as const,
      title: 'Linkding Users',
      message: 'Current users and privileges.',
      result: {
        type: 'group',
        value: users.map((user) => ({
          type: 'single' as const,
          name: user.username,
          description: null,
          value: [
            user.isSuperuser ? 'superuser' : 'regular',
            user.isStaff ? 'staff' : 'non-staff',
            user.isActive ? 'active' : 'inactive',
          ].join(', '),
          masked: false,
          copyable: false,
          qr: false,
        })),
      },
    }
  },
)
