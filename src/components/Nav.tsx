import React from 'react';
import { Text, Spinner, YStack } from 'tamagui';
import { useGetAppDataQuery } from '../features/api/apiSlice';
import { useAppSelector } from '../app/hooks';
import '../styles/nav.css';

const Nav: React.FC = () => {
  const { isLoading, error } = useGetAppDataQuery();
  const brandName = useAppSelector((state) => state.nav.brandName);

  return (
    <YStack className="nav-container">
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <Text>Error loading brand name</Text>
      ) : (
        <Text fontSize={24} fontWeight="bold" className="nav-text" textAlign="center">
          🚀 {brandName}
        </Text>
      )}
    </YStack>
  );
};

export default Nav;
