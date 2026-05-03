import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'

export const metadata: Metadata = {
  title: 'Future Moves — Content Engine',
  description: 'WhatsApp content generation for the Future Moves community',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <div className="page">{children}</div>
      </body>
    </html>
  )
}
