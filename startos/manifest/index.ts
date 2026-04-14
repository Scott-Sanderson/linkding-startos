import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'linkding',
  title: 'linkding',
  license: 'MIT',
  packageRepo: 'https://github.com/Scott-Sanderson/linkding-startos',
  upstreamRepo: 'https://github.com/sissbruecker/linkding',
  marketingUrl: 'https://linkding.link/',
  donationUrl: null,
  docsUrls: ['https://linkding.link/installation'],
  description: { short, long },
  volumes: ['main'],
  images: {
    linkding: {
      source: { dockerTag: 'sissbruecker/linkding:1.45.0' },
      arch: ['x86_64', 'aarch64'],
    },
  },
  alerts: {
    install: null,
    update: null,
    uninstall: null,
    restore: null,
    start: null,
    stop: null,
  },
  dependencies: {},
})
