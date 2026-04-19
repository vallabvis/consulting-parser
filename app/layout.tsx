import type { Metadata } from 'next'
import { Inter, EB_Garamond } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const garamond = EB_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-garamond',
})

export const metadata: Metadata = {
  title: 'Wisco Consulting Hub',
  description:
    'Your launchpad to consulting — opportunities, alumni, and prep resources for UW-Madison students.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${garamond.variable} font-sans`}>{children}</body>
    </html>
  )
}
