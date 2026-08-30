import React, { ReactNode } from 'react';
import { View, Text, Button, YStack } from 'tamagui';
import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary';

/**
 * Wraps react-error-boundary (already a dependency, and already used by
 * app/status.tsx) instead of hand-rolling a class component. Also surfaces the
 * actual error and a retry, rather than swallowing it behind a fixed string.
 */
const Fallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => (
  <View flex={1} justifyContent="center" alignItems="center" padding="$4">
    <YStack space="$3" maxWidth={600} alignItems="center">
      <Text fontSize="$6" fontWeight="bold">Sorry.. there was an error</Text>
      <Text>{error instanceof Error ? error.message : String(error)}</Text>
      <Button onPress={resetErrorBoundary}>Try again</Button>
    </YStack>
  </View>
);

const ErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ReactErrorBoundary
    FallbackComponent={Fallback}
    onError={(error, info) => console.error('Uncaught error:', error, info)}
  >
    {children}
  </ReactErrorBoundary>
);

export default ErrorBoundary;
