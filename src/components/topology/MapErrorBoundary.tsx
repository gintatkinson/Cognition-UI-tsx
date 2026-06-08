import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class MapErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Cesium / Map Exception intercepted by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div id="map-error-fallback" className="w-full h-full min-h-[500px] flex flex-col items-center justify-center p-6 bg-slate-950 border border-slate-800 rounded-xl text-center space-y-4">
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-full text-red-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="max-w-md space-y-2">
            <h3 className="text-sm font-bold font-mono text-slate-200">
              3D Globe Initialization Failure
            </h3>
            <p className="text-xs font-sans text-slate-400 leading-relaxed">
              CesiumJS was unable to boot or load its WebGL context. This can happen if hardware acceleration is disabled in your browser, or if the Cesium asset configurations are blocked in the preview environment.
            </p>
            {this.state.error?.message && (
              <pre className="p-2 text-[10px] font-mono text-red-300 bg-red-950/30 border border-red-900/30 rounded overflow-auto max-h-24 text-left">
                {this.state.error.message}
              </pre>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              id="btn-retry-map"
              variant="outline"
              size="sm"
              onClick={this.handleReset}
              className="h-8 font-mono text-[11px] bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-2" />
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
