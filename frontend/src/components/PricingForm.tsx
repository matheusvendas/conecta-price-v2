"use client";

import { useState } from "react";
import type { PricingResponse } from "@/types";
import { calculatePricing } from "@/lib/api";
import { supabase } from "@/lib/supabase";

interface PricingFormProps {
  anchor: number | null;
  productName: string;
  competitorName: string;
  onResult: (result: PricingResponse) => void;
}

export default function PricingForm({ anchor, productName, competitorName, onResult }: PricingFormProps) {
  const [custoBase, setCustoBase] = useState("50");
  const [freteFixo, setFreteFixo] = useState("15");
  const [comissaoPct, setComissaoPct] = useState("15");
  const [margemPct, setMargemPct] = useState("10");
  const [evePct, setEvePct] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Diretriz 2: Conversão de porcentagem inteira para decimal no submit
      const result = await calculatePricing({
        custo_base: Number(custoBase),
        frete_fixo: Number(freteFixo),
        taxa_comissao: Number(comissaoPct) / 100,
        margem_alvo: Number(margemPct) / 100,
        preco_concorrente: anchor,
        fator_posicionamento_eve: evePct / 100,
      });

      // 🔴 INTEGRAÇÃO COM SUPABASE: Salvar no histórico se logado!
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log("Tentando salvar no Supabase...");
        console.log("Dados:", {
          user_id: session.user.id,
          produto_alvo: productName || "Sem Produto",
          concorrente: competitorName || "Voo Cego",
          preco_concorrente: anchor,
          margem_desejada: Number(margemPct),
          preco_sugerido: result.preco_sugerido
        });

        const { data: insertData, error: insertError } = await supabase.from('historico_buscas').insert({
          user_id: session.user.id,
          produto_alvo: productName || "Sem Produto", 
          concorrente: competitorName || "Voo Cego",
          preco_concorrente: anchor,
          margem_desejada: Number(margemPct),
          preco_sugerido: result.preco_sugerido,
          estrategia: result.status, // Adicionado a coluna obrigatória que faltava
          custo_base: Number(custoBase),
          frete_fixo: Number(freteFixo),
          comissao_marketplace: Number(comissaoPct) / 100,
          fator_eve: evePct / 100
        }).select();

        if (insertError) {
          console.error("ERRO DO SUPABASE:", insertError);
          alert("Erro ao salvar no banco: " + insertError.message);
        } else {
          console.log("Salvo com sucesso!", insertData);
        }
      }

      onResult(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro desconhecido ao calcular preço."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
          <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Parâmetros Financeiros</h2>
          <p className="text-sm text-gray-500">
            Âncora:{" "}
            <span className="font-semibold text-gray-700">
              {anchor !== null ? `R$ ${anchor.toFixed(2)}` : "Voo Cego"}
            </span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Custos */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Custos
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custo Base
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">R$</span>
                <input
                  type="number"
                  value={custoBase}
                  onChange={(e) => setCustoBase(e.target.value)}
                  min={0.01}
                  step={0.01}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-lulu-blue/20 focus:border-lulu-blue focus:bg-white outline-none"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frete Fixo
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">R$</span>
                <input
                  type="number"
                  value={freteFixo}
                  onChange={(e) => setFreteFixo(e.target.value)}
                  min={0}
                  step={0.01}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-lulu-blue/20 focus:border-lulu-blue focus:bg-white outline-none"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Taxas */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Taxas e Margens
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comissão do Marketplace
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={comissaoPct}
                  onChange={(e) => setComissaoPct(e.target.value)}
                  min={0}
                  max={99}
                  step={0.5}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 pr-10 py-3 text-sm font-medium focus:ring-2 focus:ring-lulu-blue/20 focus:border-lulu-blue focus:bg-white outline-none"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">%</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Margem Alvo
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={margemPct}
                  onChange={(e) => setMargemPct(e.target.value)}
                  min={0}
                  max={99}
                  step={0.5}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 pr-10 py-3 text-sm font-medium focus:ring-2 focus:ring-lulu-blue/20 focus:border-lulu-blue focus:bg-white outline-none"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* EVE Slider */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Estratégia de Posicionamento
          </p>
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-gray-700">
                Fator EVE
              </label>
              <span
                className={`text-sm font-bold px-3 py-1 rounded-lg ${evePct < 0
                  ? "bg-red-50 text-red-700"
                  : evePct > 0
                    ? "bg-green-50 text-green-700"
                    : "bg-gray-100 text-gray-600"
                  }`}
              >
                {evePct > 0 ? "+" : ""}{evePct}%
              </span>
            </div>
            <input
              type="range"
              value={evePct}
              onChange={(e) => setEvePct(Number(e.target.value))}
              min={-10}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2 mb-4">
              <span>-10% abaixo</span>
              <span>Par com mercado</span>
              <span>+10% acima</span>
            </div>

            {/* Comentário estratégico dinâmico */}
            {(() => {
              let label: string;
              let desc: string;
              let bg: string;
              let border: string;
              let text: string;
              let icon: string;

              if (evePct <= -5) {
                label = "Giro Agressivo";
                icon = "🔥";
                desc = "Foco em volume e destruição da concorrência. Estratégia de penetração de mercado com sacrifício severo de margem. Útil para queima de estoque.";
                bg = "bg-red-50"; border = "border-red-200"; text = "text-red-700";
              } else if (evePct < 0) {
                label = "Vantagem Tática";
                icon = "🎯";
                desc = "Ideal para ganhar leilões de clique e a Buy Box do Google Shopping. Gera percepção de 'melhor preço' com impacto controlado no lucro bruto.";
                bg = "bg-amber-50"; border = "border-amber-200"; text = "text-amber-700";
              } else if (evePct === 0) {
                label = "Par com o Mercado";
                icon = "⚖️";
                desc = "Preço alinhado com a concorrência. Sem vantagem ou desvantagem de preço — a competição se dará por outros fatores (frete, reputação, confiança).";
                bg = "bg-gray-100"; border = "border-gray-300"; text = "text-gray-600";
              } else if (evePct <= 5) {
                label = "Prêmio de Serviço";
                icon = "⭐";
                desc = "Exige diferencial claro. O cliente só pagará mais caro se a sua loja oferecer frete mais rápido, melhor garantia ou maior confiabilidade que o concorrente.";
                bg = "bg-cyan-50"; border = "border-cyan-200"; text = "text-cyan-700";
              } else {
                label = "Premium / Escassez";
                icon = "💎";
                desc = "Risco altíssimo de queda de conversão. Justificável apenas se você possuir estoque exclusivo a pronta entrega ou fechar combos de produtos.";
                bg = "bg-violet-50"; border = "border-violet-200"; text = "text-violet-700";
              }

              return (
                <div className={`${bg} ${text} border ${border} rounded-lg p-3.5 transition-all duration-300`}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1">
                    {icon} {label}
                  </p>
                  <p className="text-xs leading-relaxed opacity-90">
                    {desc}
                  </p>
                </div>
              );
            })()}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 text-white font-semibold px-6 py-4 rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-base"
          style={{
            background: loading
              ? "#94A3B8"
              : "linear-gradient(135deg, #0891B2 0%, #FF6B00 100%)",
          }}
        >
          {loading ? (
            <>
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Calculando...
            </>
          ) : (
            <>
              Calcular Preço Ideal
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
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
            <p className="font-medium text-sm">Erro no cálculo</p>
            <p className="text-sm mt-0.5 text-red-600">{error}</p>
          </div>
        </div>
      )}
    </section>
  );
}
