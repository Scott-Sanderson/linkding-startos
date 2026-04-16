export const DEFAULT_LANG = 'en_US'

const dict = {
  // main.ts
  'Starting linkding!': 0,
  'Web Interface': 1,
  'The web interface is ready': 2,
  'The web interface is not ready': 3,

  // interfaces.ts
  'Web UI': 4,
  'Open linkding and view shareable access addresses': 5,

  // actions/getAdminCredentials.ts
  'Get Admin Credentials': 6,
  'Retrieve the initial admin username and password': 7,
  'Initial Admin Credentials': 8,
  'Your initial admin credentials for linkding': 9,
  Username: 10,
  Password: 11,

  // init/initializeService.ts
  'Retrieve the admin password': 12,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
