"use client";

import { useState, useMemo, useEffect } from "react";
import type { MarketProduct } from "@/types";

interface CompetitorSelectProps {
  produtos: MarketProduct[];
  onConfirm: (anchor: number | null, compName: string) => void;
}

export default function CompetitorSelect({
  produtos,
  onConfirm,
}: CompetitorSelectProps) {
  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(new Set());

  // Reseta a seleção sempre que uma nova lista de produtos chegar
  useEffect(() => {
    setSelectedIndexes(new Set());
  }, [produtos]);

  const toggleSelection = (index: number) => {
    setSelectedIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIndexes.size === produtos.length) {
      setSelectedIndexes(new Set());
    } else {
      setSelectedIndexes(new Set(produtos.map((_, i) => i)));
    }
  };

  // Diretriz 3: Proteção contra divisão por zero / NaN e índices fora de alcance.
  const anchor: number | null = useMemo(() => {
    const validIndexes = Array.from(selectedIndexes).filter(
      (idx) => produtos[idx] !== undefined
    );
    if (validIndexes.length === 0) return null;
    const total = validIndexes.reduce(
      (sum, idx) => sum + produtos[idx].price,
      0
    );
    return Math.round((total / validIndexes.length) * 100) / 100;
  }, [selectedIndexes, produtos]);

  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Selecione os Concorrentes</h2>
            <p className="text-sm text-gray-500">Escolha quais ofertas são relevantes para a análise</p>
          </div>
        </div>
        <button
          onClick={selectAll}
          className="text-xs font-medium text-lulu-blue hover:text-lulu-pink transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50"
        >
          {selectedIndexes.size === produtos.length ? "Limpar tudo" : "Selecionar tudo"}
        </button>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {produtos.map((produto, index) => {
          const isSelected = selectedIndexes.has(index);
          return (
            <div
              key={index}
              onClick={() => toggleSelection(index)}
              className={`group flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${isSelected
                ? "border-lulu-blue bg-blue-50/50 shadow-sm"
                : "border-transparent bg-gray-50 hover:bg-gray-100 hover:border-gray-200"
                }`}
            >
              {/* Checkbox */}
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${isSelected
                  ? "bg-lulu-blue border-lulu-blue"
                  : "border-gray-300 group-hover:border-gray-400"
                  }`}
              >
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>

              {/* Image */}
              {produto.image_url && (
                <img
                  src={produto.image_url}
                  alt=""
                  className="w-12 h-12 object-contain rounded-lg bg-white border border-gray-100 p-1"
                />
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p
                  className="font-medium text-sm text-gray-900 truncate cursor-help"
                  title={produto.title}
                >
                  {produto.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{produto.source}</p>
              </div>

              {/* Price */}
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-gray-900">
                  R$ {produto.price.toFixed(2)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Anchor Summary Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl border border-gray-200">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Âncora de Mercado
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-bold text-gray-900">
              {anchor !== null ? `R$ ${anchor.toFixed(2)}` : "—"}
            </p>
            {anchor === null ? (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                Voo Cego
              </span>
            ) : (
              <span className="text-xs text-gray-400">
                média de {selectedIndexes.size} concorrente{selectedIndexes.size !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => {
            let compName = "Voo Cego";
            if (selectedIndexes.size === 1) {
              const idx = Array.from(selectedIndexes)[0];
              compName = produtos[idx].source;
            } else if (selectedIndexes.size > 1) {
              compName = `Média de ${selectedIndexes.size} concorrentes`;
            }
            onConfirm(anchor, compName);
          }}
          className="inline-flex items-center gap-2 bg-lulu-blue text-white font-medium px-6 py-3 rounded-xl hover:bg-lulu-pink transition-all duration-200 shadow-sm hover:shadow-md"
        >
          Confirmar e Avançar
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </section>
  );
}
