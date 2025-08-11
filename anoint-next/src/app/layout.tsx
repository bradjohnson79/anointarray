import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ANOINT Array',
  description: 'Clean authentication system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}