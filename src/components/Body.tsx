import React, { useEffect } from 'react';
import { Text, Spinner, YStack, Card, H2, Paragraph } from 'tamagui';
import { useGetAppDataQuery } from '../features/api/apiSlice';
import { useAppSelector } from '../app/hooks';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';

const AnimatedCard = Animated.createAnimatedComponent(Card);

const FeatureCard = ({ feature, index }) => {
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(50);

  useEffect(() => {
    const delay = index * 200;
    cardOpacity.value = withDelay(delay, withTiming(1, { duration: 500 }));
    cardTranslateY.value = withDelay(delay, withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) }));
  }, [index]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  return (
    <AnimatedCard
      key={index}
      elevate
      size="$4"
      bordered
      style={cardAnimatedStyle}
    >
      <Card.Header padded>
        <H2>{feature.title}</H2>
      </Card.Header>
      <Card.Footer padded>
        <Paragraph>{feature.description}</Paragraph>
      </Card.Footer>
    </AnimatedCard>
  );
};

const Body: React.FC = () => {
  const { isLoading, error } = useGetAppDataQuery();
  const description = useAppSelector((state) => state.body.description);
  const portfolioFeatures = useAppSelector((state) => state.body.portfolioFeatures);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 1000, easing: Easing.ease });
    translateY.value = withTiming(0, { duration: 1000, easing: Easing.ease });
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <YStack f={1} padding="$4" space className="gradient-background" style={{ minHeight: '100vh' }}>
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <Text>Error loading data</Text>
      ) : (
        <Animated.View style={animatedStyle}>
          <Text fontSize={20} textAlign="center" marginBottom="$4">{description}</Text>
          <YStack space>
            {portfolioFeatures.map((feature, index) => (
              <FeatureCard key={index} feature={feature} index={index} />
            ))}
          </YStack>
        </Animated.View>
      )}
    </YStack>
  );
};

export default Body;
