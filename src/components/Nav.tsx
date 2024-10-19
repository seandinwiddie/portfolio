import React from 'react';
import { XStack, Text, Button, Separator } from 'tamagui';
import { useAppSelector } from '../app/hooks';
import ThemeToggle from './ThemeToggle';
import ThemeCustom from './ThemeCustom';
import { Link } from 'expo-router';

const Nav: React.FC = () => {
  const brandName = useAppSelector((state) => state.nav.brandName);

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
        <Text fontSize={24} fontWeight="bold" color="$color">
          {brandName || 'My Portfolio'}
        </Text>
        <Separator vertical />
        <Link href="/">
          <Button variant="outlined">Home</Button>
        </Link>
        <Link href="/status">
          <Button variant="outlined">Status</Button>
        </Link>
      </XStack>
      <XStack space="$2" alignItems="center">
        <ThemeCustom />
        <ThemeToggle />
      </XStack>
    </XStack>
  );
};

export default Nav;
