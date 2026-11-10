import { sdk } from '../sdk'
import { addUser } from './addUser'
import { getUserList } from './getUserList'
import { getConnectionInfo } from './getConnectionInfo'
import { removeUser } from './removeUser'
import { resetOwnerPassword } from './resetOwnerPassword'
import { resetUserPassword } from './resetUserPassword'
import { setUserAdminStatus } from './setUserAdminStatus'

export const actions = sdk.Actions.of()
  .addAction(getConnectionInfo)
  .addAction(resetOwnerPassword)
  .addAction(addUser)
  .addAction(getUserList)
  .addAction(removeUser)
  .addAction(resetUserPassword)
  .addAction(setUserAdminStatus)
