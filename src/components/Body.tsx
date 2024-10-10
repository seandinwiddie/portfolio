import React from 'react';
import { View } from 'react-native';
import { Text, Spinner } from 'tamagui';
import { useGetAppDataQuery } from '../features/api/apiSlice';
import { useAppSelector } from '../app/hooks';

const Body: React.FC = () => {
  const { isLoading, error } = useGetAppDataQuery();
  const description = useAppSelector((state) => state.body.description);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <Text>Error loading description</Text>
      ) : (
        <Text fontSize={20}>{description}</Text>
      )}
    </View>
  );
};

export default Body;
