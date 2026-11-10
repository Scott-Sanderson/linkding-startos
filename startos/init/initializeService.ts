import { resetOwnerPassword } from '../actions/resetOwnerPassword'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const initializeService = sdk.setupOnInit(async (effects) => {
  const configured = await storeJson
    .read((s) => s.adminConfigured)
    .const(effects)
  if (!configured) {
    await sdk.action.createOwnTask(effects, resetOwnerPassword, 'critical', {
      reason: i18n('Set the owner password before signing in to Linkding.'),
    })
  }
})
