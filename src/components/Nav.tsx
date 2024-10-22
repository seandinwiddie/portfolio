import React from 'react';
import { XStack, Button, Separator, YStack, AnimatePresence, Text } from 'tamagui';
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
      animation="lazy"
      enterStyle={{ opacity: 0, y: -10 }}
      exitStyle={{ opacity: 0, y: -10 }}
    >
      <XStack space="$4" alignItems="center">
        <AnimatePresence>
          {isLoading ? (
            <YStack width={150} height={40} backgroundColor="$gray5" borderRadius="$2" />
          ) : (
            <>
              <BrandName />
              <Separator vertical />
              <Link href="/home" asChild>
                <Button variant="ghost" animation="quick" pressStyle={{ scale: 0.95 }} fontFamily="$body">
                  <Text fontFamily="$body">Home</Text>
                </Button>
              </Link>
              <Link href="/about" asChild>
                <Button variant="ghost" animation="quick" pressStyle={{ scale: 0.95 }} fontFamily="$body">
                  <Text fontFamily="$body">About</Text>
                </Button>
              </Link>
              <Link href="/status" asChild>
                <Button variant="ghost" animation="quick" pressStyle={{ scale: 0.95 }} fontFamily="$body">
                  <Text fontFamily="$body">Status</Text>
                </Button>
              </Link>
            </>
          )}
        </AnimatePresence>
      </XStack>
      <XStack space="$2" alignItems="center">
        <ThemeCustom />
        <ThemeToggle />
      </XStack>
    </XStack>
  );
};

export default Nav;
