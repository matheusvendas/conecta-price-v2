import type { PricingResponse } from "@/types";

interface PricingResultProps {
  result: PricingResponse;
}

const STATUS_CONFIG: Record<
  string,
  {
    bg: string;
    border: string;
    text: string;
    badge: string;
    badgeText: string;
    icon: string;
    label: string;
  }
> = {
  INVIÁVEL: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    badge: "bg-red-100",
    badgeText: "text-red-700",
    icon: "🚫",
    label: "Operação Inviável",
  },
  "COMPETITIVO/SUB-ÓTIMO": {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-800",
    badge: "bg-amber-100",
    badgeText: "text-amber-700",
    icon: "⚡",
    label: "Competitivo",
  },
  ÓTIMO: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-800",
    badge: "bg-emerald-100",
    badgeText: "text-emerald-700",
    icon: "✅",
    label: "Ótimo",
  },
  VOO_CEGO: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
    badge: "bg-blue-100",
    badgeText: "text-blue-700",
    icon: "🛩️",
    label: "Voo Cego",
  },
};

export default function PricingResult({ result }: PricingResultProps) {
  const config = STATUS_CONFIG[result.status] || STATUS_CONFIG["VOO_CEGO"];

  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
          <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900">Recomendação</h2>
        </div>
        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${config.badge} ${config.badgeText}`}>
          {config.icon} {config.label}
        </span>
      </div>

      {/* Status Alert */}
      <div className={`${config.bg} ${config.text} border ${config.border} p-4 rounded-xl mb-8`}>
        <p className="text-sm font-medium">{result.mensagem}</p>
      </div>

      {/* Main KPI */}
      <div className="text-center py-8 mb-8 rounded-2xl relative overflow-hidden" style={{
        background: "linear-gradient(135deg, #0891B2 0%, #FF6B00 100%)",
      }}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />
        <p className="text-sm text-white/80 uppercase tracking-widest font-medium relative z-10">
          Preço de Venda Sugerido
        </p>
        <p className="text-5xl sm:text-6xl font-black text-white mt-3 relative z-10">
          R$ {result.preco_sugerido.toFixed(2)}
        </p>
        <div className="mt-4 relative z-10">
          {result.viavel ? (
            <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur text-white text-sm px-4 py-1.5 rounded-full font-medium">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Operação viável
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur text-white text-sm px-4 py-1.5 rounded-full font-medium">
              <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
              Risco de prejuízo
            </span>
          )}
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Piso
            </p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            R$ {result.piso.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Break-even</p>
        </div>

        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Teto
            </p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {result.teto !== null ? `R$ ${result.teto.toFixed(2)}` : "—"}
          </p>
          <p className="text-xs text-gray-500 mt-1">Concorrente + EVE</p>
        </div>

        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Margem Alvo
            </p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            R$ {result.preco_com_margem_alvo.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Preço ideal p/ meta</p>
        </div>
      </div>
    </section>
  );
}
