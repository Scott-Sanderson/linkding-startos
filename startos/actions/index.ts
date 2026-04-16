import { sdk } from '../sdk'
import { addUser } from './addUser'
import { getUserList } from './getUserList'
import { getAdminCredentials } from './getAdminCredentials'
import { getConnectionInfo } from './getConnectionInfo'
import { removeUser } from './removeUser'
import { resetUserPassword } from './resetUserPassword'
import { setUserAdminStatus } from './setUserAdminStatus'

export const actions = sdk.Actions.of()
  .addAction(getAdminCredentials)
  .addAction(getConnectionInfo)
  .addAction(addUser)
  .addAction(getUserList)
  .addAction(removeUser)
  .addAction(resetUserPassword)
  .addAction(setUserAdminStatus)
