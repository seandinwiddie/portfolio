import React from 'react';
import { XStack, Button, Separator, YStack, AnimatePresence, Text } from 'tamagui';
import ThemeToggle from './ThemeToggle';
import ThemeCustom from './ThemeCustom';
import BrandName from './BrandName';
import { Link } from 'expo-router';
import { useAppSelector } from '../store/hooks';
import { selectBrandNameLoading } from '../features/brandName/brandNameSlice';

const NAV_LINKS = [
  { href: '/home', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/projects', label: 'Projects' },
  { href: '/status', label: 'Status' },
] as const;

const Nav: React.FC = () => {
  const isLoading = useAppSelector(selectBrandNameLoading);

  return (
    // flexWrap is the fix for the nav needing ~951px and never wrapping: below
    // that everything from "About" rightward went off-screen and the page
    // scrolled sideways. Rows now wrap instead of overflowing.
    <XStack
      backgroundColor="$background"
      borderBottomColor="$borderColor"
      borderBottomWidth={1}
      paddingHorizontal="$4"
      paddingVertical="$2"
      alignItems="center"
      justifyContent="space-between"
      flexWrap="wrap"
      rowGap="$2"
      columnGap="$2"
      animation="lazy"
      enterStyle={{ opacity: 0, y: -10 }}
      exitStyle={{ opacity: 0, y: -10 }}
    >
      <XStack space="$4" alignItems="center" flexWrap="wrap" rowGap="$2">
        <AnimatePresence>
          {isLoading ? (
            <YStack width={150} height={40} backgroundColor="$gray5" borderRadius="$2" />
          ) : (
            <>
              <BrandName />
              <Separator vertical />
              {NAV_LINKS.map(({ href, label }) => (
                // `push` keeps every navigation a real history entry. Without it
                // expo-router reuses React Navigation's "navigate to an existing
                // screen" semantics, which replaceState'd the entry and made the
                // browser Back button appear to do nothing.
                <Link key={href} href={href} push asChild>
                  <Button chromeless animation="quick" pressStyle={{ scale: 0.95 }} fontFamily="$body">
                    <Text fontFamily="$body">{label}</Text>
                  </Button>
                </Link>
              ))}
            </>
          )}
        </AnimatePresence>
      </XStack>
      <XStack space="$2" alignItems="center" flexWrap="wrap" rowGap="$2">
        <ThemeCustom />
        <ThemeToggle />
      </XStack>
    </XStack>
  );
};

export default Nav;
