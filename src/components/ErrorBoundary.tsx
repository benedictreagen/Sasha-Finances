import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Sasha Finance production runtime error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#191919] text-[#ebebeb] p-6 flex flex-col items-center justify-center font-sans">
          <div className="max-w-2xl w-full bg-[#202020] rounded-2xl border border-rose-500/50 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center font-bold text-lg">
                !
              </div>
              <div>
                <h1 className="text-base font-bold text-rose-400 m-0">
                  Production Runtime Error
                </h1>
                <p className="text-xs text-[#9b9a97] m-0">
                  Sasha Finance encountered an unhandled exception during execution
                </p>
              </div>
            </div>

            <div className="bg-[#141414] rounded-xl p-3.5 mb-4 border border-[#333]">
              <div className="text-[11px] text-rose-400 font-semibold mb-1">
                Error Message:
              </div>
              <div className="text-xs text-white font-mono break-all">
                {this.state.error?.message || 'Unknown runtime error'}
              </div>
            </div>

            {this.state.error?.stack && (
              <div className="mb-4">
                <div className="text-[11px] text-[#9b9a97] font-semibold mb-1">
                  Error Stack:
                </div>
                <pre className="bg-[#141414] p-3 rounded-xl text-[11px] text-neutral-400 overflow-x-auto max-h-40 font-mono">
                  {this.state.error.stack}
                </pre>
              </div>
            )}

            {this.state.errorInfo?.componentStack && (
              <div className="mb-6">
                <div className="text-[11px] text-[#9b9a97] font-semibold mb-1">
                  Component Stack:
                </div>
                <pre className="bg-[#141414] p-3 rounded-xl text-[11px] text-neutral-400 overflow-x-auto max-h-40 font-mono">
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium cursor-pointer transition-colors"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold cursor-pointer transition-colors"
              >
                Reset Local Storage & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
