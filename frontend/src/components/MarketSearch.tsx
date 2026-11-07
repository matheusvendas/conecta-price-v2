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
  const [usarIa, setUsarIa] = useState(true);
  const [filtrarGrandesMarketplaces, setFiltrarGrandesMarketplaces] = useState(true);
  const [lojasBlacklist, setLojasBlacklist] = useState<string[]>([]);
  const [novaLojaBlacklist, setNovaLojaBlacklist] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddLojaBlacklist = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const nome = novaLojaBlacklist.trim();
    if (!nome) return;
    
    // Evita duplicatas (case-insensitive)
    if (!lojasBlacklist.some(l => l.toLowerCase() === nome.toLowerCase())) {
      setLojasBlacklist([...lojasBlacklist, nome]);
    }
    setNovaLojaBlacklist("");
  };

  const handleRemoveLojaBlacklist = (lojaToRemove: string) => {
    setLojasBlacklist(lojasBlacklist.filter(loja => loja !== lojaToRemove));
  };

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
        usar_ia: usarIa,
        without_blacklist: !filtrarGrandesMarketplaces,
        lojas_blacklist: lojasBlacklist,
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
              placeholder="Sua loja"
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

        {/* Toggle IA com Trade-off */}
        <div className="bg-violet-50/50 border border-violet-100 rounded-xl p-4 flex items-start gap-3 transition-colors">
          <div className="mt-0.5">
            <input
              type="checkbox"
              id="usarIa"
              checked={usarIa}
              onChange={(e) => setUsarIa(e.target.checked)}
              className="w-4 h-4 text-lulu-blue bg-white border-gray-300 rounded focus:ring-lulu-blue cursor-pointer"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="usarIa" className="text-sm font-semibold text-gray-900 cursor-pointer block mb-1">
              Filtro Inteligente (IA)
            </label>
            <p className="text-xs text-gray-600 leading-relaxed">
              {usarIa ? (
                <>
                  <span className="font-medium text-violet-700">Ativado:</span> Resultados altamente precisos, ignorando kits e variações incorretas. <br /><strong>Desvantagem:</strong> Alguns poucos produtos podem ser retornados
                </>
              ) : (
                <>
                  <span className="font-medium text-amber-600">Desativado:</span> Busca super rápida, mostrando tudo que o Google Shopping retornou. <br /><strong>Desvantagem:</strong> Pode trazer "sujeira" (kits de atacado, marcas erradas, etc).
                </>
              )}
            </p>
          </div>
        </div>

        {/* Gestão de Blacklist de Concorrentes */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-slate-200/60 flex items-center justify-center text-slate-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Controle de Blacklist de Lojas
                </h3>
                <p className="text-xs text-gray-500">
                  Filtre concorrentes indesejados para não distorcer a análise de preços
                </p>
              </div>
            </div>
          </div>

          {/* Toggle Grandes Marketplaces */}
          <div className="bg-white border border-gray-200/70 rounded-lg p-3.5 flex items-start gap-3">
            <input
              type="checkbox"
              id="filtrarGrandesMarketplaces"
              checked={filtrarGrandesMarketplaces}
              onChange={(e) => setFiltrarGrandesMarketplaces(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-lulu-blue bg-white border-gray-300 rounded focus:ring-lulu-blue cursor-pointer"
            />
            <div className="flex-1">
              <label
                htmlFor="filtrarGrandesMarketplaces"
                className="text-sm font-medium text-gray-800 cursor-pointer block"
              >
                Bloquear grandes marketplaces
                <span className="text-xs text-gray-400 font-normal ml-2">
                  (Amazon, Mercado Livre, Shopee, Magalu, Casas Bahia, etc.)
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-0.5">
                {filtrarGrandesMarketplaces ? (
                  <span className="text-emerald-700 font-medium">
                    Ativado: Grandes redes são filtradas para focar no varejo competitivo.
                  </span>
                ) : (
                  <span className="text-amber-700 font-medium">
                    Desativado (sem blacklist): Exibe ofertas de grandes marketplaces nos resultados.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Adicionar Lojas Customizadas */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Adicionar lojas específicas à blacklist
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={novaLojaBlacklist}
                onChange={(e) => setNovaLojaBlacklist(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddLojaBlacklist();
                  }
                }}
                placeholder="Ex: Drogasil, Pague Menos, Loja X..."
                className="flex-1 bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-lulu-blue/20 focus:border-lulu-blue outline-none placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={handleAddLojaBlacklist}
                disabled={!novaLojaBlacklist.trim()}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                + Bloquear
              </button>
            </div>

            {/* Chips de Lojas Bloqueadas */}
            {lojasBlacklist.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-gray-500 font-medium mr-1">
                  Lojas bloqueadas ({lojasBlacklist.length}):
                </span>
                {lojasBlacklist.map((loja) => (
                  <span
                    key={loja}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200 shadow-2xs transition-all hover:bg-red-100"
                  >
                    {loja}
                    <button
                      type="button"
                      onClick={() => handleRemoveLojaBlacklist(loja)}
                      className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-red-200 text-red-600 transition-colors"
                      title={`Remover ${loja}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => setLojasBlacklist([])}
                  className="text-[11px] text-gray-400 hover:text-red-600 underline ml-2 transition-colors"
                >
                  Limpar todas
                </button>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">
                Nenhuma loja extra adicionada à blacklist manual.
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !nomeProduto.trim()}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-lulu-blue text-white font-medium px-6 py-3 rounded-xl hover:bg-lulu-pink transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
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
