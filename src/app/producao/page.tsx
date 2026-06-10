'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ListChecks } from 'lucide-react'
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

  const [listaAtivaId, setListaAtivaId] = useState<string | null>(null)
  const [listaAtivaTitulo, setListaAtivaTitulo] = useState<string | null>(null)

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
        setErro('Não foi possível carregar as configurações de cálculo.')
      } else {
        setValorBotao(Number(data.valor_botao))
      }

      const listaId = localStorage.getItem('pjm_lista_id')
      const listaTitulo = localStorage.getItem('pjm_lista_titulo')
      const listaConteudo = localStorage.getItem('pjm_lista_conteudo')

      if (listaId && listaConteudo) {
        setListaAtivaId(listaId)
        setListaAtivaTitulo(listaTitulo || 'Lista de produção')
        setTexto(listaConteudo)
        setMensagem('Lista carregada. Revise a prévia antes de salvar a produção.')
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

    if (error) {
      setSalvando(false)
      setErro(`Erro ao salvar produção: ${error.message}`)
      return
    }

    if (listaAtivaId) {
      const { error: listaError } = await supabase
        .from('listas_producao')
        .update({
          status: 'concluida',
          completed_at: new Date().toISOString(),
        })
        .eq('id', listaAtivaId)

      if (listaError) {
        setSalvando(false)
        setErro(
          `Produção salva, mas houve erro ao concluir a lista: ${listaError.message}`
        )
        return
      }

      localStorage.removeItem('pjm_lista_id')
      localStorage.removeItem('pjm_lista_titulo')
      localStorage.removeItem('pjm_lista_conteudo')

      setListaAtivaId(null)
      setListaAtivaTitulo(null)
      setMensagem('Produção salva e lista marcada como concluída.')
    } else {
      setMensagem('Produção salva com sucesso.')
    }

    setTexto('')
    setSalvando(false)
  }

  function limparListaAtiva() {
    const confirmar = window.confirm(
      'Remover esta lista da tela de produção? Ela continuará existindo em Listas.'
    )

    if (!confirmar) return

    localStorage.removeItem('pjm_lista_id')
    localStorage.removeItem('pjm_lista_titulo')
    localStorage.removeItem('pjm_lista_conteudo')

    setListaAtivaId(null)
    setListaAtivaTitulo(null)
    setTexto('')
    setMensagem('Lista removida da tela de produção.')
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F4F6EF] text-[#1C1917]">
        <p className="text-[#59624A]">Carregando nova produção...</p>
      </main>
    )
  }

  return (
    <AppShell
      title="Nova Produção"
      subtitle="Registre manualmente ou a partir de uma lista recebida."
    >
      <section className="grid max-w-7xl gap-6 lg:grid-cols-[1fr_1fr]">
        <Card className="border-[#D9DEC8] bg-white text-[#1C1917]">
          <CardHeader>
            <CardTitle>Entrada rápida</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {listaAtivaId && (
              <div className="rounded-xl border border-[#A8B48A] bg-[#F4F6EF] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="flex items-center gap-2 font-semibold text-[#1C1917]">
                      <ListChecks className="h-4 w-4 text-[#4B5320]" />
                      Lista em produção
                    </p>
                    <p className="mt-1 text-sm text-[#59624A]">
                      {listaAtivaTitulo}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={limparListaAtiva}
                    className="border-[#A8B48A] bg-white text-[#4B5320] hover:bg-[#E8EEDB]"
                  >
                    Remover lista
                  </Button>
                </div>
              </div>
            )}

            <Textarea
              value={texto}
              onChange={(event) => setTexto(event.target.value)}
              placeholder={'Insira aqui'}
              className="min-h-72 border-[#D9DEC8] bg-[#FBFCF7] text-[#1C1917]"
            />

            <div className="rounded-xl border border-[#D9DEC8] bg-[#FBFCF7] p-4 text-sm text-[#59624A]">
              <p className="font-semibold text-[#1C1917]">Dica</p>
              <p className="mt-2">
                Revise a lista antes de salvar. O sistema só registra a produção
                quando você clicar em “Salvar produção”.
              </p>
            </div>

            {resultado.erros.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {resultado.erros.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            )}

            {erro && (
              <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {erro}
              </p>
            )}

            {mensagem && (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                {mensagem}
              </p>
            )}

            <Button
              onClick={salvarProducao}
              disabled={salvando}
              className="w-full bg-[#4B5320] text-white hover:bg-[#344016]"
            >
              {salvando
                ? 'Salvando...'
                : listaAtivaId
                  ? 'Salvar produção e concluir lista'
                  : 'Salvar produção'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-[#D9DEC8] bg-white text-[#1C1917]">
          <CardHeader>
            <CardTitle>Prévia automática</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-[#D9DEC8] bg-[#FBFCF7] p-4">
                <p className="text-sm text-[#59624A]">Total de botões</p>
                <p className="mt-1 text-2xl font-bold text-[#1C1917]">
                  {resultado.totalQuantidade}
                </p>
              </div>

              <div className="rounded-xl border border-[#D9DEC8] bg-[#FBFCF7] p-4">
                <p className="text-sm text-[#59624A]">Valor total</p>
                <p className="mt-1 text-2xl font-bold text-[#1C1917]">
                  {formatarMoeda(resultado.totalValor)}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#D9DEC8]">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#D9DEC8]">
                    <TableHead className="text-[#59624A]">Quantidade</TableHead>
                    <TableHead className="text-[#59624A]">Descrição</TableHead>
                    <TableHead className="text-right text-[#59624A]">
                      Valor
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {resultado.itens.length === 0 ? (
                    <TableRow className="border-[#D9DEC8]">
                      <TableCell
                        colSpan={3}
                        className="py-8 text-center text-[#7B846A]"
                      >
                        Digite uma produção ou inicie uma lista.
                      </TableCell>
                    </TableRow>
                  ) : (
                    resultado.itens.map((item, index) => (
                      <TableRow
                        key={`${item.descricao}-${index}`}
                        className="border-[#D9DEC8]"
                      >
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