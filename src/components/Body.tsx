import React from 'react';
import { Text, Spinner, YStack, Card, H2, Paragraph } from 'tamagui';
import { useGetAppDataQuery } from '../features/api/apiSlice';
import { useAppSelector } from '../app/hooks';

const Body: React.FC = () => {
  const { isLoading, error } = useGetAppDataQuery();
  const description = useAppSelector((state) => state.body.description);

  const portfolioFeatures = [
    {
      title: "Web Development",
      description: "Creating responsive and interactive web applications using modern frameworks."
    },
    {
      title: "Mobile Development",
      description: "Building cross-platform mobile apps with RTK Query and Expo Go."
    },
    {
      title: "UI/UX Design",
      description: "Designing intuitive and visually appealing user interfaces for optimal user experience."
    }
  ];

  return (
    <YStack f={1} padding="$4" space className="gradient-background" style={{ minHeight: '100vh' }}>
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <Text>Error loading description</Text>
      ) : (
        <>
          <Text fontSize={20} textAlign="center" marginBottom="$4">{description}</Text>
          <YStack space>
            {portfolioFeatures.map((feature, index) => (
              <Card key={index} elevate size="$4" bordered>
                <Card.Header padded>
                  <H2>{feature.title}</H2>
                </Card.Header>
                <Card.Footer padded>
                  <Paragraph>{feature.description}</Paragraph>
                </Card.Footer>
              </Card>
            ))}
          </YStack>
        </>
      )}
    </YStack>
  );
};

export default Body;
