export type AppRole = 'admin' | 'operador'

export type Profile = {
  id: string
  nome: string
  email: string
  role: AppRole
  ativo: boolean
  created_at: string
}

export type Configuracao = {
  id: number
  valor_botao: number
  updated_at: string
}

export type Producao = {
  id: string
  lote_id: string
  usuario_id: string
  quantidade: number
  descricao: string
  valor_unitario: number
  valor: number
  created_at: string
}
export type ListaProducao = {
  id: string
  admin_id: string
  operador_id: string
  titulo: string
  conteudo: string
  status: 'pendente' | 'em_producao' | 'concluida' | 'cancelada'
  created_at: string
  started_at: string | null
  completed_at: string | null
}