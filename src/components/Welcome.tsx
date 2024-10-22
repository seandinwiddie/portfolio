import React from 'react';
import { View, Text, Button } from 'tamagui';
import { useRouter } from 'expo-router';

const Welcome: React.FC = () => {
  const router = useRouter();

  const handleEnterPortfolio = () => {
    router.push('/home');
  };

  return (
    <View
      flex={1}
      justifyContent="center"
      alignItems="center"
      backgroundColor="$background"
      padding="$4"
    >
      <Text
        fontSize="$8"
        fontWeight="bold"
        color="$color"
        marginBottom="$4"
        textAlign="center"
      >
        Welcome to My Portfolio
      </Text>
      <Button
        onPress={handleEnterPortfolio}
        theme="active"
        size="$4"
        fontWeight="bold"
      >
        Enter Portfolio
      </Button>
    </View>
  );
};

export default Welcome;
