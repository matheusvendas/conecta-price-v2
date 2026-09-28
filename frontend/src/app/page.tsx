"use client";

import { useState } from "react";
import MarketSearch from "@/components/MarketSearch";
import CompetitorSelect from "@/components/CompetitorSelect";
import PricingForm from "@/components/PricingForm";
import PricingResult from "@/components/PricingResult";
import type { MarketProduct, PricingResponse } from "@/types";

const STEPS = [
  { id: 1, label: "Pesquisa de Mercado" },
  { id: 2, label: "Seleção de Concorrentes" },
  { id: 3, label: "Parâmetros Financeiros" },
  { id: 4, label: "Recomendação" },
];

export default function Home() {
  const [produtos, setProdutos] = useState<MarketProduct[] | null>(null);
  const [anchor, setAnchor] = useState<number | null>(null);
  const [anchorConfirmed, setAnchorConfirmed] = useState(false);
  const [result, setResult] = useState<PricingResponse | null>(null);

  // Novos states para persistir metadados para o Supabase
  const [productName, setProductName] = useState<string>("");
  const [competitorName, setCompetitorName] = useState<string>("");

  // Determina o passo ativo para o indicador
  const currentStep = result
    ? 4
    : anchorConfirmed
    ? 3
    : produtos
    ? 2
    : 1;

  const handleSearchResults = (prods: MarketProduct[], name: string) => {
    setProdutos(prods);
    setProductName(name);
    setAnchor(null);
    setAnchorConfirmed(false);
    setResult(null);
  };

  const handleAnchorConfirmed = (anchorPrice: number | null, compName: string) => {
    setAnchor(anchorPrice);
    setCompetitorName(compName);
    setAnchorConfirmed(true);
    setResult(null);
  };

  const handleResult = (res: PricingResponse) => {
    setResult(res);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Análise de Precificação
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Pesquise o mercado, selecione concorrentes e obtenha o preço ideal para seu produto.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="mb-10">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center relative">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                    currentStep >= step.id
                      ? "bg-lulu-blue text-white shadow-md"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {currentStep > step.id ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </div>
                <span
                  className={`text-xs mt-2 font-medium text-center hidden sm:block ${
                    currentStep >= step.id ? "text-lulu-blue" : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div className="flex-1 mx-2 sm:mx-4">
                  <div
                    className={`h-0.5 rounded transition-all duration-500 ${
                      currentStep > step.id ? "bg-lulu-blue" : "bg-gray-200"
                    }`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="space-y-6">
        <MarketSearch onResults={handleSearchResults} />

        {produtos && (
          <CompetitorSelect
            key={productName}
            produtos={produtos}
            onConfirm={handleAnchorConfirmed}
          />
        )}

        {anchorConfirmed && (
          <PricingForm 
            anchor={anchor} 
            productName={productName}
            competitorName={competitorName}
            onResult={handleResult} 
          />
        )}

        {result && <PricingResult result={result} />}
      </div>
    </div>
  );
}
