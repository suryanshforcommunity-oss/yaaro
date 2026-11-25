import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'YAARO — Find your people. Find your place.',
  description:
    'YAARO is a shared-living platform combining roommate discovery, compatibility matching, room listings, shared expenses, and community.',
  applicationName: 'YAARO',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'YAARO',
  },
}

export const viewport: Viewport = {
  themeColor: '#F4EBDD',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Dancing+Script:wght@500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,600;1,700;1,900&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-cream text-deepgreen antialiased selection:bg-tomato selection:text-white font-serif">
        {children}
      </body>
    </html>
  )
}
