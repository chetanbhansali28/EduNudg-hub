import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button, ThemeProvider } from "@edunudg/ui";

type Props = {
  children: ReactNode;
  onCatch?: (error: Error, info: ErrorInfo) => void;
};

type State = { error: Error | null };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onCatch?.(error, info);
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <ThemeProvider>
        <div className="ed-login">
          <p className="ed-empty">Something went wrong. Reload to continue.</p>
          <Button type="button" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      </ThemeProvider>
    );
  }
}
