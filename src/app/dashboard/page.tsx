'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppShell } from '@/components/layout/app-shell'
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
  const supabase = useMemo(() => createClient(), [])

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

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8F5EE] text-[#1C1917] flex items-center justify-center">
        <p className="text-[#7A6A53]">Carregando dashboard...</p>
      </main>
    )
  }

  return (
    <AppShell
      title="Dashboard"
      subtitle={`${profile?.nome ?? 'Usuário'} • ${profile?.role?.toUpperCase() ?? ''}`}
    >
      <section className="max-w-7xl">
        {erro && (
          <div className="mb-6 rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
            {erro}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-[#E7DEC8] bg-white text-[#1C1917]">
            <CardHeader>
              <CardTitle className="text-sm text-[#7A6A53]">
                Produção de hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalRegistrosHoje}</p>
              <p className="mt-1 text-sm text-[#7A6A53]">registros lançados</p>
            </CardContent>
          </Card>

          <Card className="border-[#E7DEC8] bg-white text-[#1C1917]">
            <CardHeader>
              <CardTitle className="text-sm text-[#7A6A53]">
                Total de botões
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalBotoesHoje}</p>
              <p className="mt-1 text-sm text-[#7A6A53]">botões produzidos hoje</p>
            </CardContent>
          </Card>

          <Card className="border-[#E7DEC8] bg-white text-[#1C1917]">
            <CardHeader>
              <CardTitle className="text-sm text-[#7A6A53]">
                Valor total do dia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatarMoeda(valorTotalHoje)}</p>
              <p className="mt-1 text-sm text-[#7A6A53]">calculado automaticamente</p>
            </CardContent>
          </Card>

          <Card className="border-[#E7DEC8] bg-white text-[#1C1917]">
            <CardHeader>
              <CardTitle className="text-sm text-[#7A6A53]">
                Valor por botão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {formatarMoeda(Number(configuracao?.valor_botao ?? 0))}
              </p>
              <p className="mt-1 text-sm text-[#7A6A53]">valor atual configurado</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card className="border-[#E7DEC8] bg-white text-[#1C1917]">
            <CardHeader>
              <CardTitle>Últimos registros</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="overflow-hidden rounded-xl border border-[#E7DEC8]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#E7DEC8]">
                      <TableHead className="text-[#7A6A53]">Data</TableHead>
                      <TableHead className="text-[#7A6A53]">Quantidade</TableHead>
                      <TableHead className="text-[#7A6A53]">Descrição</TableHead>
                      <TableHead className="text-right text-[#7A6A53]">Valor</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {ultimosRegistros.length === 0 ? (
                      <TableRow className="border-[#E7DEC8]">
                        <TableCell colSpan={4} className="py-8 text-center text-[#9A8A73]">
                          Nenhuma produção registrada ainda.
                        </TableCell>
                      </TableRow>
                    ) : (
                      ultimosRegistros.map((item) => (
                        <TableRow key={item.id} className="border-[#E7DEC8]">
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

          <Card className="border-[#E7DEC8] bg-white text-[#1C1917]">
            <CardHeader>
              <CardTitle>Ações rápidas</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <Button className="w-full bg-[#B8860B] text-white hover:bg-[#9A7008]" onClick={() => router.push('/producao')}>
                Registrar produção
              </Button>

              <Button variant="outline" className="w-full bg-[#B8860B] text-white hover:bg-[#9A7008]" onClick={() => router.push('/historico')}>
                Ver histórico
              </Button>

              <div className="rounded-xl border border-[#E7DEC8] bg-[#F8F5EE] p-4 text-sm text-[#7A6A53]">
                <p className="font-medium text-[#1C1917]">Formato aceito:</p>
                <p className="mt-2">100 azul bb</p>
                <p>80 preto</p>
                <p>50 branco</p>
                <p>10 bege</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </AppShell>
  )
}