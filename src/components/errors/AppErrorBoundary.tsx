"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type AppErrorBoundaryProps = {
  children: ReactNode;
  fallbackTitle?: string;
};

type AppErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
    message: "",
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || "An unexpected error occurred.",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("AppErrorBoundary caught an error:", error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ hasError: false, message: "" });
  };

  render() {
    if (this.state.hasError) {
      return (
        <section
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center"
        >
          <h2 className="text-lg font-semibold text-red-900">
            {this.props.fallbackTitle ?? "Something went wrong"}
          </h2>
          <p className="mt-2 text-sm text-red-800">{this.state.message}</p>
          <button
            type="button"
            onClick={this.handleReset}
            className="mt-4 rounded-lg bg-red-800 px-4 py-2 text-sm font-medium text-white hover:bg-red-900"
          >
            Try again
          </button>
        </section>
      );
    }

    return this.props.children;
  }
}
