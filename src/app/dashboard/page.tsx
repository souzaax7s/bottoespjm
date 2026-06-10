'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Profile, Configuracao } from '@/types/database'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [configuracao, setConfiguracao] = useState<Configuracao | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      const { data: configData } = await supabase
        .from('configuracoes')
        .select('*')
        .eq('id', 1)
        .single()

      setProfile(profileData)
      setConfiguracao(configData)
      setLoading(false)
    }

    loadData()
  }, [router, supabase])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <p className="text-zinc-400">Carregando dashboard...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 bg-zinc-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm text-zinc-400">BOTÕES PJM</p>
            <h1 className="text-2xl font-bold">Dashboard</h1>
          </div>

          <Button variant="outline" onClick={handleLogout}>
            Sair
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-zinc-800 bg-zinc-900 text-white">
            <CardHeader>
              <CardTitle className="text-sm text-zinc-400">
                Usuário logado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">
                {profile?.nome || 'Sem nome'}
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                {profile?.email}
              </p>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900 text-white">
            <CardHeader>
              <CardTitle className="text-sm text-zinc-400">
                Cargo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold uppercase">
                {profile?.role}
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                Permissão atual no sistema
              </p>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900 text-white">
            <CardHeader>
              <CardTitle className="text-sm text-zinc-400">
                Valor por botão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">
                R$ {Number(configuracao?.valor_botao ?? 0).toFixed(2).replace('.', ',')}
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                Valor usado nos novos registros
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-lg font-semibold">Sistema conectado</h2>
          <p className="mt-2 text-zinc-400">
            O dashboard já está lendo o usuário, o perfil e a configuração diretamente do Supabase.
          </p>
        </div>
      </section>
    </main>
  )
}
