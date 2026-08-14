"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode; label?: string };
type State = { error: Error | null };

export class EtchErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[EtchErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="etch-error panel" role="alert">
          <p className="type-label">Canvas unavailable</p>
          <h3>{this.props.label ?? "Drawing canvas failed to load"}</h3>
          <p>
            Refresh the page. If the problem persists, clear site data for this browser and try
            again.
          </p>
          <button
            type="button"
            className="primary-btn"
            onClick={() => this.setState({ error: null })}
          >
            Retry canvas
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
