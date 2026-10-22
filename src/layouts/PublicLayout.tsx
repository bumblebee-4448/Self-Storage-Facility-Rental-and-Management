import { useState } from 'react'
import { ArrowUpRight, Box, Menu, X } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/', label: 'Trang chủ', end: true },
  { to: '/storage-units', label: 'Tìm kho' },
  { to: '/facilities', label: 'Cơ sở' },
  { to: '/#how-it-works', label: 'Hướng dẫn', anchor: true },
]

export function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-10">
          <Link to="/" aria-label="Haven trang chủ" className="flex items-center gap-3 font-semibold tracking-tight">
            <span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground"><Box size={19} strokeWidth={1.8}/></span>
            <span className="text-lg">Haven<span className="text-[#ed8a48]">.</span></span>
          </Link>
          <nav aria-label="Điều hướng chính" className="hidden items-center gap-7 text-sm md:flex">
            {links.map(({ to, label, end, anchor }) => anchor ? <a key={to} className="text-muted-foreground transition hover:text-primary" href={to}>{label}</a> : <NavLink key={to} end={end} className={({ isActive }) => `transition hover:text-primary ${isActive ? 'font-semibold text-primary' : 'text-muted-foreground'}`} to={to}>{label}</NavLink>)}
          </nav>
          <div className="hidden items-center gap-3 sm:flex">
            <Link to="/account" className="px-3 py-2 text-sm font-medium text-foreground">Tài khoản</Link>
            <Link to="/auth/login" className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90">Đăng nhập</Link>
          </div>
          <button type="button" aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'} aria-expanded={menuOpen} aria-controls="mobile-public-menu" className="grid size-10 place-items-center rounded-full border border-border text-primary sm:hidden" onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={19}/> : <Menu size={19}/>}</button>
        </div>
        {menuOpen && <nav id="mobile-public-menu" aria-label="Điều hướng di động" className="absolute top-full right-0 left-0 space-y-1 border-b border-border bg-background px-5 py-3 shadow-lg sm:hidden">{links.map(({ to, label, end, anchor }) => anchor ? <a key={to} onClick={closeMenu} className="block rounded-xl px-4 py-3 text-sm text-muted-foreground hover:bg-muted" href={to}>{label}</a> : <NavLink key={to} end={end} onClick={closeMenu} className="block rounded-xl px-4 py-3 text-sm text-muted-foreground hover:bg-muted" to={to}>{label}</NavLink>)}<Link onClick={closeMenu} className="block rounded-xl px-4 py-3 text-sm text-muted-foreground hover:bg-muted" to="/account">Tài khoản</Link><Link onClick={closeMenu} className="block rounded-xl px-4 py-3 text-sm font-medium text-primary hover:bg-muted" to="/auth/login">Đăng nhập</Link></nav>}
      </header>
      <Outlet />
      <footer id="about" className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <Link to="/" className="font-semibold text-primary">Haven Storage</Link>
          <p>Không gian lưu trữ linh hoạt cho nhịp sống của bạn.</p>
          <Link to="/portal/login" className="transition hover:text-primary">Dành cho nhân viên <ArrowUpRight className="inline" size={14}/></Link>
        </div>
      </footer>
    </div>
  )
}
