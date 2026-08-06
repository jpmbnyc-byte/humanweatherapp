import React from 'react';
import { reportLovableError } from '../lib/lovable-error-reporting';

interface TabErrorBoundaryProps {
  children: React.ReactNode;
  isNight: boolean;
}

interface TabErrorBoundaryState {
  hasError: boolean;
}

export default class TabErrorBoundary extends React.Component<TabErrorBoundaryProps, TabErrorBoundaryState> {
  state: TabErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    reportLovableError(error, {
      boundary: 'tab_error_boundary',
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={`p-6 rounded-xl border text-center ${this.props.isNight ? 'border-white/10 bg-black/20' : 'border-stone-200 bg-stone-50'}`}>
          <p className="font-sans text-base mb-2">This section could not load.</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="font-sans text-sm underline opacity-70 hover:opacity-100"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
