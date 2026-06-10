'use client'

import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ConfiguracoesPage() {
  return (
    <AppShell
      title="Configurações"
      subtitle="Gerencie regras gerais do BOTÕES PJM."
    >
      <Card className="max-w-4xl border-zinc-800 bg-zinc-900 text-white">
        <CardHeader>
          <CardTitle>Configurações</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-400">
            Em breve: alteração do valor unitário do botão.
          </p>
        </CardContent>
      </Card>
    </AppShell>
  )
}
