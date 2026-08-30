import React from 'react';
import { XStack, YStack, Button, Separator, Text, useMedia } from 'tamagui';
import { usePathname } from 'expo-router';
import { Link } from 'expo-router';
import ThemeToggle from './ThemeToggle';
import ThemeCustom from './ThemeCustom';
import BrandName from './BrandName';
import { useAppSelector } from '../store/hooks';
import { selectBrandNameLoading } from '../features/brandName/brandNameSlice';

const NAV_LINKS = [
  { href: '/home', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/projects', label: 'Projects' },
  { href: '/status', label: 'Status' },
] as const;

const NavLinks: React.FC<{ onNavigate?: () => void }> = ({ onNavigate }) => (
  <>
    {NAV_LINKS.map(({ href, label }) => (
      // `push` keeps every navigation a real history entry; without it
      // expo-router reuses React Navigation's "navigate to an existing screen"
      // semantics, which replaceState'd and made Back appear to do nothing.
      <Link key={href} href={href} push asChild>
        <Button
          chromeless
          animation="quick"
          pressStyle={{ scale: 0.95 }}
          fontFamily="$body"
          onPress={onNavigate}
        >
          <Text fontFamily="$body">{label}</Text>
        </Button>
      </Link>
    ))}
  </>
);

/**
 * Collapsible below 800px.
 *
 * Wrapping alone was not enough: with four routes plus three theme controls,
 * a wrapped nav consumed an entire phone viewport and had no way to close,
 * pushing the page content off screen. On narrow viewports it now collapses to
 * the brand plus a toggle, and closes on navigate, on Escape, and on toggle.
 */
const Nav: React.FC = () => {
  const isLoading = useAppSelector(selectBrandNameLoading);
  const media = useMedia();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  const compact = !media.gtSm;

  // Any route change closes the menu, including browser back/forward.
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (typeof document === 'undefined' || !open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (isLoading) {
    return (
      <XStack
        backgroundColor="$background"
        borderBottomColor="$borderColor"
        borderBottomWidth={1}
        paddingHorizontal="$4"
        paddingVertical="$2"
      >
        <YStack width={150} height={40} backgroundColor="$gray5" borderRadius="$2" opacity={0.4} />
      </XStack>
    );
  }

  return (
    <YStack
      backgroundColor="$background"
      borderBottomColor="$borderColor"
      borderBottomWidth={1}
      paddingHorizontal="$4"
      paddingVertical="$2"
    >
      <XStack alignItems="center" justifyContent="space-between" gap="$3">
        <BrandName />

        {compact ? (
          <Button
            chromeless
            onPress={() => setOpen((was) => !was)}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            fontFamily="$body"
          >
            <Text fontFamily="$body" fontSize="$2" letterSpacing={2}>
              {open ? '✕ CLOSE' : '☰ MENU'}
            </Text>
          </Button>
        ) : (
          <XStack alignItems="center" gap="$3" flexShrink={1} flexWrap="wrap" rowGap="$2">
            <Separator vertical />
            <NavLinks />
            <Separator vertical />
            <ThemeCustom />
            <ThemeToggle />
          </XStack>
        )}
      </XStack>

      {compact && open ? (
        <YStack gap="$2" paddingTop="$3" paddingBottom="$1">
          <NavLinks onNavigate={() => setOpen(false)} />
          <Separator />
          <ThemeToggle />
          <ThemeCustom />
        </YStack>
      ) : null}
    </YStack>
  );
};

export default Nav;
