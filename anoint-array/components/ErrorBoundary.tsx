'use client'

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <Alert className="bg-red-900/60 backdrop-blur-lg border-red-700/50 text-red-200">
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription className="mt-2">
                <div className="space-y-4">
                  <h3 className="font-semibold text-white">Something went wrong</h3>
                  <p className="text-sm">
                    An unexpected error occurred while loading this page. Our self-healing AI system has been notified and is working to resolve the issue.
                  </p>
                  {this.state.error && (
                    <details className="text-xs opacity-75">
                      <summary className="cursor-pointer hover:opacity-100">Technical Details</summary>
                      <pre className="mt-2 p-2 bg-black/20 rounded text-xs overflow-auto">
                        {this.state.error.message}
                      </pre>
                    </details>
                  )}
                  <Button
                    onClick={() => {
                      this.setState({ hasError: false, error: undefined })
                      window.location.reload()
                    }}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}