import React from "react";
import { reportError } from "../../lib/reportError";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    reportError(error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="error-boundary-state" role="alert">
        <span aria-hidden="true">🪴</span>
        <h1>Something needs a little care.</h1>
        <p>ForAllCode hit a snag while loading this page. A quick reload usually gets things growing again.</p>
        <button type="button" onClick={() => window.location.reload()}>Reload page</button>
      </main>
    );
  }
}
