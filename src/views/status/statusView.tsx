import type React from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { Text, View } from 'tamagui'
import { useStatusRoute } from '../../features/systems/portfolio/diagnostics/status/statusThunks'
import type { StatusErrorViewProps } from '../../features/systems/portfolio/diagnostics/status/statusSelectors'
import Status from '../portfolio/diagnostics/status/statusView'
import PageHead from '../shared/pageHead/pageHeadView'

const ErrorFallback: React.FC<StatusErrorViewProps> = ({ error }) => (
  <View role="alert">
    <Text>Something went wrong:</Text>
    <Text>{error.message}</Text>
  </View>
)

const StatusContent = () => {
  const model = useStatusRoute()

  return <Status {...model} />
}

export default function StatusPage() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <View flex={1}>
        <PageHead title="Status" description="Live application and API status." />
        <StatusContent />
      </View>
    </ErrorBoundary>
  )
}
