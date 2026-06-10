'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AppShell } from '@/components/layout/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import type { Configuracao, Profile } from '@/types/database'

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor)
}

export default function ConfiguracoesPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [profile, setProfile] = useState<Profile | null>(null)
  const [configuracao, setConfiguracao] = useState<Configuracao | null>(null)
  const [valorBotao, setValorBotao] = useState('')
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  const isAdmin = profile?.role === 'admin'

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

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        setErro(`Erro ao carregar perfil: ${profileError.message}`)
      } else {
        setProfile(profileData)
      }

      const { data: configData, error: configError } = await supabase
        .from('configuracoes')
        .select('*')
        .eq('id', 1)
        .single()

      if (configError) {
        setErro(`Erro ao carregar configurações: ${configError.message}`)
      } else {
        setConfiguracao(configData)
        setValorBotao(String(Number(configData.valor_botao).toFixed(2)).replace('.', ','))
      }

      setLoading(false)
    }

    carregarDados()
  }, [router, supabase])

  async function salvarConfiguracao() {
    setErro('')
    setMensagem('')

    if (!isAdmin) {
      setErro('Apenas administradores podem alterar configurações.')
      return
    }

    const valorNormalizado = valorBotao.replace(',', '.').trim()
    const novoValor = Number(valorNormalizado)

    if (!Number.isFinite(novoValor) || novoValor <= 0) {
      setErro('Digite um valor válido maior que zero.')
      return
    }

    setSalvando(true)

    const { data, error } = await supabase
      .from('configuracoes')
      .update({
        valor_botao: novoValor,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1)
      .select('*')
      .single()

    setSalvando(false)

    if (error) {
      setErro(`Erro ao salvar configuração: ${error.message}`)
      return
    }

    setConfiguracao(data)
    setValorBotao(String(Number(data.valor_botao).toFixed(2)).replace('.', ','))
    setMensagem('Valor do botão atualizado com sucesso.')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <p className="text-zinc-400">Carregando configurações...</p>
      </main>
    )
  }

  return (
    <AppShell
      title="Configurações"
      subtitle="Gerencie regras gerais do BOTÕES PJM."
    >
      <section className="max-w-5xl">
        {erro && (
          <div className="mb-6 rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
            {erro}
          </div>
        )}

        {mensagem && (
          <div className="mb-6 rounded-xl border border-emerald-900 bg-emerald-950/40 p-4 text-sm text-emerald-300">
            {mensagem}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card className="border-zinc-800 bg-zinc-900 text-white">
            <CardHeader>
              <CardTitle>Valor unitário do botão</CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="valorBotao">Valor por botão</Label>
                <Input
                  id="valorBotao"
                  value={valorBotao}
                  onChange={(event) => setValorBotao(event.target.value)}
                  placeholder="0,05"
                  disabled={!isAdmin || salvando}
                  className="border-zinc-800 bg-zinc-950 text-white"
                />
                <p className="text-sm text-zinc-400">
                  Use vírgula ou ponto. Exemplo: 0,05 ou 0.05.
                </p>
              </div>

              {!isAdmin && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400">
                  Seu perfil é OPERADOR. Você pode consultar esta tela, mas não pode alterar o valor.
                </div>
              )}

              <Button
                onClick={salvarConfiguracao}
                disabled={!isAdmin || salvando}
                className="w-full"
              >
                <Save className="mr-2 h-4 w-4" />
                {salvando ? 'Salvando...' : 'Salvar novo valor'}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900 text-white">
            <CardHeader>
              <CardTitle>Resumo atual</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-sm text-zinc-400">Valor atual</p>
                <p className="mt-1 text-3xl font-bold">
                  {formatarMoeda(Number(configuracao?.valor_botao ?? 0))}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-sm text-zinc-400">Perfil logado</p>
                <p className="mt-1 text-xl font-bold uppercase">
                  {profile?.role}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400">
                Alterar o valor aqui afeta apenas os próximos registros. Produções antigas permanecem com o valor original salvo no momento do lançamento.
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </AppShell>
  )
}