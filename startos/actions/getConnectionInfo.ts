import { sdk } from '../sdk'

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
  kind:
    | 'ipv4'
    | 'ipv6'
    | 'mdns'
    | 'private-domain'
    | 'public-domain'
    | 'plugin'
  isPublic: boolean
}) => {
  if (kind === 'mdns') return 'mDNS (.local)'
  if (kind === 'private-domain') return 'Private Domain'
  if (kind === 'public-domain') return 'Public Domain'
  if (kind === 'ipv4') return isPublic ? 'Public IPv4' : 'Private IPv4'
  if (kind === 'ipv6') return isPublic ? 'Public IPv6' : 'Private IPv6'
  return 'Plugin URL'
}

const toGateway = (metadata: {
  kind:
    | 'ipv4'
    | 'ipv6'
    | 'mdns'
    | 'private-domain'
    | 'public-domain'
    | 'plugin'
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
  return metadata.kind === 'plugin' ? metadata.packageId ?? null : null
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
            name: 'None',
            description: null,
            value: emptyMessage,
            masked: false,
            copyable: false,
            qr: false,
          },
        ],
})

export const getConnectionInfo = sdk.Action.withoutInput(
  'get-connection-info',
  async () => ({
    name: 'Get Connection Info',
    description:
      'Show current Linkding URLs for private (LAN/VPN) and public access.',
    warning: null,
    allowedStatuses: 'any',
    group: 'Admin & Access',
    visibility: 'enabled',
  }),
  async ({ effects }) => {
    const addresses = await sdk.serviceInterface
      .getOwn(effects, 'ui', (serviceInterface) => {
        const addressInfo = serviceInterface?.addressInfo
        if (!addressInfo) return [] as ConnectionAddress[]

        return addressInfo.nonLocal
          .format('hostname-info')
          .map((hostname) => ({
            url: addressInfo.toUrl(hostname),
            visibility: hostname.public ? ('public' as const) : ('private' as const),
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
        'No linkding interface addresses are available yet. Start the service and retry.',
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
      title: 'Linkding Connection Info',
      message:
        'Use private URLs for LAN/VPN users. Use public URLs after exposing Linkding with a public domain on a router or StartTunnel gateway.',
      result: {
        type: 'group' as const,
        value: [
          toAddressGroup({
            name: 'Private Access (LAN/VPN)',
            description:
              'Use these URLs on your local network or while connected to VPN.',
            addresses: privateAddresses,
            emptyMessage:
              'No private URLs are currently available for this interface.',
          }),
          toAddressGroup({
            name: 'Public Access (Internet)',
            description:
              'Use these URLs for remote/public access after DNS and forwarding are configured.',
            addresses: publicAddresses,
            emptyMessage:
              'No public URLs are currently available for this interface.',
          }),
          {
            type: 'single' as const,
            name: 'Custom Domain Setup',
            description: null,
            value:
              'To use linkding.birbs.biz (or similar), open Service Interfaces -> Web UI -> Add Domain -> Public Domain on your preferred gateway.',
            masked: false,
            copyable: false,
            qr: false,
          },
        ],
      },
    }
  },
)
