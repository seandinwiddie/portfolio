import type React from 'react'
import { XStack, YStack, Button, Separator, Text } from 'tamagui'
import { Link } from 'expo-router'
import type {
  NavigationLinkControlViewProps,
  NavigationLinksViewProps,
  NavigationViewProps,
} from '../../../../features/systems/shell/frame/navigation/navigationSelectors'

const NavLink: React.FC<NavigationLinkControlViewProps> = ({
  href,
  label,
  current,
  onNavigate,
}) => (
  <Link href={href} push asChild>
    <Button
      chromeless
      pressStyle={{ opacity: 0.72 }}
      fontFamily="$body"
      onPress={onNavigate}
      aria-current={current}
    >
      <Text fontFamily="$body">{label}</Text>
    </Button>
  </Link>
)

const NavLinks: React.FC<NavigationLinksViewProps> = ({
  home,
  about,
  projects,
  status,
  onNavigate,
}) => (
  <>
    <NavLink {...home} onNavigate={onNavigate} />
    <NavLink {...about} onNavigate={onNavigate} />
    <NavLink {...projects} onNavigate={onNavigate} />
    <NavLink {...status} onNavigate={onNavigate} />
  </>
)

/**
 * Collapsible below 800px.
 *
 * Wrapping alone was not enough: with four routes plus three theme controls,
 * a wrapped nav consumed an entire phone viewport and had no way to close,
 * pushing the page content off screen. On narrow viewports it now collapses to
 * the brand plus a toggle, and closes on navigate, on Escape, and on toggle.
 */
const Nav: React.FC<NavigationViewProps> = ({
  pending,
  compact,
  open,
  menuLabel,
  menuText,
  home,
  about,
  projects,
  status,
  controls,
  onToggle,
  onNavigate,
}) =>
  pending ? (
    <XStack
      backgroundColor="$surface"
      borderBottomColor="$borderColor"
      borderBottomWidth={1}
      paddingHorizontal="$4"
      paddingVertical="$2"
    >
      <YStack
        width={150}
        height={40}
        backgroundColor="$gray5"
        borderRadius="$2"
        opacity={0.4}
      />
    </XStack>
  ) : (
    <YStack
      tag="nav"
      aria-label="Primary navigation"
      backgroundColor="$surface"
      borderBottomColor="$borderColor"
      borderBottomWidth={1}
      paddingHorizontal="$4"
      paddingVertical="$2"
    >
      <XStack alignItems="center" justifyContent="space-between" gap="$3">
        {controls.brand}

        {compact ? (
          <Button
            chromeless
            onPress={onToggle}
            aria-expanded={open}
            aria-controls="portfolio-navigation-menu"
            aria-label={menuLabel}
            fontFamily="$body"
          >
            <Text fontFamily="$body" fontSize="$2" letterSpacing={2}>
              {menuText}
            </Text>
          </Button>
        ) : (
          <XStack alignItems="center" gap="$3" flexShrink={1} flexWrap="wrap" rowGap="$2">
            <Separator vertical />
            <NavLinks
              home={home}
              about={about}
              projects={projects}
              status={status}
              onNavigate={onNavigate}
            />
            <Separator vertical />
            {controls.themeCustom}
            {controls.themeToggle}
            {controls.experienceToggle}
          </XStack>
        )}
      </XStack>

      {compact && open ? (
        <YStack
          id="portfolio-navigation-menu"
          gap="$2"
          paddingTop="$3"
          paddingBottom="$1"
        >
          <NavLinks
            home={home}
            about={about}
            projects={projects}
            status={status}
            onNavigate={onNavigate}
          />
          <Separator />
          {controls.themeToggle}
          {controls.themeCustom}
          {controls.experienceToggle}
        </YStack>
      ) : null}
    </YStack>
  )

export default Nav
