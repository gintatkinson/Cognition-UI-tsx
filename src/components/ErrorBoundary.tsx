import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertOctagon, RefreshCw, Copy, Check } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, copied: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error inside Cognitive Controller application:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleCopy = () => {
    if (!this.state.error) return;
    const details = `Error: ${this.state.error.message}\n\nStack:\n${this.state.error.stack || "N/A"}\n\nComponent Stack:\n${this.state.errorInfo?.componentStack || "N/A"}`;
    navigator.clipboard.writeText(details).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-zinc-100 p-6 selection:bg-rose-500/30">
          <div className="max-w-2xl w-full border border-rose-500/20 bg-zinc-900/40 p-8 rounded-2xl shadow-2xl backdrop-blur">
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4 mb-6">
              <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-lg">
                <AlertOctagon className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">Cognitive Controller Runtime Exception</h1>
                <p className="text-zinc-400 text-xs mt-0.5">The interface failed to render due to an uncaught React exception.</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1 p-4 bg-rose-500/5 border border-rose-500/10 rounded-lg text-left">
                <span className="text-[10px] font-mono font-bold tracking-widest text-rose-400 uppercase">Error Message</span>
                <span className="text-sm font-sans font-medium text-rose-200 mt-1">
                  {this.state.error?.message || "An unknown error occurred during rendering."}
                </span>
              </div>

              {this.state.error?.stack && (
                <div className="flex flex-col gap-1.5 p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg text-left">
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase">
                    <span>Stack trace</span>
                    <button
                      onClick={this.handleCopy}
                      className="p-1 hover:bg-zinc-800 rounded border border-zinc-800 hover:text-white transition-all cursor-pointer"
                      title="Copy stack trace details"
                    >
                      {this.state.copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono text-zinc-400 overflow-auto max-h-60 mt-1 whitespace-pre-wrap leading-relaxed select-text">
                    {this.state.error.stack}
                  </pre>
                </div>
              )}

              {this.state.errorInfo?.componentStack && (
                <div className="flex flex-col gap-1.5 p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg text-left">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-450 uppercase">Component Stack</span>
                  <pre className="text-[10px] font-mono text-zinc-400 overflow-auto max-h-40 mt-1 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              )}

              <div className="flex gap-3 justify-end mt-4 border-t border-zinc-800/60 pt-4">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-semibold text-xs rounded-lg flex items-center gap-2 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reload Application</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
