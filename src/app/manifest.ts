import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'YAARO - Shared-Living Platform',
    short_name: 'YAARO',
    description: 'Find your people. Find your place. Shared-living, roommate discovery & expense sharing.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F4EBDD',
    theme_color: '#E95D43',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
