import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const shape = z.looseObject({
  adminUsername: z.string().catch('owner'),
  adminConfigured: z.boolean().catch(false),
})

export const storeJson = FileHelper.json(
  { base: sdk.volumes.startos, subpath: 'store.json' },
  shape,
)

export const legacyStoreJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: 'store.json' },
  z.looseObject({
    adminUsername: z.string().optional(),
    adminPassword: z.string().optional(),
  }),
)
