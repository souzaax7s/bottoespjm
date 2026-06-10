'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  BarChart3,
  ClipboardList,
  History,
  Home,
  ListChecks,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

type AppShellProps = {
  title: string
  subtitle?: string
  children: React.ReactNode
}

const menuItems = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'Nova Produção', href: '/producao', icon: ClipboardList },
  { label: 'Listas', href: '/listas', icon: ListChecks },
  { label: 'Histórico', href: '/historico', icon: History },
  { label: 'Financeiro', href: '/financeiro', icon: BarChart3 },
  { label: 'Configurações', href: '/configuracoes', icon: Settings },
  { label: 'Usuários', href: '/usuarios', icon: Users },
]

export function AppShell({ title, subtitle, children }: AppShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const [open, setOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function goTo(href: string) {
    router.push(href)
    setOpen(false)
  }

  return (
    <main className="min-h-screen bg-[#F4F6EF] text-[#1C1917]">
      {open && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 h-screen border-r border-[#D9DEC8] bg-white shadow-sm transition-all duration-300
        ${open ? 'translate-x-0 w-72' : '-translate-x-full w-72'}
        md:translate-x-0 ${open ? 'md:w-64' : 'md:w-24'}`}
      >
        <div className="flex h-20 items-center justify-center border-b border-[#D9DEC8] md:h-24">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#A8B48A] bg-[#F4F6EF] text-[#4B5320] transition hover:bg-[#E8EEDB]"
            aria-label="Abrir menu"
          >
            {open ? <X size={24} /> : <Menu size={28} />}
          </button>
        </div>

        <nav className="space-y-2 px-4 py-6">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href

            return (
              <button
                key={item.href}
                type="button"
                onClick={() => goTo(item.href)}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                  active
                    ? 'bg-[#4B5320] text-white shadow-sm'
                    : 'text-[#59624A] hover:bg-[#E8EEDB] hover:text-[#344016]'
                }`}
              >
                <Icon size={22} />
                {open && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>
      </aside>

      <section className="min-h-screen transition-all duration-300 md:pl-24">
        <header className="sticky top-0 z-20 border-b border-[#D9DEC8] bg-white/95 backdrop-blur">
          <div className="flex min-h-20 items-center justify-between gap-3 px-4 md:min-h-24 md:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#A8B48A] bg-[#F4F6EF] text-[#4B5320] md:hidden"
                aria-label="Abrir menu"
              >
                <Menu size={24} />
              </button>

              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#4B5320] md:text-sm">
                  BOTÕES PJM
                </p>
                <h1 className="truncate text-xl font-bold text-[#1C1917] md:text-2xl">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-1 hidden text-sm text-[#59624A] sm:block">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleLogout}
              className="shrink-0 border-[#A8B48A] bg-white text-[#4B5320] hover:bg-[#E8EEDB] hover:text-[#344016]"
            >
              <LogOut className="mr-0 h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </header>

        <div className="px-4 py-5 md:px-8 md:py-8">{children}</div>
      </section>
    </main>
  )
}