'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { parseProducoes, formatarMoeda } from '@/lib/parser/producao-parser'
import { AppShell } from '@/components/layout/app-shell'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function NovaProducaoPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [usuarioId, setUsuarioId] = useState<string | null>(null)
  const [valorBotao, setValorBotao] = useState(0.05)
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function carregarDados() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUsuarioId(user.id)

      const { data, error } = await supabase
        .from('configuracoes')
        .select('valor_botao')
        .eq('id', 1)
        .single()

      if (error) {
        setErro('Não foi possível carregar o valor do botão.')
      } else {
        setValorBotao(Number(data.valor_botao))
      }

      setLoading(false)
    }

    carregarDados()
  }, [router, supabase])

  const resultado = useMemo(() => {
    return parseProducoes(texto, valorBotao)
  }, [texto, valorBotao])

  async function salvarProducao() {
    setErro('')
    setMensagem('')

    if (!usuarioId) {
      setErro('Usuário não encontrado. Faça login novamente.')
      return
    }

    if (resultado.erros.length > 0) {
      setErro('Corrija os erros antes de salvar.')
      return
    }

    if (resultado.itens.length === 0) {
      setErro('Digite pelo menos uma produção.')
      return
    }

    setSalvando(true)

    const loteId = crypto.randomUUID()

    const registros = resultado.itens.map((item) => ({
      lote_id: loteId,
      usuario_id: usuarioId,
      quantidade: item.quantidade,
      descricao: item.descricao,
      valor_unitario: valorBotao,
      valor: item.valor,
    }))

    const { error } = await supabase.from('producoes').insert(registros)

    setSalvando(false)

    if (error) {
      setErro(`Erro ao salvar produção: ${error.message}`)
      return
    }

    setMensagem('Produção salva com sucesso.')
    setTexto('')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8F5EE] text-[#1C1917] flex items-center justify-center">
        <p className="text-[#7A6A53]">Carregando nova produção...</p>
      </main>
    )
  }

  return (
    <AppShell
      title="Nova Produção"
      subtitle="Registre a produção diária usando entrada rápida."
    >
      <section className="grid max-w-7xl gap-6 lg:grid-cols-[1fr_1fr]">
        <Card className="border-[#E7DEC8] bg-white text-[#1C1917]">
          <CardHeader>
            <CardTitle>Entrada rápida</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <Textarea
              value={texto}
              onChange={(event) => setTexto(event.target.value)}
              placeholder={'100 azul bb\n80 preto\n50 branco\n10 bege'}
              className="min-h-72 border-[#E7DEC8] bg-[#F8F5EE] text-[#1C1917]"
            />

            <div className="rounded-xl border border-[#E7DEC8] bg-[#F8F5EE] p-4 text-sm text-[#7A6A53]">
              <p>Valor atual por botão:</p>
              <p className="mt-1 text-lg font-semibold text-[#1C1917]">
                {formatarMoeda(valorBotao)}
              </p>
            </div>

            {resultado.erros.length > 0 && (
              <div className="rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
                {resultado.erros.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            )}

            {erro && (
              <p className="rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
                {erro}
              </p>
            )}

            {mensagem && (
              <p className="rounded-xl border border-emerald-900 bg-emerald-950/40 p-4 text-sm text-emerald-300">
                {mensagem}
              </p>
            )}

            <Button onClick={salvarProducao} disabled={salvando} className="w-full bg-[#B8860B] text-white hover:bg-[#9A7008]">
              {salvando ? 'Salvando...' : 'Salvar produção'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-[#E7DEC8] bg-white text-[#1C1917]">
          <CardHeader>
            <CardTitle>Prévia automática</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-[#E7DEC8] bg-[#F8F5EE] p-4">
                <p className="text-sm text-[#7A6A53]">Total de botões</p>
                <p className="mt-1 text-2xl font-bold">
                  {resultado.totalQuantidade}
                </p>
              </div>

              <div className="rounded-xl border border-[#E7DEC8] bg-[#F8F5EE] p-4">
                <p className="text-sm text-[#7A6A53]">Valor total</p>
                <p className="mt-1 text-2xl font-bold">
                  {formatarMoeda(resultado.totalValor)}
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#E7DEC8]">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#E7DEC8] hover:bg-white">
                    <TableHead className="text-[#7A6A53]">Quantidade</TableHead>
                    <TableHead className="text-[#7A6A53]">Descrição</TableHead>
                    <TableHead className="text-right text-[#7A6A53]">Valor</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {resultado.itens.length === 0 ? (
                    <TableRow className="border-[#E7DEC8]">
                      <TableCell colSpan={3} className="py-8 text-center text-[#9A8A73]">
                        Digite uma produção para ver a prévia.
                      </TableCell>
                    </TableRow>
                  ) : (
                    resultado.itens.map((item, index) => (
                      <TableRow key={`${item.descricao}-${index}`} className="border-[#E7DEC8]">
                        <TableCell>{item.quantidade}</TableCell>
                        <TableCell>{item.descricao}</TableCell>
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
      </section>
    </AppShell>
  )
}
