import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Text, Spinner } from 'tamagui';
import { useGetAppDataQuery } from '../features/api/apiSlice';
import { useAppSelector } from '../app/hooks';

const Nav: React.FC = () => {
  const { isLoading, error } = useGetAppDataQuery();
  const brandName = useAppSelector((state) => state.nav.brandName);

  return (
    <View style={{ padding: 10, alignItems: 'center' }}>
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <Text>Error loading brand name</Text>
      ) : (
        <Text fontSize={24} fontWeight="bold">
          🚀 {brandName}
        </Text>
      )}
    </View>
  );
};

export default Nav;
