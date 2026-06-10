export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F4F6EF] px-6 text-[#1C1917]">
      <div className="max-w-md rounded-3xl border border-[#D9DEC8] bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#A8B48A] bg-white text-xl font-black">
          PJM
        </div>

        <h1 className="text-2xl font-bold">Você está offline</h1>

        <p className="mt-3 text-[#59624A]">
          O BOTÕES PJM está instalado, mas precisa de internet para sincronizar login,
          produções e dados do Supabase.
        </p>
      </div>
    </main>
  )
}
