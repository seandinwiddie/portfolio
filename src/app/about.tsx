import React from 'react';
import PageHead from '../components/PageHead';
import { View } from 'tamagui';
import About from '../components/About';

export default function AboutPage() {
  return (
    <View flex={1}>
      <PageHead title="About" description="Portfolio features and application procedures." />
      <About />
    </View>
  );
}
