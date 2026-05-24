import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/employees', label: 'Employees' },
  { to: '/insights',  label: 'Insights'  },
] as const

export default function Navbar() {
  return (
    <nav className="border-b border-border bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <span className="text-xl font-bold text-foreground">
          Salary Manager
        </span>
        <ul className="flex items-center gap-6">
          {navItems.map(({ to, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    'text-sm font-medium transition-colors hover:text-primary',
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  )
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
