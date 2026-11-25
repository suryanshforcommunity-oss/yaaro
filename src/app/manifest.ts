import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'YAARO — Find Your People. Find Your Place.',
    short_name: 'YAARO',
    description: 'Shared-living, roommate discovery, verified spaces & household finance management.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F4EBDD',
    theme_color: '#263F32',
    orientation: 'portrait',
    scope: '/',
    categories: ['lifestyle', 'social', 'finance', 'real-estate'],
    icons: [
      {
        src: '/icons/icon-192x192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  }
}
