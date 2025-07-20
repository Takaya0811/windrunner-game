'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full mx-4">
            <h1 className="text-2xl font-bold text-red-600 mb-4">エラーが発生しました</h1>
            <div className="mb-4">
              <h2 className="font-semibold mb-2">エラー内容:</h2>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {this.state.error?.message}
              </pre>
            </div>
            <div className="mb-4">
              <h2 className="font-semibold mb-2">スタックトレース:</h2>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-40">
                {this.state.error?.stack}
              </pre>
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              再試行
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}