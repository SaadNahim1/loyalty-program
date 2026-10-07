import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Coffee, RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      // Clear potentially corrupt local state
      localStorage.removeItem('coffeebakery_loyalty_customer');
    } catch {
      // Ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f7f5f0] flex items-center justify-center p-4 text-stone-900 font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl border border-stone-200 shadow-xl p-6 sm:p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center mx-auto shadow-md">
              <Coffee className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber-700">
                Pitstop Roast & Bakery
              </span>
              <h1 className="text-xl font-extrabold text-stone-900">
                A carregar o seu Cartão...
              </h1>
              <p className="text-xs text-stone-600 leading-relaxed">
                Ocorreu uma pequena instabilidade no navegador. Clique no botão abaixo para restaurar o cartão de fidelização.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-left text-[11px] font-mono text-amber-900 overflow-x-auto max-h-24">
                {this.state.error.message || 'Erro inesperado'}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restaurar e Recarregar</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
