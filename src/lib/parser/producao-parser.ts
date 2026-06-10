export type ParsedProducao = {
  quantidade: number
  descricao: string
  valor: number
}

export type ParserResult = {
  itens: ParsedProducao[]
  erros: string[]
  totalQuantidade: number
  totalValor: number
}

export function parseProducoes(texto: string, valorUnitario: number): ParserResult {
  const linhas = texto
    .split('\n')
    .map((linha) => linha.trim())
    .filter(Boolean)

  const itens: ParsedProducao[] = []
  const erros: string[] = []

  linhas.forEach((linha, index) => {
    const match = linha.match(/^(\d+)\s+(.+)$/)

    if (!match) {
      erros.push(`Linha ${index + 1}: use o formato "100 azul bb".`)
      return
    }

    const quantidade = Number(match[1])
    const descricao = match[2].replace(/\s+/g, ' ').trim().toLowerCase()

    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      erros.push(`Linha ${index + 1}: quantidade inválida.`)
      return
    }

    if (!descricao) {
      erros.push(`Linha ${index + 1}: descrição obrigatória.`)
      return
    }

    itens.push({
      quantidade,
      descricao,
      valor: quantidade * valorUnitario,
    })
  })

  const totalQuantidade = itens.reduce((total, item) => total + item.quantidade, 0)
  const totalValor = itens.reduce((total, item) => total + item.valor, 0)

  return {
    itens,
    erros,
    totalQuantidade,
    totalValor,
  }
}

export function formatarMoeda(valor: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor)
}
