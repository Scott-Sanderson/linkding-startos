import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'linkding',
  title: 'Linkding',
  license: 'MIT',
  packageRepo: 'https://github.com/Scott-Sanderson/linkding-startos',
  upstreamRepo: 'https://github.com/sissbruecker/linkding',
  marketingUrl: 'https://linkding.link/',
  donationUrl: null,
  description: { short, long },
  volumes: ['main', 'startos'],
  images: {
    linkding: {
      source: { dockerTag: 'sissbruecker/linkding:1.47.0' },
      arch: ['x86_64', 'aarch64'],
    },
  },
})
