'use client'

import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function UsuariosPage() {
  return (
    <AppShell
      title="Usuários"
      subtitle="Gerencie operadores e administradores."
    >
      <Card className="max-w-4xl border-zinc-800 bg-zinc-900 text-white">
        <CardHeader>
          <CardTitle>Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-400">
            Em breve: cadastro, edição e desativação de usuários.
          </p>
        </CardContent>
      </Card>
    </AppShell>
  )
}
