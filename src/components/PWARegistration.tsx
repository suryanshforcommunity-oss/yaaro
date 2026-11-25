'use client'

import { useEffect } from 'react'

export function PWARegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('YAARO PWA Service Worker registered successfully:', registration.scope)
          })
          .catch((error) => {
            console.error('YAARO PWA Service Worker registration failed:', error)
          })
      })
    }
  }, [])

  return null
}
