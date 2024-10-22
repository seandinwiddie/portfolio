import React from 'react';
import { ScrollView, YStack, Text, Card, H2, Paragraph } from 'tamagui';
import { useAppSelector } from '../app/hooks';

const Home: React.FC = () => {
  const { portfolioFeatures, appProcedures } = useAppSelector((state) => state.body);
  
  return (
    <ScrollView>
      <YStack padding="$4" space="$4">
        <H2>Portfolio Features</H2>
        {portfolioFeatures.length > 0 ? (
          portfolioFeatures.map((feature) => (
            <Card key={feature.id} padding="$4" elevate>
              <H2 color="$color">{feature.title}</H2>
              <Paragraph>{feature.description}</Paragraph>
            </Card>
          ))
        ) : (
          <Paragraph>No portfolio features available</Paragraph>
        )}
        
        <H2>App Procedures</H2>
        {appProcedures.length > 0 ? (
          appProcedures.map((procedure) => (
            <Card key={procedure.id} padding="$4" elevate>
              <H2 color="$color">{procedure.title}</H2>
              <Paragraph>{procedure.description}</Paragraph>
            </Card>
          ))
        ) : (
          <Paragraph>No app procedures available</Paragraph>
        )}
      </YStack>
    </ScrollView>
  );
};

export default Home;
