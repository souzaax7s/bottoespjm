'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, UserCheck, UserX } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AppShell } from '@/components/layout/app-shell'
import { Button } from '@/components/ui/button'
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
import type { AppRole, Profile } from '@/types/database'

function formatarData(data: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(data))
}

export default function UsuariosPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [profileAtual, setProfileAtual] = useState<Profile | null>(null)
  const [usuarios, setUsuarios] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [salvandoId, setSalvandoId] = useState<string | null>(null)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  const isAdmin = profileAtual?.role === 'admin'

  async function carregarUsuarios() {
    setLoading(true)
    setErro('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data: meuPerfil, error: meuPerfilError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (meuPerfilError) {
      setErro(`Erro ao carregar seu perfil: ${meuPerfilError.message}`)
      setLoading(false)
      return
    }

    setProfileAtual(meuPerfil)

    if (meuPerfil.role !== 'admin') {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setErro(`Erro ao carregar usuários: ${error.message}`)
      setUsuarios([])
    } else {
      setUsuarios(data ?? [])
    }

    setLoading(false)
  }

  useEffect(() => {
    carregarUsuarios()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function alterarCargo(usuario: Profile, novoCargo: AppRole) {
    setErro('')
    setMensagem('')

    if (!isAdmin) {
      setErro('Apenas administradores podem alterar cargos.')
      return
    }

    const confirmar = window.confirm(
      `Alterar cargo de ${usuario.nome} para ${novoCargo.toUpperCase()}?`
    )

    if (!confirmar) return

    setSalvandoId(usuario.id)

    const { data, error } = await supabase
      .from('profiles')
      .update({ role: novoCargo })
      .eq('id', usuario.id)
      .select('*')
      .single()

    setSalvandoId(null)

    if (error) {
      setErro(`Erro ao alterar cargo: ${error.message}`)
      return
    }

    setUsuarios((listaAtual) =>
      listaAtual.map((item) => (item.id === usuario.id ? data : item))
    )

    if (profileAtual?.id === usuario.id) {
      setProfileAtual(data)
    }

    setMensagem('Cargo atualizado com sucesso.')
  }

  async function alternarStatus(usuario: Profile) {
    setErro('')
    setMensagem('')

    if (!isAdmin) {
      setErro('Apenas administradores podem alterar status.')
      return
    }

    if (profileAtual?.id === usuario.id && usuario.ativo) {
      setErro('Você não pode desativar o próprio usuário logado.')
      return
    }

    const novoStatus = !usuario.ativo

    const confirmar = window.confirm(
      `${novoStatus ? 'Ativar' : 'Desativar'} o usuário ${usuario.nome}?`
    )

    if (!confirmar) return

    setSalvandoId(usuario.id)

    const { data, error } = await supabase
      .from('profiles')
      .update({ ativo: novoStatus })
      .eq('id', usuario.id)
      .select('*')
      .single()

    setSalvandoId(null)

    if (error) {
      setErro(`Erro ao alterar status: ${error.message}`)
      return
    }

    setUsuarios((listaAtual) =>
      listaAtual.map((item) => (item.id === usuario.id ? data : item))
    )

    setMensagem('Status atualizado com sucesso.')
  }

  const totalAdmins = usuarios.filter((usuario) => usuario.role === 'admin').length
  const totalOperadores = usuarios.filter((usuario) => usuario.role === 'operador').length
  const totalAtivos = usuarios.filter((usuario) => usuario.ativo).length

  return (
    <AppShell
      title="Usuários"
      subtitle="Gerencie operadores e administradores do sistema."
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

        {!isAdmin && !loading && (
          <Card className="max-w-3xl border-[#E7DEC8] bg-white text-[#1C1917]">
            <CardHeader>
              <CardTitle>Acesso restrito</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#7A6A53]">
                Apenas administradores podem gerenciar usuários.
              </p>
            </CardContent>
          </Card>
        )}

        {isAdmin && (
          <>
            <div className="mb-6 grid gap-4 md:grid-cols-4">
              <Card className="border-[#E7DEC8] bg-white text-[#1C1917]">
                <CardHeader>
                  <CardTitle className="text-sm text-[#7A6A53]">
                    Total de usuários
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{usuarios.length}</p>
                </CardContent>
              </Card>

              <Card className="border-[#E7DEC8] bg-white text-[#1C1917]">
                <CardHeader>
                  <CardTitle className="text-sm text-[#7A6A53]">
                    Ativos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{totalAtivos}</p>
                </CardContent>
              </Card>

              <Card className="border-[#E7DEC8] bg-white text-[#1C1917]">
                <CardHeader>
                  <CardTitle className="text-sm text-[#7A6A53]">
                    Admins
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{totalAdmins}</p>
                </CardContent>
              </Card>

              <Card className="border-[#E7DEC8] bg-white text-[#1C1917]">
                <CardHeader>
                  <CardTitle className="text-sm text-[#7A6A53]">
                    Operadores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{totalOperadores}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-[#E7DEC8] bg-white text-[#1C1917]">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Lista de usuários</CardTitle>

                <Button variant="outline" onClick={carregarUsuarios} disabled={loading}>
                  Atualizar
                </Button>
              </CardHeader>

              <CardContent>
                <div className="mb-4 rounded-xl border border-[#E7DEC8] bg-[#F8F5EE] p-4 text-sm text-[#7A6A53]">
                  Novos usuários devem ser criados primeiro no Supabase Authentication.
                  Depois eles aparecem aqui automaticamente como OPERADOR.
                </div>

                <div className="overflow-hidden rounded-xl border border-[#E7DEC8]">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#E7DEC8]">
                        <TableHead className="text-[#7A6A53]">Nome</TableHead>
                        <TableHead className="text-[#7A6A53]">Email</TableHead>
                        <TableHead className="text-[#7A6A53]">Cargo</TableHead>
                        <TableHead className="text-[#7A6A53]">Status</TableHead>
                        <TableHead className="text-[#7A6A53]">Criado em</TableHead>
                        <TableHead className="text-right text-[#7A6A53]">
                          Ações
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {loading ? (
                        <TableRow className="border-[#E7DEC8]">
                          <TableCell colSpan={6} className="py-8 text-center text-[#9A8A73]">
                            Carregando usuários...
                          </TableCell>
                        </TableRow>
                      ) : usuarios.length === 0 ? (
                        <TableRow className="border-[#E7DEC8]">
                          <TableCell colSpan={6} className="py-8 text-center text-[#9A8A73]">
                            Nenhum usuário encontrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        usuarios.map((usuario) => (
                          <TableRow key={usuario.id} className="border-[#E7DEC8]">
                            <TableCell className="font-medium">
                              {usuario.nome}
                              {profileAtual?.id === usuario.id && (
                                <span className="ml-2 rounded-full bg-white px-2 py-1 text-xs text-zinc-950">
                                  você
                                </span>
                              )}
                            </TableCell>

                            <TableCell>{usuario.email}</TableCell>

                            <TableCell>
                              <Select
                                value={usuario.role}
                                onValueChange={(value) =>
                                  alterarCargo(usuario, value as AppRole)
                                }
                                disabled={salvandoId === usuario.id}
                              >
                                <SelectTrigger className="w-36 border-[#E7DEC8] bg-[#F8F5EE] text-[#1C1917]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">ADMIN</SelectItem>
                                  <SelectItem value="operador">OPERADOR</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>

                            <TableCell>
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                  usuario.ativo
                                    ? 'bg-emerald-950 text-emerald-300'
                                    : 'bg-red-950 text-red-300'
                                }`}
                              >
                                {usuario.ativo ? 'Ativo' : 'Inativo'}
                              </span>
                            </TableCell>

                            <TableCell>{formatarData(usuario.created_at)}</TableCell>

                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => alternarStatus(usuario)}
                                disabled={salvandoId === usuario.id}
                                className={
                                  usuario.ativo
                                    ? 'border-red-900 text-red-300 hover:bg-red-950 hover:text-red-200'
                                    : 'border-emerald-900 text-emerald-300 hover:bg-emerald-950 hover:text-emerald-200'
                                }
                              >
                                {usuario.ativo ? (
                                  <>
                                    <UserX className="mr-2 h-4 w-4" />
                                    Desativar
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Ativar
                                  </>
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {isAdmin && (
          <Card className="mt-6 max-w-4xl border-[#E7DEC8] bg-white text-[#1C1917]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Segurança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-[#7A6A53]">
              <p>
                A tela respeita as políticas RLS do Supabase. Apenas ADMIN pode
                alterar cargo ou status.
              </p>
              <p>
                Desativar um perfil impede que ele seja tratado como ativo nas
                verificações administrativas.
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </AppShell>
  )
}