'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCcw } from 'lucide-react'
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
import type { Producao } from '@/types/database'

type ResumoDia = {
  dataLabel: string
  dataValue: number
  registros: number
  quantidade: number
  valor: number
}

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

function inicioHoje() {
  const data = new Date()
  data.setHours(0, 0, 0, 0)
  return data
}

function inicioUltimos7Dias() {
  const data = new Date()
  data.setDate(data.getDate() - 7)
  data.setHours(0, 0, 0, 0)
  return data
}

function inicioMesAtual() {
  const data = new Date()
  data.setDate(1)
  data.setHours(0, 0, 0, 0)
  return data
}

function somarValor(lista: Producao[]) {
  return lista.reduce((total, item) => total + Number(item.valor), 0)
}

function somarQuantidade(lista: Producao[]) {
  return lista.reduce((total, item) => total + Number(item.quantidade), 0)
}

export default function FinanceiroPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [producoes, setProducoes] = useState<Producao[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  async function carregarFinanceiro() {
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
      .from('producoes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5000)

    if (error) {
      setErro(`Erro ao carregar financeiro: ${error.message}`)
      setProducoes([])
    } else {
      setProducoes(data ?? [])
    }

    setLoading(false)
  }

  useEffect(() => {
    carregarFinanceiro()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const producoesHoje = useMemo(() => {
    const inicio = inicioHoje()
    return producoes.filter((item) => new Date(item.created_at) >= inicio)
  }, [producoes])

  const producoesSemana = useMemo(() => {
    const inicio = inicioUltimos7Dias()
    return producoes.filter((item) => new Date(item.created_at) >= inicio)
  }, [producoes])

  const producoesMes = useMemo(() => {
    const inicio = inicioMesAtual()
    return producoes.filter((item) => new Date(item.created_at) >= inicio)
  }, [producoes])

  const valorHoje = useMemo(() => somarValor(producoesHoje), [producoesHoje])
  const valorSemana = useMemo(() => somarValor(producoesSemana), [producoesSemana])
  const valorMes = useMemo(() => somarValor(producoesMes), [producoesMes])
  const valorGeral = useMemo(() => somarValor(producoes), [producoes])

  const botoesGeral = useMemo(() => somarQuantidade(producoes), [producoes])
  const botoesHoje = useMemo(() => somarQuantidade(producoesHoje), [producoesHoje])
  const botoesSemana = useMemo(() => somarQuantidade(producoesSemana), [producoesSemana])
  const botoesMes = useMemo(() => somarQuantidade(producoesMes), [producoesMes])

  const mediaDiariaMes = useMemo(() => {
    const diaAtual = new Date().getDate()
    if (diaAtual <= 0) return 0
    return valorMes / diaAtual
  }, [valorMes])

  const resumoPorDia = useMemo(() => {
    const mapa = new Map<string, ResumoDia>()

    producoes.forEach((item) => {
      const data = new Date(item.created_at)
      const dataLabel = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(data)

      const existente = mapa.get(dataLabel)

      if (existente) {
        existente.registros += 1
        existente.quantidade += Number(item.quantidade)
        existente.valor += Number(item.valor)
      } else {
        const inicioDoDia = new Date(data)
        inicioDoDia.setHours(0, 0, 0, 0)

        mapa.set(dataLabel, {
          dataLabel,
          dataValue: inicioDoDia.getTime(),
          registros: 1,
          quantidade: Number(item.quantidade),
          valor: Number(item.valor),
        })
      }
    })

    return Array.from(mapa.values())
      .sort((a, b) => b.dataValue - a.dataValue)
      .slice(0, 10)
  }, [producoes])

  return (
    <AppShell
      title="Financeiro"
      subtitle="Resumo financeiro calculado automaticamente pelas produções."
    >
      <section className="max-w-7xl">
        {erro && (
          <div className="mb-6 rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
            {erro}
          </div>
        )}

        <div className="mb-6 flex justify-end">
          <Button variant="outline" onClick={carregarFinanceiro} disabled={loading}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            {loading ? 'Atualizando...' : 'Atualizar'}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-[#E7DEC8] bg-white text-[#1C1917]">
            <CardHeader>
              <CardTitle className="text-sm text-[#7A6A53]">Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatarMoeda(valorHoje)}</p>
              <p className="mt-1 text-sm text-[#7A6A53]">
                {botoesHoje} botões • {producoesHoje.length} registros
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#E7DEC8] bg-white text-[#1C1917]">
            <CardHeader>
              <CardTitle className="text-sm text-[#7A6A53]">
                Últimos 7 dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatarMoeda(valorSemana)}</p>
              <p className="mt-1 text-sm text-[#7A6A53]">
                {botoesSemana} botões • {producoesSemana.length} registros
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#E7DEC8] bg-white text-[#1C1917]">
            <CardHeader>
              <CardTitle className="text-sm text-[#7A6A53]">Este mês</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatarMoeda(valorMes)}</p>
              <p className="mt-1 text-sm text-[#7A6A53]">
                {botoesMes} botões • {producoesMes.length} registros
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#E7DEC8] bg-white text-[#1C1917]">
            <CardHeader>
              <CardTitle className="text-sm text-[#7A6A53]">Total geral</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatarMoeda(valorGeral)}</p>
              <p className="mt-1 text-sm text-[#7A6A53]">
                {botoesGeral} botões • {producoes.length} registros
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card className="border-[#E7DEC8] bg-white text-[#1C1917]">
            <CardHeader>
              <CardTitle className="text-sm text-[#7A6A53]">
                Média diária do mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatarMoeda(mediaDiariaMes)}</p>
              <p className="mt-1 text-sm text-[#7A6A53]">
                baseado no dia atual do mês
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#E7DEC8] bg-white text-[#1C1917]">
            <CardHeader>
              <CardTitle className="text-sm text-[#7A6A53]">
                Maior período ativo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {producoes.length > 0 ? 'Ativo' : 'Sem dados'}
              </p>
              <p className="mt-1 text-sm text-[#7A6A53]">
                financeiro depende das produções salvas
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#E7DEC8] bg-white text-[#1C1917]">
            <CardHeader>
              <CardTitle className="text-sm text-[#7A6A53]">
                Controle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{producoes.length}</p>
              <p className="mt-1 text-sm text-[#7A6A53]">
                lançamentos financeiros no sistema
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card className="border-[#E7DEC8] bg-white text-[#1C1917]">
            <CardHeader>
              <CardTitle>Resumo por dia</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="overflow-hidden rounded-xl border border-[#E7DEC8]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#E7DEC8]">
                      <TableHead className="text-[#7A6A53]">Data</TableHead>
                      <TableHead className="text-[#7A6A53]">Registros</TableHead>
                      <TableHead className="text-[#7A6A53]">Botões</TableHead>
                      <TableHead className="text-right text-[#7A6A53]">Valor</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {loading ? (
                      <TableRow className="border-[#E7DEC8]">
                        <TableCell colSpan={4} className="py-8 text-center text-[#9A8A73]">
                          Carregando resumo...
                        </TableCell>
                      </TableRow>
                    ) : resumoPorDia.length === 0 ? (
                      <TableRow className="border-[#E7DEC8]">
                        <TableCell colSpan={4} className="py-8 text-center text-[#9A8A73]">
                          Nenhum dado financeiro encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      resumoPorDia.map((item) => (
                        <TableRow key={item.dataLabel} className="border-[#E7DEC8]">
                          <TableCell>{item.dataLabel}</TableCell>
                          <TableCell>{item.registros}</TableCell>
                          <TableCell>{item.quantidade}</TableCell>
                          <TableCell className="text-right">
                            {formatarMoeda(item.valor)}
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
              <CardTitle>Últimos lançamentos financeiros</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="overflow-hidden rounded-xl border border-[#E7DEC8]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#E7DEC8]">
                      <TableHead className="text-[#7A6A53]">Data</TableHead>
                      <TableHead className="text-[#7A6A53]">Descrição</TableHead>
                      <TableHead className="text-right text-[#7A6A53]">Valor</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {loading ? (
                      <TableRow className="border-[#E7DEC8]">
                        <TableCell colSpan={3} className="py-8 text-center text-[#9A8A73]">
                          Carregando lançamentos...
                        </TableCell>
                      </TableRow>
                    ) : producoes.length === 0 ? (
                      <TableRow className="border-[#E7DEC8]">
                        <TableCell colSpan={3} className="py-8 text-center text-[#9A8A73]">
                          Nenhum lançamento encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      producoes.slice(0, 10).map((item) => (
                        <TableRow key={item.id} className="border-[#E7DEC8]">
                          <TableCell>{formatarData(item.created_at)}</TableCell>
                          <TableCell>
                            {item.quantidade} {item.descricao}
                          </TableCell>
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
        </div>
      </section>
    </AppShell>
  )
}