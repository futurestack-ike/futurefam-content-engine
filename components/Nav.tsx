'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Nav() {
  const path = usePathname()
  return (
    <nav className="nav">
      <span className="nav-brand">FutureFam ✦</span>
      <div className="nav-links">
        <Link href="/dashboard" className={path === '/dashboard' ? 'active' : ''}>Generate</Link>
        <Link href="/review" className={path === '/review' ? 'active' : ''}>Review Queue</Link>
      </div>
    </nav>
  )
}
