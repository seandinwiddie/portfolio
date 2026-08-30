import React from 'react';
import PageHead from '../components/PageHead';
import { View } from 'tamagui';
import Welcome from '../components/Welcome';

export default function Index() {
  return (
    <View flex={1}>
      <PageHead title="Welcome" />
      <Welcome />
    </View>
  );
}
