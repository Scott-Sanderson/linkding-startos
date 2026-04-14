import { sdk } from '../sdk'
import { addUser } from './addUser'
import { getUserList } from './getUserList'
import { getAdminCredentials } from './getAdminCredentials'
import { removeUser } from './removeUser'
import { resetUserPassword } from './resetUserPassword'
import { setAdminCredentials } from './setAdminCredentials'
import { setUserAdminStatus } from './setUserAdminStatus'

export const actions = sdk.Actions.of()
  .addAction(getAdminCredentials)
  .addAction(setAdminCredentials)
  .addAction(addUser)
  .addAction(getUserList)
  .addAction(removeUser)
  .addAction(resetUserPassword)
  .addAction(setUserAdminStatus)
