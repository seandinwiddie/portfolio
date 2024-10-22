import React from 'react';
import { XStack, Button, Separator, Spinner } from 'tamagui';
import ThemeToggle from './ThemeToggle';
import ThemeCustom from './ThemeCustom';
import BrandName from './BrandName';
import { Link } from 'expo-router';
import { useAppSelector } from '../app/hooks';

const Nav: React.FC = () => {
  const isLoading = useAppSelector((state) => state.brandName.isLoading);

  return (
    <XStack
      backgroundColor="$background"
      borderBottomColor="$borderColor"
      borderBottomWidth={1}
      paddingHorizontal="$4"
      paddingVertical="$2"
      alignItems="center"
      justifyContent="space-between"
    >
      <XStack space="$4" alignItems="center">
        {isLoading ? (
          <Spinner size="small" color="$color" />
        ) : (
          <>
            <BrandName />
            <Separator vertical />
            <Link href="/home" asChild>
              <Button variant="outlined">Home</Button>
            </Link>
            <Link href="/status">
              <Button variant="outlined">Status</Button>
            </Link>
          </>
        )}
      </XStack>
      <XStack space="$2" alignItems="center">
        <ThemeCustom />
        <ThemeToggle />
      </XStack>
    </XStack>
  );
};

export default Nav;
