"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Busca a sessão assim que a página carrega
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Escuta mudanças de estado (ex: quando o usuário faz o login ou sai)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center relative group cursor-pointer animate-slide-right">
          <img
            src="/logo.png"
            alt="Conecta Price"
            className={`h-28 w-auto object-contain urso-rugindo relative z-10 transition-all duration-500 ${user ? 'drop-shadow-[0_0_15px_rgba(8,145,178,0.5)] group-hover:scale-110 group-hover:-rotate-6' : ''
              }`}
          />
          {/* Onomatopeia Dinâmica (Muda de visual se estiver logado) */}
          <div className={`absolute left-[85%] top-[15%] opacity-0 -translate-x-12 ease-out pointer-events-none z-0 flex items-center whitespace-nowrap transition-all duration-500 ${user
              ? 'scale-50 group-hover:opacity-100 group-hover:translate-x-8 group-hover:-translate-y-4 group-hover:scale-110'
              : 'scale-50 group-hover:opacity-100 group-hover:translate-x-4 group-hover:scale-100'
            }`}>
            <span
              className={`font-black italic tracking-widest text-transparent bg-clip-text drop-shadow-xl ${user ? 'text-5xl bg-gradient-to-r from-[#0891B2] to-[#FF6B00]' : 'text-4xl bg-gradient-to-r from-[#FF6B00] to-red-600'
                }`}
              style={{ WebkitTextStroke: '1px white' }}
            >
              ROAAAR!
            </span>
            <span className="text-3xl ml-2 animate-pulse">{user ? '🚀' : '🔥'}</span>
          </div>
        </Link>

        {/* Menu Central (Mockups de Navegação Estilizados Turquesa) */}
        <div className="hidden md:flex flex-1 items-center justify-end pr-12">
          {/* Botão Histórico */}
          <Link href="/historico" className="group relative flex items-center gap-3 px-4 py-2 rounded-2xl bg-white border border-gray-100 shadow-sm hover:border-cyan-300 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-cyan-50 to-cyan-100 group-hover:from-cyan-100 group-hover:to-cyan-200 transition-colors">
              <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="font-bold text-sm text-gray-600 group-hover:text-cyan-700 transition-colors">
              Histórico de Buscas
            </span>
          </Link>
        </div>

        {/* Ações de Autenticação (Inteligentes) */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
              <span className="text-sm font-semibold text-gray-700">
                {user.email}
              </span>
              <div className="w-px h-4 bg-gray-300"></div>
              <button
                onClick={handleLogout}
                className="text-sm font-bold text-red-500 hover:text-red-700 transition-colors"
              >
                Sair
              </button>
            </div>
          ) : (
            <>
              <Link href="/login" className="text-sm font-bold text-gray-500 hover:text-[#0891B2] transition-colors">
                Login
              </Link>
              <Link href="/signup"
                className="text-sm font-bold text-white px-5 py-2.5 rounded-xl bg-cyan-600 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 hover:bg-cyan-500"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
