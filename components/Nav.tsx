'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/dashboard',        label: 'Dashboard'  },
  { href: '/review',           label: 'Review'     },
  { href: '/approved',         label: 'Approved'   },
  { href: '/sources',          label: 'Bronnen'    },
  { href: '/knowledge-review', label: 'Kennis'     },
]

export default function Nav() {
  const path = usePathname()
  return (
    <nav className="fm-nav">
      <div className="fm-nav-brand">
        <span>◆</span> Future Moves
      </div>
      <div className="fm-nav-links">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`fm-nav-link ${path === href ? 'active' : ''}`}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
