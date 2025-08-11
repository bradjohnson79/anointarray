'use client'

import { useEffect } from 'react'

export default function NetworkStatus() {
  useEffect(() => {
    function updateNetworkStatus() {
      if (navigator.onLine) {
        document.documentElement.classList.remove('offline')
        document.documentElement.classList.add('online')
      } else {
        document.documentElement.classList.remove('online')
        document.documentElement.classList.add('offline')
      }
    }

    // Initial status
    updateNetworkStatus()

    // Listen for changes
    window.addEventListener('online', updateNetworkStatus)
    window.addEventListener('offline', updateNetworkStatus)

    // Cleanup
    return () => {
      window.removeEventListener('online', updateNetworkStatus)
      window.removeEventListener('offline', updateNetworkStatus)
    }
  }, [])

  return null // This component doesn't render anything
}