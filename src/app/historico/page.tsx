'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AppShell } from '@/components/layout/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Producao, Profile } from '@/types/database'

type Periodo = 'hoje' | 'semana' | 'mes' | 'todos'

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
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(data))
}

function obterInicioPeriodo(periodo: Periodo) {
  const agora = new Date()

  if (periodo === 'hoje') {
    const inicio = new Date()
    inicio.setHours(0, 0, 0, 0)
    return inicio
  }

  if (periodo === 'semana') {
    const inicio = new Date()
    inicio.setDate(agora.getDate() - 7)
    inicio.setHours(0, 0, 0, 0)
    return inicio
  }

  if (periodo === 'mes') {
    const inicio = new Date()
    inicio.setDate(1)
    inicio.setHours(0, 0, 0, 0)
    return inicio
  }

  return null
}

export default function HistoricoPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [profile, setProfile] = useState<Profile | null>(null)
  const [producoes, setProducoes] = useState<Producao[]>([])
  const [periodo, setPeriodo] = useState<Periodo>('todos')
  const [pesquisa, setPesquisa] = useState('')
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [apagandoItemId, setApagandoItemId] = useState<string | null>(null)
  const [apagandoLoteId, setApagandoLoteId] = useState<string | null>(null)

  const isAdmin = profile?.role === 'admin'

  const carregarHistorico = useCallback(async () => {
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

    let query = supabase
      .from('producoes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)

    const inicioPeriodo = obterInicioPeriodo(periodo)

    if (inicioPeriodo) {
      query = query.gte('created_at', inicioPeriodo.toISOString())
    }

    const pesquisaLimpa = pesquisa.trim()

    if (pesquisaLimpa) {
      query = query.ilike('descricao', `%${pesquisaLimpa}%`)
    }

    const { data, error } = await query

    if (error) {
      setErro(`Erro ao carregar histórico: ${error.message}`)
      setProducoes([])
    } else {
      setProducoes(data ?? [])
    }

    setLoading(false)
  }, [periodo, pesquisa, router, supabase])

  useEffect(() => {
    carregarHistorico()
  }, [carregarHistorico])

  const totalBotoes = useMemo(() => {
    return producoes.reduce((total, item) => total + item.quantidade, 0)
  }, [producoes])

  const valorTotal = useMemo(() => {
    return producoes.reduce((total, item) => total + Number(item.valor), 0)
  }, [producoes])

  async function apagarItem(producao: Producao) {
    setErro('')
    setMensagem('')

    if (!isAdmin) {
      setErro('Apenas administradores podem apagar registros.')
      return
    }

    const confirmar = window.confirm(
      `Apagar apenas este item?\n\n${producao.quantidade} ${producao.descricao}\nValor: ${formatarMoeda(
        Number(producao.valor)
      )}\n\nEssa ação não apagará o lote inteiro.`
    )

    if (!confirmar) return

    setApagandoItemId(producao.id)

    const { error } = await supabase
      .from('producoes')
      .delete()
      .eq('id', producao.id)

    setApagandoItemId(null)

    if (error) {
      setErro(`Erro ao apagar item: ${error.message}`)
      return
    }

    setMensagem('Item apagado com sucesso.')
    setProducoes((listaAtual) =>
      listaAtual.filter((item) => item.id !== producao.id)
    )
  }

  async function apagarLote(producao: Producao) {
    setErro('')
    setMensagem('')

    if (!isAdmin) {
      setErro('Apenas administradores podem apagar lotes.')
      return
    }

    setApagandoLoteId(producao.lote_id)

    const { data: itensDoLote, error: loteError } = await supabase
      .from('producoes')
      .select('*')
      .eq('lote_id', producao.lote_id)

    if (loteError) {
      setApagandoLoteId(null)
      setErro(`Erro ao buscar lote: ${loteError.message}`)
      return
    }

    const itens = itensDoLote ?? []
    const totalItens = itens.length
    const totalQuantidade = itens.reduce(
      (total, item) => total + Number(item.quantidade),
      0
    )
    const totalValor = itens.reduce(
      (total, item) => total + Number(item.valor),
      0
    )

    const confirmar = window.confirm(
      `Apagar o lote inteiro?\n\nItens no lote: ${totalItens}\nTotal de botões: ${totalQuantidade}\nValor total: ${formatarMoeda(
        totalValor
      )}\n\nEssa ação apagará todos os itens lançados juntos.`
    )

    if (!confirmar) {
      setApagandoLoteId(null)
      return
    }

    const { error } = await supabase
      .from('producoes')
      .delete()
      .eq('lote_id', producao.lote_id)

    setApagandoLoteId(null)

    if (error) {
      setErro(`Erro ao apagar lote: ${error.message}`)
      return
    }

    setMensagem('Lote apagado com sucesso.')
    setProducoes((listaAtual) =>
      listaAtual.filter((item) => item.lote_id !== producao.lote_id)
    )
  }

  return (
    <AppShell
      title="Histórico"
      subtitle="Consulte, filtre e corrija registros de produção."
    >
      <section className="max-w-7xl">
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

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Card className="border-[#D9DEC8] bg-white text-[#1C1917]">
            <CardHeader>
              <CardTitle className="text-sm text-[#59624A]">
                Registros encontrados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{producoes.length}</p>
            </CardContent>
          </Card>

          <Card className="border-[#D9DEC8] bg-white text-[#1C1917]">
            <CardHeader>
              <CardTitle className="text-sm text-[#59624A]">
                Total de botões
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalBotoes}</p>
            </CardContent>
          </Card>

          <Card className="border-[#D9DEC8] bg-white text-[#1C1917]">
            <CardHeader>
              <CardTitle className="text-sm text-[#59624A]">
                Valor total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatarMoeda(valorTotal)}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-[#D9DEC8] bg-white text-[#1C1917]">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 md:grid-cols-[240px_1fr]">
              <div className="space-y-2">
                <p className="text-sm text-[#59624A]">Período</p>
                <Select
                  value={periodo}
                  onValueChange={(value) => setPeriodo(value as Periodo)}
                >
                  <SelectTrigger className="border-[#D9DEC8] bg-[#F4F6EF] text-[#1C1917]">
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hoje">Hoje</SelectItem>
                    <SelectItem value="semana">Últimos 7 dias</SelectItem>
                    <SelectItem value="mes">Este mês</SelectItem>
                    <SelectItem value="todos">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-[#59624A]">Pesquisar descrição</p>
                <Input
                  value={pesquisa}
                  onChange={(event) => setPesquisa(event.target.value)}
                  placeholder="Exemplo: azul bb, preto, branco..."
                  className="border-[#D9DEC8] bg-[#F4F6EF] text-[#1C1917]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6 border-[#D9DEC8] bg-white text-[#1C1917]">
          <CardHeader>
            <CardTitle>Registros</CardTitle>
          </CardHeader>

          <CardContent>
            {!isAdmin && (
              <div className="mb-4 rounded-xl border border-[#D9DEC8] bg-[#F4F6EF] p-4 text-sm text-[#59624A]">
                Somente administradores podem apagar itens ou lotes.
              </div>
            )}

            <div className="overflow-hidden rounded-xl border border-[#D9DEC8]">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#D9DEC8]">
                    <TableHead className="text-[#59624A]">Data</TableHead>
                    <TableHead className="text-[#59624A]">Quantidade</TableHead>
                    <TableHead className="text-[#59624A]">Descrição</TableHead>
                    <TableHead className="text-[#59624A]">Valor unitário</TableHead>
                    <TableHead className="text-right text-[#59624A]">
                      Valor
                    </TableHead>
                    {isAdmin && (
                      <TableHead className="text-right text-[#59624A]">
                        Ações
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loading ? (
                    <TableRow className="border-[#D9DEC8]">
                      <TableCell
                        colSpan={isAdmin ? 6 : 5}
                        className="py-8 text-center text-[#7B846A]"
                      >
                        Carregando histórico...
                      </TableCell>
                    </TableRow>
                  ) : producoes.length === 0 ? (
                    <TableRow className="border-[#D9DEC8]">
                      <TableCell
                        colSpan={isAdmin ? 6 : 5}
                        className="py-8 text-center text-[#7B846A]"
                      >
                        Nenhum registro encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    producoes.map((item) => (
                      <TableRow key={item.id} className="border-[#D9DEC8]">
                        <TableCell>{formatarData(item.created_at)}</TableCell>
                        <TableCell>{item.quantidade}</TableCell>
                        <TableCell>{item.descricao}</TableCell>
                        <TableCell>
                          {formatarMoeda(Number(item.valor_unitario))}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatarMoeda(Number(item.valor))}
                        </TableCell>

                        {isAdmin && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => apagarItem(item)}
                                disabled={apagandoItemId === item.id}
                                className="border-red-900 text-red-300 hover:bg-red-950 hover:text-red-200"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {apagandoItemId === item.id
                                  ? 'Apagando...'
                                  : 'Item'}
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => apagarLote(item)}
                                disabled={apagandoLoteId === item.lote_id}
                                className="border-orange-900 text-orange-300 hover:bg-orange-950 hover:text-orange-200"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {apagandoLoteId === item.lote_id
                                  ? 'Apagando...'
                                  : 'Lote'}
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  )
}