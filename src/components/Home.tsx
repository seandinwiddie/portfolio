import React from 'react';
import { ScrollView, YStack, Text, Card, Separator } from 'tamagui';
import { useAppSelector } from '../app/hooks';

const Home: React.FC = () => {
  const portfolioFeatures = useAppSelector((state) => state.api.data?.portfolioFeatures || []);
  const appProcedures = useAppSelector((state) => state.api.data?.appProcedures || []);

  return (
    <ScrollView>
      <YStack padding="$4" space="$4">
        <Text fontSize="$6" fontWeight="bold">Portfolio Features</Text>
        {portfolioFeatures.map((feature) => (
          <Card key={feature.id} padding="$4">
            <Text fontSize="$5" fontWeight="bold">{feature.title}</Text>
            <Text fontSize="$4">{feature.description}</Text>
          </Card>
        ))}
        
        <Separator />
        
        <Text fontSize="$6" fontWeight="bold">App Procedures</Text>
        {appProcedures.map((procedure) => (
          <Card key={procedure.id} padding="$4">
            <Text fontSize="$5" fontWeight="bold">{procedure.title}</Text>
            <Text fontSize="$4">{procedure.description}</Text>
          </Card>
        ))}
      </YStack>
    </ScrollView>
  );
};

export default Home;
