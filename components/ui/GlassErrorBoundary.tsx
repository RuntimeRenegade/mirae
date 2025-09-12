import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';

interface GlassComponentError {
  component: string;
  error: Error;
  fallbackApplied: boolean;
}

interface Props {
  children: ReactNode;
  fallbackComponent?: ReactNode;
  onError?: (error: GlassComponentError) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorBoundaryKey: number;
}

/**
 * GlassErrorBoundary Component - Traditional React Native Styling
 * 
 * A specialized error boundary for glass morphism components that provides
 * graceful degradation when glass effects fail or are not supported.
 * Uses traditional React Native StyleSheet instead of NativeWind.
 */
export class GlassErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorBoundaryKey: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state to show fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details
    console.error('GlassErrorBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      const glassError: GlassComponentError = {
        component: 'GlassErrorBoundary',
        error,
        fallbackApplied: true
      };
      this.props.onError(glassError);
    }

    // Report to error monitoring service (implement as needed)
    this.reportErrorToService(error, errorInfo);
  }

  reportErrorToService = (error: Error, errorInfo: React.ErrorInfo) => {
    // In a real application, you would report to a service like Sentry, Bugsnag, etc.
    // For now, we'll just log to console with structured data
    const errorReport = {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      componentStack: errorInfo.componentStack,
      errorBoundary: 'GlassErrorBoundary'
    };

    console.warn('Error reported to monitoring service:', errorReport);
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorBoundaryKey: this.state.errorBoundaryKey + 1
    });
  };

  handleContinue = () => {
    // For now, just reset the error state
    this.handleReset();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI provided
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      // Default fallback UI with glass styling
      return (
        <View style={styles.container}>
          <GlassCard variant="elevated" style={styles.card}>
            <View style={styles.content}>
              {/* Error Icon */}
              <View style={styles.iconContainer}>
                <Text style={styles.errorIcon}>⚠️</Text>
              </View>

              {/* Error Title */}
              <Text style={styles.title}>
                Something went wrong
              </Text>

              {/* Error Description */}
              <Text style={styles.description}>
                We encountered an unexpected error with the glass effects. 
                Don't worry, your data is safe!
              </Text>

              {/* Error Details (in development) */}
              {__DEV__ && this.state.error && (
                <View style={styles.errorDetails}>
                  <Text style={styles.errorDetailsTitle}>
                    Error Details (Development):
                  </Text>
                  <Text style={styles.errorDetailsText}>
                    {this.state.error.message}
                  </Text>
                  <Text style={styles.errorDetailsStack} numberOfLines={5}>
                    {this.state.error.stack}
                  </Text>
                </View>
              )}

              {/* Action buttons */}
              <View style={styles.buttonContainer}>
                <GlassButton
                  title="Try Again"
                  variant="primary"
                  onPress={this.handleReset}
                  style={styles.button}
                />
                
                <GlassButton
                  title="Continue"
                  variant="secondary"
                  onPress={this.handleContinue}
                  style={styles.button}
                />
              </View>
            </View>
          </GlassCard>
        </View>
      );
    }

    // Re-render children with new key to force remount after error recovery
    return (
      <React.Fragment key={this.state.errorBoundaryKey}>
        {this.props.children}
      </React.Fragment>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fef7ed', // pearl-50 equivalent
  },
  card: {
    padding: 32,
    maxWidth: 350,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(251, 113, 133, 0.1)', // rose-100 equivalent
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorIcon: {
    fontSize: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937', // gray-800
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#6B7280', // gray-600
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  errorDetails: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)', // red-50
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    width: '100%',
  },
  errorDetailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626', // red-600
    marginBottom: 8,
  },
  errorDetailsText: {
    fontSize: 14,
    color: '#B91C1C', // red-700
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  errorDetailsStack: {
    fontSize: 12,
    color: '#7F1D1D', // red-900
    fontFamily: 'monospace',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
  },
});

/**
 * Hook for error reporting in functional components
 */
export const useGlassErrorHandler = () => {
  const reportError = (error: GlassComponentError) => {
    console.error('Glass component error:', error);
    
    // Report to monitoring service
    const errorReport = {
      timestamp: new Date().toISOString(),
      component: error.component,
      error: {
        message: error.error.message,
        stack: error.error.stack
      },
      fallbackApplied: error.fallbackApplied
    };

    console.warn('Error reported:', errorReport);
  };

  return { reportError };
};

export default GlassErrorBoundary;
