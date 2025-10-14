import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';
import { StatusCard } from './StatusCard';
import { extractErrorMessage } from '../lib/notifications';

interface RouteErrorBoundaryInnerProps {
  children: ReactNode;
  onReset: () => void;
}

interface RouteErrorBoundaryInnerState {
  hasError: boolean;
  error: Error | null;
}

class RouteErrorBoundaryInner extends Component<
  RouteErrorBoundaryInnerProps,
  RouteErrorBoundaryInnerState
> {
  state: RouteErrorBoundaryInnerState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryInnerState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in routed content', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset();
  };

  render() {
    if (this.state.hasError) {
      const message = extractErrorMessage(this.state.error, 'אירעה שגיאה בלתי צפויה');
      return (
        <StatusCard
          status="error"
          title="התרחשה שגיאה"
          description={message}
          primaryAction={{ label: 'נסה שוב', onClick: this.handleReset }}
          secondaryAction={
            <Button variant="subtle" onClick={() => window.location.reload()}>
              רענן את הדף
            </Button>
          }
        />
      );
    }

    return this.props.children;
  }
}

export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  return (
    <RouteErrorBoundaryInner
      onReset={() => {
        queryClient.resetQueries();
      }}
    >
      {children}
    </RouteErrorBoundaryInner>
  );
}
