'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Profile } from '@/types/database'

export default function ConfiguracoesPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function carregarDados() {
      setLoading(true)
      setErro('')

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        setErro(`Erro ao carregar perfil: ${error.message}`)
      } else {
        setProfile(data)
      }

      setLoading(false)
    }

    carregarDados()
  }, [router, supabase])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F4F6EF] text-[#1C1917]">
        <p className="text-[#59624A]">Carregando configurações...</p>
      </main>
    )
  }

  return (
    <AppShell
      title="Configurações"
      subtitle="Preferências gerais e informações do sistema."
    >
      <section className="max-w-5xl">
        {erro && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {erro}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card className="border-[#D9DEC8] bg-white text-[#1C1917]">
            <CardHeader>
              <CardTitle>Sistema</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 text-[#59624A]">
              <div className="rounded-xl border border-[#D9DEC8] bg-[#FBFCF7] p-4">
                <p className="font-semibold text-[#1C1917]">BOTÕES PJM</p>
                <p className="mt-2">
                  Sistema de controle de produção, listas, histórico, financeiro
                  e usuários.
                </p>
              </div>

              <div className="rounded-xl border border-[#D9DEC8] bg-[#FBFCF7] p-4">
                <p className="font-semibold text-[#1C1917]">Tema atual</p>
                <p className="mt-2">Branco com verde militar.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#D9DEC8] bg-white text-[#1C1917]">
            <CardHeader>
              <CardTitle>Perfil logado</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="rounded-xl border border-[#D9DEC8] bg-[#FBFCF7] p-4">
                <p className="text-sm text-[#59624A]">Nome</p>
                <p className="mt-1 text-xl font-bold">{profile?.nome}</p>
              </div>

              <div className="rounded-xl border border-[#D9DEC8] bg-[#FBFCF7] p-4">
                <p className="text-sm text-[#59624A]">Cargo</p>
                <p className="mt-1 text-xl font-bold uppercase">
                  {profile?.role}
                </p>
              </div>

              <div className="rounded-xl border border-[#D9DEC8] bg-[#FBFCF7] p-4">
                <p className="text-sm text-[#59624A]">Status</p>
                <p className="mt-1 text-xl font-bold">
                  {profile?.ativo ? 'Ativo' : 'Inativo'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </AppShell>
  )
}