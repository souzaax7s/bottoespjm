'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ListChecks, Play, RefreshCcw, Send, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AppShell } from '@/components/layout/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
import type { ListaProducao, Profile } from '@/types/database'

function formatarData(data: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(data))
}

function statusLabel(status: ListaProducao['status']) {
  const labels = {
    pendente: 'Pendente',
    em_producao: 'Em produção',
    concluida: 'Concluída',
    cancelada: 'Cancelada',
  }

  return labels[status]
}

function statusClass(status: ListaProducao['status']) {
  if (status === 'pendente') return 'bg-yellow-50 text-yellow-700 border-yellow-200'
  if (status === 'em_producao') return 'bg-blue-50 text-blue-700 border-blue-200'
  if (status === 'concluida') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  return 'bg-red-50 text-red-700 border-red-200'
}

export default function ListasPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [profileAtual, setProfileAtual] = useState<Profile | null>(null)
  const [operadores, setOperadores] = useState<Profile[]>([])
  const [listas, setListas] = useState<ListaProducao[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [acaoId, setAcaoId] = useState<string | null>(null)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  const [titulo, setTitulo] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [operadorId, setOperadorId] = useState('')

  const isAdmin = profileAtual?.role === 'admin'

  async function carregarDados() {
    setLoading(true)
    setErro('')
    setMensagem('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data: meuPerfil, error: perfilError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (perfilError) {
      setErro(`Erro ao carregar perfil: ${perfilError.message}`)
      setLoading(false)
      return
    }

    setProfileAtual(meuPerfil)

    if (meuPerfil.role === 'admin') {
      const { data: operadoresData, error: operadoresError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'operador')
        .eq('ativo', true)
        .order('nome', { ascending: true })

      if (operadoresError) {
        setErro(`Erro ao carregar operadores: ${operadoresError.message}`)
      } else {
        setOperadores(operadoresData ?? [])
      }
    }

    const { data: listasData, error: listasError } = await supabase
      .from('listas_producao')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300)

    if (listasError) {
      setErro(`Erro ao carregar listas: ${listasError.message}`)
      setListas([])
    } else {
      setListas(listasData ?? [])
    }

    setLoading(false)
  }

  useEffect(() => {
    carregarDados()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function criarLista() {
    setErro('')
    setMensagem('')

    if (!profileAtual) {
      setErro('Perfil não encontrado.')
      return
    }

    if (!isAdmin) {
      setErro('Apenas administradores podem criar listas.')
      return
    }

    if (!titulo.trim()) {
      setErro('Digite um título para a lista.')
      return
    }

    if (!operadorId) {
      setErro('Selecione um operador.')
      return
    }

    if (!conteudo.trim()) {
      setErro('Digite os itens da lista.')
      return
    }

    setSalvando(true)

    const { data, error } = await supabase
      .from('listas_producao')
      .insert({
        admin_id: profileAtual.id,
        operador_id: operadorId,
        titulo: titulo.trim(),
        conteudo: conteudo.trim(),
        status: 'pendente',
      })
      .select('*')
      .single()

    setSalvando(false)

    if (error) {
      setErro(`Erro ao criar lista: ${error.message}`)
      return
    }

    setListas((listaAtual) => [data, ...listaAtual])
    setTitulo('')
    setConteudo('')
    setOperadorId('')
    setMensagem('Lista enviada para o operador com sucesso.')
  }

  async function iniciarLista(lista: ListaProducao) {
    setErro('')
    setMensagem('')
    setAcaoId(lista.id)

    const { data, error } = await supabase
      .from('listas_producao')
      .update({
        status: 'em_producao',
        started_at: new Date().toISOString(),
      })
      .eq('id', lista.id)
      .select('*')
      .single()

    setAcaoId(null)

    if (error) {
      setErro(`Erro ao iniciar lista: ${error.message}`)
      return
    }

    localStorage.setItem('pjm_lista_id', data.id)
    localStorage.setItem('pjm_lista_titulo', data.titulo)
    localStorage.setItem('pjm_lista_conteudo', data.conteudo)

    router.push('/producao')
  }

  async function cancelarLista(lista: ListaProducao) {
    setErro('')
    setMensagem('')

    if (!isAdmin) {
      setErro('Apenas administradores podem cancelar listas.')
      return
    }

    const confirmar = window.confirm(`Cancelar a lista "${lista.titulo}"?`)

    if (!confirmar) return

    setAcaoId(lista.id)

    const { data, error } = await supabase
      .from('listas_producao')
      .update({ status: 'cancelada' })
      .eq('id', lista.id)
      .select('*')
      .single()

    setAcaoId(null)

    if (error) {
      setErro(`Erro ao cancelar lista: ${error.message}`)
      return
    }

    setListas((listaAtual) =>
      listaAtual.map((item) => (item.id === lista.id ? data : item))
    )

    setMensagem('Lista cancelada.')
  }

  async function apagarLista(lista: ListaProducao) {
    setErro('')
    setMensagem('')

    if (!isAdmin) {
      setErro('Apenas administradores podem apagar listas.')
      return
    }

    const confirmar = window.confirm(
      `Apagar definitivamente a lista "${lista.titulo}"?`
    )

    if (!confirmar) return

    setAcaoId(lista.id)

    const { error } = await supabase
      .from('listas_producao')
      .delete()
      .eq('id', lista.id)

    setAcaoId(null)

    if (error) {
      setErro(`Erro ao apagar lista: ${error.message}`)
      return
    }

    setListas((listaAtual) => listaAtual.filter((item) => item.id !== lista.id))
    setMensagem('Lista apagada.')
  }

  function nomeOperador(id: string) {
    const operador = operadores.find((item) => item.id === id)
    return operador?.nome ?? 'Operador'
  }

  return (
    <AppShell
      title="Listas"
      subtitle="Admin envia listas de produção; operador recebe e inicia."
    >
      <section className="max-w-7xl">
        {erro && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {erro}
          </div>
        )}

        {mensagem && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {mensagem}
          </div>
        )}

        {isAdmin && (
          <Card className="mb-6 border-[#D9DEC8] bg-white text-[#1C1917]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-[#4B5320]" />
                Criar lista para operador
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-[1fr_280px]">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título da lista</Label>
                  <Input
                    id="titulo"
                    value={titulo}
                    onChange={(event) => setTitulo(event.target.value)}
                    placeholder="Exemplo: Produção manhã"
                    className="border-[#D9DEC8] bg-[#FBFCF7] text-[#1C1917]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Operador</Label>
                  <Select
                    value={operadorId}
                    onValueChange={(value) => setOperadorId(value ?? '')}
                  >
                    <SelectTrigger className="border-[#D9DEC8] bg-[#FBFCF7] text-[#1C1917]">
                      <SelectValue placeholder="Selecionar operador" />
                    </SelectTrigger>
                    <SelectContent>
                      {operadores.map((operador) => (
                        <SelectItem key={operador.id} value={operador.id}>
                          {operador.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="conteudo">Itens da lista</Label>
                <Textarea
                  id="conteudo"
                  value={conteudo}
                  onChange={(event) => setConteudo(event.target.value)}
                  placeholder={'100 azul bb\n80 preto\n50 branco\n10 bege'}
                  className="min-h-48 border-[#D9DEC8] bg-[#FBFCF7] text-[#1C1917]"
                />
              </div>

              <Button
                onClick={criarLista}
                disabled={salvando}
                className="w-full bg-[#4B5320] text-white hover:bg-[#344016]"
              >
                <Send className="mr-2 h-4 w-4" />
                {salvando ? 'Enviando...' : 'Enviar lista'}
              </Button>
            </CardContent>
          </Card>
        )}

        {!isAdmin && (
          <Card className="mb-6 border-[#D9DEC8] bg-white text-[#1C1917]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-[#4B5320]" />
                Minhas listas de produção
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#59624A]">
                Quando um administrador enviar uma lista para você, ela aparecerá
                aqui. Clique em “Iniciar produção” para começar.
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="border-[#D9DEC8] bg-white text-[#1C1917]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{isAdmin ? 'Listas enviadas' : 'Listas recebidas'}</CardTitle>

            <Button variant="outline" onClick={carregarDados} disabled={loading}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto rounded-xl border border-[#D9DEC8]">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#D9DEC8]">
                    <TableHead className="text-[#59624A]">Título</TableHead>
                    {isAdmin && (
                      <TableHead className="text-[#59624A]">Operador</TableHead>
                    )}
                    <TableHead className="text-[#59624A]">Status</TableHead>
                    <TableHead className="text-[#59624A]">Criada em</TableHead>
                    <TableHead className="text-right text-[#59624A]">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loading ? (
                    <TableRow className="border-[#D9DEC8]">
                      <TableCell
                        colSpan={isAdmin ? 5 : 4}
                        className="py-8 text-center text-[#7B846A]"
                      >
                        Carregando listas...
                      </TableCell>
                    </TableRow>
                  ) : listas.length === 0 ? (
                    <TableRow className="border-[#D9DEC8]">
                      <TableCell
                        colSpan={isAdmin ? 5 : 4}
                        className="py-8 text-center text-[#7B846A]"
                      >
                        Nenhuma lista encontrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    listas.map((lista) => (
                      <TableRow key={lista.id} className="border-[#D9DEC8]">
                        <TableCell>
                          <div>
                            <p className="font-semibold">{lista.titulo}</p>
                            <p className="mt-1 max-w-xl whitespace-pre-line text-sm text-[#59624A]">
                              {lista.conteudo}
                            </p>
                          </div>
                        </TableCell>

                        {isAdmin && (
                          <TableCell>{nomeOperador(lista.operador_id)}</TableCell>
                        )}

                        <TableCell>
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(
                              lista.status
                            )}`}
                          >
                            {statusLabel(lista.status)}
                          </span>
                        </TableCell>

                        <TableCell>{formatarData(lista.created_at)}</TableCell>

                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            {!isAdmin &&
                              ['pendente', 'em_producao'].includes(
                                lista.status
                              ) && (
                                <Button
                                  size="sm"
                                  onClick={() => iniciarLista(lista)}
                                  disabled={acaoId === lista.id}
                                  className="bg-[#4B5320] text-white hover:bg-[#344016]"
                                >
                                  <Play className="mr-2 h-4 w-4" />
                                  {lista.status === 'em_producao'
                                    ? 'Continuar'
                                    : 'Iniciar produção'}
                                </Button>
                              )}

                            {isAdmin && lista.status !== 'cancelada' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => cancelarLista(lista)}
                                disabled={acaoId === lista.id}
                                className="border-red-200 text-red-700 hover:bg-red-50"
                              >
                                Cancelar
                              </Button>
                            )}

                            {isAdmin && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => apagarLista(lista)}
                                disabled={acaoId === lista.id}
                                className="border-red-200 text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Apagar
                              </Button>
                            )}
                          </div>
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
