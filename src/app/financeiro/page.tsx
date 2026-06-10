'use client'

import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function FinanceiroPage() {
  return (
    <AppShell
      title="Financeiro"
      subtitle="Resumo financeiro das produções registradas."
    >
      <Card className="max-w-4xl border-zinc-800 bg-zinc-900 text-white">
        <CardHeader>
          <CardTitle>Financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-400">
            Módulo financeiro será implementado na próxima etapa.
          </p>
        </CardContent>
      </Card>
    </AppShell>
  )
}
