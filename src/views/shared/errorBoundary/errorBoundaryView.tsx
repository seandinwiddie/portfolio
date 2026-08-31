import type React from 'react'
import { View, Text, Button, YStack } from 'tamagui'
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'
import type { FallbackProps } from 'react-error-boundary'
import { reportRenderFailure } from '../../../features/systems/platform/ui/presentation/errorBoundary/errorBoundaryActions'
import { selectRenderFailureMessage } from '../../../features/systems/platform/ui/presentation/errorBoundary/errorBoundarySelectors'
import type { ErrorBoundaryViewProps } from '../../../features/systems/platform/ui/presentation/errorBoundary/errorBoundarySelectors'

/**
 * Wraps react-error-boundary (already a dependency, and already used by
 * app/status.tsx) instead of hand-rolling a class component. Also surfaces the
 * actual error and a retry, rather than swallowing it behind a fixed string.
 */
const Fallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => (
  <View flex={1} justifyContent="center" alignItems="center" padding="$4">
    <YStack space="$3" maxWidth={600} alignItems="center">
      <Text fontSize="$6" fontWeight="bold">
        Sorry, there was an error
      </Text>
      <Text>{selectRenderFailureMessage(error)}</Text>
      <Button onPress={resetErrorBoundary}>Try again</Button>
    </YStack>
  </View>
)

const ErrorBoundary: React.FC<ErrorBoundaryViewProps> = ({ children }) => (
  <ReactErrorBoundary FallbackComponent={Fallback} onError={reportRenderFailure}>
    {children}
  </ReactErrorBoundary>
)

export default ErrorBoundary
