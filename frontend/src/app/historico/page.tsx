"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Historico {
  id: string;
  produto_alvo: string;
  concorrente: string | null;
  preco_concorrente: number | null;
  margem_desejada: number;
  preco_sugerido: number;
  estrategia: string;
  criado_em: string;
}

export default function HistoricoPage() {
  const [buscas, setBuscas] = useState<Historico[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function loadHistorico() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setLoading(false);
        setIsAuthenticated(false);
        return;
      }

      setIsAuthenticated(true);

      const { data, error } = await supabase
        .from('historico_buscas')
        .select('*')
        .eq('user_id', session.user.id)
        .order('criado_em', { ascending: false });

      if (error) {
        console.error("Erro ao buscar histórico:", error);
      } else {
        setBuscas(data || []);
      }
      setLoading(false);
    }

    loadHistorico();
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "ÓTIMO":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "COMPETITIVO/SUB-ÓTIMO":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "INVIÁVEL":
        return "bg-red-100 text-red-800 border-red-200";
      default: // VOO CEGO
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-cyan-200 border-t-cyan-600 rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h2>
        <p className="text-gray-500 max-w-md mb-8">
          Você precisa estar logado para ver o seu histórico de simulações.
        </p>
        <Link href="/login" className="px-6 py-3 bg-cyan-600 text-white font-semibold rounded-xl hover:bg-cyan-700 transition-colors">
          Fazer Login
        </Link>
      </div>
    );
  }

  if (buscas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in">
        <div className="w-24 h-24 bg-cyan-50 rounded-full flex items-center justify-center mb-6 border border-cyan-100">
          <svg className="w-12 h-12 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Ainda não há buscas salvas na sua conta</h2>
        <p className="text-gray-500 max-w-md mb-8">
          Você ainda não salvou nenhuma simulação de precificação. Faça uma nova busca de mercado e calcule o preço ideal para preencher o seu histórico.
        </p>
        <Link href="/" className="px-6 py-3 bg-cyan-600 text-white font-semibold rounded-xl hover:bg-cyan-700 transition-colors shadow-sm hover:shadow-md">
          Realizar Nova Busca
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Histórico de Buscas</h1>
          <p className="text-sm text-gray-500 mt-1">Veja suas últimas simulações e cálculos de preço.</p>
        </div>
        <Link href="/" className="px-5 py-2.5 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700 transition-colors text-sm shadow-sm">
          + Nova Simulação
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
              <tr>
                <th className="px-6 py-4 font-semibold">Data</th>
                <th className="px-6 py-4 font-semibold">Produto</th>
                <th className="px-6 py-4 font-semibold">Concorrente Base</th>
                <th className="px-6 py-4 font-semibold">Preço Âncora</th>
                <th className="px-6 py-4 font-semibold">Seu Preço Ideal</th>
                <th className="px-6 py-4 font-semibold">Estratégia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {buscas.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(item.criado_em).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 max-w-[200px] truncate" title={item.produto_alvo}>
                    {item.produto_alvo}
                  </td>
                  <td className="px-6 py-4 text-gray-600 max-w-[150px] truncate" title={item.concorrente || "N/A"}>
                    {item.concorrente || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {item.preco_concorrente ? `R$ ${item.preco_concorrente.toFixed(2)}` : "-"}
                  </td>
                  <td className="px-6 py-4 font-bold text-cyan-700">
                    R$ {item.preco_sugerido.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(item.estrategia)}`}>
                      {item.estrategia}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
