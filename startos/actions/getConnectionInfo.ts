import { sdk } from '../sdk'
import { i18n } from '../i18n'
import { uiPort } from '../utils'

type ConnectionAddress = {
  url: string
  visibility: 'public' | 'private'
  addressType: string
  gateway: string | null
}

const toAddressType = ({
  kind,
  isPublic,
}: {
  kind: 'ipv4' | 'ipv6' | 'mdns' | 'private-domain' | 'public-domain' | 'plugin'
  isPublic: boolean
}) => {
  if (kind === 'mdns') return i18n('mDNS (.local)')
  if (kind === 'private-domain') return i18n('Private Domain')
  if (kind === 'public-domain') return i18n('Public Domain')
  if (kind === 'ipv4')
    return isPublic ? i18n('Public IPv4') : i18n('Private IPv4')
  if (kind === 'ipv6')
    return isPublic ? i18n('Public IPv6') : i18n('Private IPv6')
  return i18n('Plugin URL')
}

const toGateway = (metadata: {
  kind: 'ipv4' | 'ipv6' | 'mdns' | 'private-domain' | 'public-domain' | 'plugin'
  gateway?: string
  gateways?: string[]
  packageId?: string
}) => {
  if (metadata.kind === 'mdns' || metadata.kind === 'private-domain') {
    return metadata.gateways?.join(', ') ?? null
  }
  if (
    metadata.kind === 'public-domain' ||
    metadata.kind === 'ipv4' ||
    metadata.kind === 'ipv6'
  ) {
    return metadata.gateway ?? null
  }
  return metadata.kind === 'plugin' ? (metadata.packageId ?? null) : null
}

const toAddressMember = (address: ConnectionAddress) => ({
  type: 'single' as const,
  name: address.gateway
    ? `${address.addressType} (${address.gateway})`
    : address.addressType,
  description: null,
  value: address.url,
  masked: false,
  copyable: true,
  qr: true,
  launchable: true,
})

const toAddressGroup = ({
  name,
  description,
  addresses,
  emptyMessage,
}: {
  name: string
  description: string
  addresses: ConnectionAddress[]
  emptyMessage: string
}) => ({
  type: 'group' as const,
  name,
  description,
  value:
    addresses.length > 0
      ? addresses.map(toAddressMember)
      : [
          {
            type: 'single' as const,
            name: i18n('None'),
            description: null,
            value: emptyMessage,
            masked: false,
            copyable: false,
            qr: false,
            launchable: false,
          },
        ],
})

export const getConnectionInfo = sdk.Action.withoutInput(
  'get-connection-info',
  async () => ({
    name: i18n('Get Connection Info'),
    description: i18n(
      'Show current Linkding URLs for private (LAN/VPN) and public access.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Admin & Access'),
    visibility: 'enabled',
  }),
  async ({ effects }) => {
    const addresses = await sdk.host
      .getOwn(effects, 'ui-multi', (host) => {
        const serviceInterface = host?.bindings[uiPort]?.interfaces['ui']
        const addressInfo = serviceInterface?.addressInfo
        if (!addressInfo) return [] as ConnectionAddress[]

        return addressInfo.nonLocal.format('hostname-info').map((hostname) => ({
          url: addressInfo.toUrl(hostname),
          visibility: hostname.public
            ? ('public' as const)
            : ('private' as const),
          addressType: toAddressType({
            kind: hostname.metadata.kind,
            isPublic: hostname.public,
          }),
          gateway: toGateway(hostname.metadata),
        }))
      })
      .once()

    if (addresses.length === 0) {
      throw new Error(
        i18n(
          'No Linkding interface addresses are available yet. Start the service and retry.',
        ),
      )
    }

    const dedupedAddresses = Array.from(
      new Map(addresses.map((address) => [address.url, address])).values(),
    )
    const privateAddresses = dedupedAddresses.filter(
      (address) => address.visibility === 'private',
    )
    const publicAddresses = dedupedAddresses.filter(
      (address) => address.visibility === 'public',
    )

    return {
      version: '1' as const,
      title: i18n('Linkding Connection Info'),
      message: i18n('Use an available address to connect to Linkding.'),
      result: {
        type: 'group' as const,
        value: [
          toAddressGroup({
            name: i18n('Private Access (LAN/VPN)'),
            description: i18n(
              'Use these URLs on your local network or while connected to VPN.',
            ),
            addresses: privateAddresses,
            emptyMessage: i18n(
              'No private URLs are currently available for this interface.',
            ),
          }),
          toAddressGroup({
            name: i18n('Public Access (Internet)'),
            description: i18n(
              'Use these URLs for remote/public access after DNS and forwarding are configured.',
            ),
            addresses: publicAddresses,
            emptyMessage: i18n(
              'No public URLs are currently available for this interface.',
            ),
          }),
        ],
      },
    }
  },
)
