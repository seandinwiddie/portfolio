import React from 'react';
import { View, Text } from 'tamagui';
import Status from '../components/Status';
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({error}) {
  return (
    <View>
      <Text>Something went wrong:</Text>
      <Text>{error.message}</Text>
    </View>
  )
}

export default function StatusPage() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <View flex={1}>
        <Status />
      </View>
    </ErrorBoundary>
  );
}
