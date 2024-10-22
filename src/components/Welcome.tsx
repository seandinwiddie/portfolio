import React from 'react';
import { View, Text, Button } from 'tamagui';
import { useRouter } from 'expo-router';

const Welcome: React.FC = () => {
  const router = useRouter();

  return (
    <View flex={1} justifyContent="center" alignItems="center">
      <Text fontSize="$6" marginBottom="$4"><i>Welcome!!</i></Text>
      <Button onPress={() => router.push('/home')}>Enter Sean's Portfolio</Button>
    </View>
  );
};

export default Welcome;
