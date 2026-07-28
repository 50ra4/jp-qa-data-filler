import { Component, type ErrorInfo, type ReactNode } from 'react';

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback: string;
};

type ErrorBoundaryState = {
  failed: boolean;
};

class ErrorBoundaryImplementation extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Extension UI render failed.', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.failed) {
      return <p role="alert">{this.props.fallback}</p>;
    }
    return this.props.children;
  }
}

export const AppErrorBoundary = ({
  children,
  fallback,
}: ErrorBoundaryProps) => (
  <ErrorBoundaryImplementation fallback={fallback}>
    {children}
  </ErrorBoundaryImplementation>
);
