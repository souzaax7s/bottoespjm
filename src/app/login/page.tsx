'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErro('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setErro('Email ou senha inválidos.')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F4F6EF] px-4 text-[#1C1917]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#F0DFB8,transparent_35%)]" />

      <Card className="relative w-full max-w-md border-[#D9DEC8] bg-white text-[#1C1917] shadow-2xl">
        <CardHeader className="space-y-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#A8B48A] bg-white text-xl font-black text-[#1C1917] shadow-sm">
            PJM
          </div>

          <CardTitle className="text-center text-2xl font-bold">
            BOTÕES PJM
          </CardTitle>

          <CardDescription className="text-center text-[#59624A]">
            Entre para controlar produção, histórico e financeiro.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="border-[#D9DEC8] bg-[#FBFCF7] text-[#1C1917]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="border-[#D9DEC8] bg-[#FBFCF7] text-[#1C1917]"
              />
            </div>

            {erro && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {erro}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4B5320] text-white hover:bg-[#344016]"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}