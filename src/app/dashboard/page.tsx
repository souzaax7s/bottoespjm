'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Configuracao, Producao, Profile } from '@/types/database'

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor)
}

function formatarData(data: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(data))
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [configuracao, setConfiguracao] = useState<Configuracao | null>(null)
  const [producoesHoje, setProducoesHoje] = useState<Producao[]>([])
  const [ultimosRegistros, setUltimosRegistros] = useState<Producao[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function loadData() {
      setErro('')

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const inicioHoje = new Date()
      inicioHoje.setHours(0, 0, 0, 0)

      const fimHoje = new Date()
      fimHoje.setHours(23, 59, 59, 999)

      const [
        profileResult,
        configuracaoResult,
        producoesHojeResult,
        ultimosRegistrosResult,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single(),

        supabase
          .from('configuracoes')
          .select('*')
          .eq('id', 1)
          .single(),

        supabase
          .from('producoes')
          .select('*')
          .gte('created_at', inicioHoje.toISOString())
          .lte('created_at', fimHoje.toISOString())
          .order('created_at', { ascending: false }),

        supabase
          .from('producoes')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(8),
      ])

      if (profileResult.error) {
        setErro(`Erro ao carregar perfil: ${profileResult.error.message}`)
      }

      if (configuracaoResult.error) {
        setErro(`Erro ao carregar configurações: ${configuracaoResult.error.message}`)
      }

      if (producoesHojeResult.error) {
        setErro(`Erro ao carregar produção de hoje: ${producoesHojeResult.error.message}`)
      }

      if (ultimosRegistrosResult.error) {
        setErro(`Erro ao carregar últimos registros: ${ultimosRegistrosResult.error.message}`)
      }

      setProfile(profileResult.data)
      setConfiguracao(configuracaoResult.data)
      setProducoesHoje(producoesHojeResult.data ?? [])
      setUltimosRegistros(ultimosRegistrosResult.data ?? [])
      setLoading(false)
    }

    loadData()
  }, [router, supabase])

  const totalBotoesHoje = useMemo(() => {
    return producoesHoje.reduce((total, item) => total + item.quantidade, 0)
  }, [producoesHoje])

  const valorTotalHoje = useMemo(() => {
    return producoesHoje.reduce((total, item) => total + Number(item.valor), 0)
  }, [producoesHoje])

  const totalRegistrosHoje = producoesHoje.length

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
      <header className="border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm text-zinc-400">BOTÕES PJM</p>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-500">
              {profile?.nome} • {profile?.role?.toUpperCase()}
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => router.push('/producao')}>
              Nova produção
            </Button>

            <Button variant="outline" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-8">
        {erro && (
          <div className="mb-6 rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
            {erro}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-zinc-800 bg-zinc-900 text-white">
            <CardHeader>
              <CardTitle className="text-sm text-zinc-400">
                Produção de hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalRegistrosHoje}</p>
              <p className="mt-1 text-sm text-zinc-400">
                registros lançados
              </p>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900 text-white">
            <CardHeader>
              <CardTitle className="text-sm text-zinc-400">
                Total de botões
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalBotoesHoje}</p>
              <p className="mt-1 text-sm text-zinc-400">
                botões produzidos hoje
              </p>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900 text-white">
            <CardHeader>
              <CardTitle className="text-sm text-zinc-400">
                Valor total do dia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatarMoeda(valorTotalHoje)}</p>
              <p className="mt-1 text-sm text-zinc-400">
                calculado automaticamente
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
              <p className="text-3xl font-bold">
                {formatarMoeda(Number(configuracao?.valor_botao ?? 0))}
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                valor atual configurado
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card className="border-zinc-800 bg-zinc-900 text-white">
            <CardHeader>
              <CardTitle>Últimos registros</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="overflow-hidden rounded-xl border border-zinc-800">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800">
                      <TableHead className="text-zinc-400">Data</TableHead>
                      <TableHead className="text-zinc-400">Quantidade</TableHead>
                      <TableHead className="text-zinc-400">Descrição</TableHead>
                      <TableHead className="text-right text-zinc-400">Valor</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {ultimosRegistros.length === 0 ? (
                      <TableRow className="border-zinc-800">
                        <TableCell colSpan={4} className="py-8 text-center text-zinc-500">
                          Nenhuma produção registrada ainda.
                        </TableCell>
                      </TableRow>
                    ) : (
                      ultimosRegistros.map((item) => (
                        <TableRow key={item.id} className="border-zinc-800">
                          <TableCell>{formatarData(item.created_at)}</TableCell>
                          <TableCell>{item.quantidade}</TableCell>
                          <TableCell>{item.descricao}</TableCell>
                          <TableCell className="text-right">
                            {formatarMoeda(Number(item.valor))}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900 text-white">
            <CardHeader>
              <CardTitle>Ações rápidas</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <Button className="w-full" onClick={() => router.push('/producao')}>
                Registrar produção
              </Button>

              <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard')}>
                Atualizar dashboard
              </Button>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400">
                <p className="font-medium text-white">Formato aceito:</p>
                <p className="mt-2">100 azul bb</p>
                <p>80 preto</p>
                <p>50 branco</p>
                <p>10 bege</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
