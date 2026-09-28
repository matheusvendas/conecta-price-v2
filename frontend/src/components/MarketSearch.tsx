"use client";

import { useState } from "react";
import type { MarketProduct } from "@/types";
import { searchMarket } from "@/lib/api";

interface MarketSearchProps {
  onResults: (produtos: MarketProduct[], productName: string) => void;
}

export default function MarketSearch({ onResults }: MarketSearchProps) {
  const [nomeProduto, setNomeProduto] = useState("");
  const [lojaCliente, setLojaCliente] = useState("");
  const [localizacao, setLocalizacao] = useState("Fortaleza, Ceara"); // Mantendo o default original do app
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeProduto.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const data = await searchMarket({
        nome_produto: nomeProduto.trim(),
        loja_cliente: lojaCliente.trim(),
        localizacao: localizacao.trim(),
      });
      onResults(data.produtos, nomeProduto.trim());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro desconhecido ao buscar mercado."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
          <svg className="w-5 h-5 text-lulu-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Pesquisa de Mercado</h2>
          <p className="text-sm text-gray-500">Busque preços de concorrentes no Google Shopping</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Produto
            </label>
            <input
              type="text"
              value={nomeProduto}
              onChange={(e) => setNomeProduto(e.target.value)}
              placeholder="Ex: cadeira gamer..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-lulu-blue/20 focus:border-lulu-blue focus:bg-white outline-none placeholder:text-gray-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Excluir loja
              <span className="text-gray-400 font-normal ml-1">(opcional)</span>
            </label>
            <input
              type="text"
              value={lojaCliente}
              onChange={(e) => setLojaCliente(e.target.value)}
              placeholder="Sua loja (blacklist)"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-lulu-blue/20 focus:border-lulu-blue focus:bg-white outline-none placeholder:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Localização
            </label>
            <input
              type="text"
              value={localizacao}
              onChange={(e) => setLocalizacao(e.target.value)}
              placeholder="Ex: Fortaleza, Ceara"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-lulu-blue/20 focus:border-lulu-blue focus:bg-white outline-none placeholder:text-gray-400"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !nomeProduto.trim()}
          className="inline-flex items-center gap-2 bg-lulu-blue text-white font-medium px-6 py-3 rounded-xl hover:bg-lulu-pink transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Buscando...
            </>
          ) : (
            <>
              Buscar Concorrentes
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="mt-5 flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl">
          <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-medium text-sm">Falha na busca</p>
            <p className="text-sm mt-0.5 text-red-600">{error}</p>
          </div>
        </div>
      )}
    </section>
  );
}
