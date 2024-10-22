import React from 'react';
import { ScrollView, YStack, Text, Card, Separator } from 'tamagui';
import { useAppSelector } from '../app/hooks';
import { View } from 'react-native';

const Home: React.FC = () => {
  const bodyState = useAppSelector((state) => state.body);
  const { portfolioFeatures, appProcedures } = bodyState;
  
  console.log('Body state in Home:', bodyState);

  return (
    <ScrollView flex={1} padding="$4" backgroundColor="$background">
      <YStack space="$4">
        <Text fontSize="$6" fontWeight="bold" color="$color">Portfolio Features</Text>
        {portfolioFeatures.length > 0 ? (
          portfolioFeatures.map((feature) => (
            <Card key={feature.id} padding="$4" backgroundColor="$backgroundStrong">
              <Text fontSize="$5" fontWeight="bold" color="$color">{feature.title}</Text>
              <Text color="$color">{feature.description}</Text>
            </Card>
          ))
        ) : (
          <Text color="$color">No portfolio features available</Text>
        )}
        <Separator />
        <Text fontSize="$6" fontWeight="bold" color="$color">App Procedures</Text>
        {appProcedures.length > 0 ? (
          appProcedures.map((procedure) => (
            <Card key={procedure.id} padding="$4" backgroundColor="$backgroundStrong">
              <Text fontSize="$5" fontWeight="bold" color="$color">{procedure.title}</Text>
              <Text color="$color">{procedure.description}</Text>
            </Card>
          ))
        ) : (
          <Text color="$color">No app procedures available</Text>
        )}
      </YStack>
    </ScrollView>
  );
};

export default Home;
