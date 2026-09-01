import type React from 'react'
import { View, Text, Button, YStack } from 'tamagui'
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'
import type { FallbackProps } from 'react-error-boundary'
import { reportRenderFailure } from '../../../features/systems/substrate/ui/presentation/errorBoundary/errorBoundaryActions'
import type {
  ErrorBoundaryFallbackViewProps,
  ErrorBoundaryViewProps,
} from '../../../features/systems/substrate/ui/presentation/errorBoundary/errorBoundarySelectors'

/**
 * Wraps react-error-boundary (already a dependency, and already used by
 * app/telemetry.tsx) instead of hand-rolling a class component. Raw diagnostics
 * remain inside reportRenderFailure while the public projection stays neutral.
 */
const Fallback: React.FC<
  ErrorBoundaryFallbackViewProps & Pick<FallbackProps, 'resetErrorBoundary'>
> = ({ resetErrorBoundary, headline, message, retryLabel }) => (
  <View flex={1} justifyContent="center" alignItems="center" padding="$4">
    <YStack space="$3" maxWidth={600} alignItems="center">
      <Text fontSize="$6" fontWeight="bold">
        {headline}
      </Text>
      <Text>{message}</Text>
      <Button onPress={resetErrorBoundary}>{retryLabel}</Button>
    </YStack>
  </View>
)

const ErrorBoundary: React.FC<ErrorBoundaryViewProps> = ({ children, fallback }) => (
  <ReactErrorBoundary
    fallbackRender={({ resetErrorBoundary }) => (
      <Fallback {...fallback} resetErrorBoundary={resetErrorBoundary} />
    )}
    onError={reportRenderFailure}
  >
    {children}
  </ReactErrorBoundary>
)

export default ErrorBoundary
