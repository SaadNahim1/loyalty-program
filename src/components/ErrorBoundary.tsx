import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Coffee, RotateCcw, Copy, Check, ChevronDown, ChevronUp, AlertOctagon, Terminal } from 'lucide-react';
import { logErrorToPersistentStore, ErrorReport, isLikelyHydrationError } from '../utils/errorLogger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  report: ErrorReport | null;
  isDetailsOpen: boolean;
  isCopied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    report: null,
    isDetailsOpen: false,
    isCopied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const report = logErrorToPersistentStore(error, errorInfo);
    this.setState({ errorInfo, report });
  }

  private handleReset = () => {
    try {
      // Clear corrupt state keys
      localStorage.removeItem('coffeebakery_loyalty_customer');
      localStorage.removeItem('pitstop_customers_db_v1');
      sessionStorage.clear();
    } catch {
      // Ignore
    }
    window.location.reload();
  };

  private handleCopyReport = async () => {
    if (!this.state.report) return;
    const jsonReport = JSON.stringify(this.state.report, null, 2);
    try {
      await navigator.clipboard.writeText(jsonReport);
      this.setState({ isCopied: true });
      setTimeout(() => this.setState({ isCopied: false }), 2500);
    } catch {
      // Fallback prompt if clipboard writeText is blocked
      console.log('Crash Report JSON:\n', jsonReport);
    }
  };

  private toggleDetails = () => {
    this.setState((prev) => ({ isDetailsOpen: !prev.isDetailsOpen }));
  };

  public render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || 'Erro inesperado na renderização';
      const isHydration = isLikelyHydrationError(errorMsg) || isLikelyHydrationError(this.state.errorInfo?.componentStack || '');

      return (
        <div className="min-h-screen bg-[#f7f5f0] flex items-center justify-center p-4 sm:p-6 text-stone-900 font-sans selection:bg-amber-800 selection:text-white">
          <div className="max-w-xl w-full bg-white rounded-3xl border border-stone-200 shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-300">
            {/* Top Brand Identity */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center mx-auto shadow-md">
                <Coffee className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-amber-700 block">
                  Pitstop Roast & Bakery · Diagnóstico
                </span>
                <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 mt-1 font-display">
                  Recuperação do Cartão
                </h1>
                <p className="text-xs text-stone-600 mt-1.5 max-w-sm mx-auto leading-relaxed">
                  O navegador detetou uma anomalia na inicialização dos dados. O incidente foi capturado pelo registador global.
                </p>
              </div>

              {/* Status Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border border-red-200 bg-red-50 text-red-800">
                <AlertOctagon className="w-3.5 h-3.5 text-red-600 shrink-0" />
                <span>{isHydration ? 'Erro de Hidratação / Dessincronia de HTML' : 'Exceção de Renderização Capturada'}</span>
              </div>
            </div>

            {/* Error Message Box */}
            <div className="p-3.5 rounded-2xl bg-stone-900 text-stone-100 border border-stone-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-amber-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Mensagem Técnica</span>
                </span>
                <span className="text-[10px] text-stone-400">Gravado no Armazenamento Local</span>
              </div>
              <p className="text-xs font-mono text-red-300 break-words leading-relaxed">
                {errorMsg}
              </p>
            </div>

            {/* Collapsible Details */}
            <div className="border border-stone-200 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={this.toggleDetails}
                className="w-full p-3.5 text-xs font-semibold text-stone-700 bg-stone-50 hover:bg-stone-100 flex items-center justify-between transition-colors"
              >
                <span>Ver Rastreio Completo (Stack Trace & Componentes)</span>
                {this.state.isDetailsOpen ? (
                  <ChevronUp className="w-4 h-4 text-stone-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-stone-500" />
                )}
              </button>

              {this.state.isDetailsOpen && (
                <div className="p-3.5 bg-stone-950 text-stone-300 text-[11px] font-mono space-y-3 overflow-x-auto max-h-56">
                  {this.state.error?.stack && (
                    <div>
                      <span className="text-amber-400 block font-bold mb-1">Stack Trace:</span>
                      <pre className="text-stone-300 whitespace-pre-wrap leading-tight text-[10px]">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <div className="pt-2 border-t border-stone-800">
                      <span className="text-amber-400 block font-bold mb-1">Component Stack:</span>
                      <pre className="text-stone-400 whitespace-pre-wrap leading-tight text-[10px]">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restaurar Cache e Recarregar Cartão</span>
              </button>

              <button
                type="button"
                onClick={this.handleCopyReport}
                className="w-full py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs flex items-center justify-center gap-2 border border-stone-200 transition-colors"
              >
                {this.state.isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Relatório Copiado para a Área de Transferência!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-stone-600" />
                    <span>Copiar Relatório de Erro para Diagnóstico (JSON)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
