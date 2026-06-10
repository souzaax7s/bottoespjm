'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  BarChart3,
  ClipboardList,
  History,
  Home,
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
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    label: 'Nova Produção',
    href: '/producao',
    icon: ClipboardList,
  },
  {
    label: 'Histórico',
    href: '/historico',
    icon: History,
  },
  {
    label: 'Financeiro',
    href: '/financeiro',
    icon: BarChart3,
  },
  {
    label: 'Configurações',
    href: '/configuracoes',
    icon: Settings,
  },
  {
    label: 'Usuários',
    href: '/usuarios',
    icon: Users,
  },
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

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <aside
        className={`fixed left-0 top-0 z-40 h-screen border-r border-zinc-800 bg-zinc-950 transition-all duration-300 ${
          open ? 'w-64' : 'w-24'
        }`}
      >
        <div className="flex h-24 items-center justify-center border-b border-zinc-800">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-200 transition hover:bg-zinc-800"
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
                onClick={() => router.push(item.href)}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                  active
                    ? 'bg-white text-zinc-950'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                <Icon size={22} />

                {open && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>
      </aside>

      <section className={open ? 'pl-64 transition-all duration-300' : 'pl-24 transition-all duration-300'}>
        <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
          <div className="flex min-h-24 items-center justify-between px-8">
            <div>
              <p className="text-sm text-zinc-400">BOTÕES PJM</p>
              <h1 className="text-2xl font-bold">{title}</h1>
              {subtitle && (
                <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
              )}
            </div>

            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-red-900 text-red-300 hover:bg-red-950 hover:text-red-200"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </header>

        <div className="px-8 py-8">
          {children}
        </div>
      </section>
    </main>
  )
}
