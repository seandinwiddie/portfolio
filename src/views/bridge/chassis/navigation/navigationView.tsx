import type React from 'react'
import { Anchor, XStack, YStack, Button, Text } from 'tamagui'
import { Link } from 'expo-router'
import type {
  NavigationLinkControlPresentationViewProps,
  NavigationLinksViewProps,
  NavigationViewProps,
} from '../../../../features/systems/bridge/chassis/navigation/navigationSelectors'
import { selectNavigationAriaLabel } from '../../../../features/systems/bridge/chassis/navigation/navigationSelectors'

const NavLink: React.FC<NavigationLinkControlPresentationViewProps> = ({
  href,
  index,
  label,
  systemLabel,
  current,
  onNavigate,
  presentation,
}) => (
  <Link href={href} push asChild>
    <Anchor
      className={`system-nav-link system-nav-link--${presentation}`}
      display="flex"
      alignItems="center"
      gap="$2"
      minHeight={44}
      minWidth={0}
      width={presentation === 'rail' ? '100%' : undefined}
      flex={presentation === 'dock' ? 1 : undefined}
      justifyContent={presentation === 'rail' ? 'flex-start' : 'center'}
      pressStyle={{ opacity: 0.72 }}
      fontFamily="$body"
      onPress={onNavigate}
      aria-current={current}
      aria-label={selectNavigationAriaLabel(label, systemLabel)}
      textDecorationLine="none"
    >
      <Text className="system-nav-index" fontFamily="$body" fontSize="$1">
        {index}
      </Text>
      <YStack
        className="system-nav-copy"
        alignItems={presentation === 'rail' ? 'flex-start' : 'center'}
        minWidth={0}
      >
        <Text className="system-nav-primary" fontFamily="$body" fontSize="$2">
          {label}
        </Text>
        <Text
          className="system-nav-secondary"
          fontFamily="$body"
          fontSize="$1"
          opacity={0.68}
        >
          {systemLabel}
        </Text>
      </YStack>
    </Anchor>
  </Link>
)

const NavLinks: React.FC<NavigationLinksViewProps> = ({
  nexus,
  dossier,
  missions,
  telemetry,
  onNavigate,
  presentation,
}) => (
  <>
    <NavLink {...nexus} presentation={presentation} onNavigate={onNavigate} />
    <NavLink {...dossier} presentation={presentation} onNavigate={onNavigate} />
    <NavLink {...missions} presentation={presentation} onNavigate={onNavigate} />
    <NavLink {...telemetry} presentation={presentation} onNavigate={onNavigate} />
  </>
)

type NavigationDockViewProps = Omit<NavigationViewProps, 'controls'>

export const NavigationDock: React.FC<NavigationDockViewProps> = ({
  pending,
  pendingLabel,
  primaryLabel,
  nexus,
  dossier,
  missions,
  telemetry,
  onNavigate,
}) => (
  <XStack
    tag="nav"
    aria-label={pending ? pendingLabel : primaryLabel}
    aria-busy={pending}
    className="system-route-dock"
    alignItems="stretch"
    width="100%"
  >
    <NavLinks
      nexus={nexus}
      dossier={dossier}
      missions={missions}
      telemetry={telemetry}
      presentation="dock"
      onNavigate={onNavigate}
    />
  </XStack>
)

/**
 * Desktop uses a vertical command rail. Compact screens retain a small brand
 * bar and expose appearance controls in a drawer while routes remain reachable
 * in the persistent dock.
 */
const Nav: React.FC<NavigationViewProps> = ({
  pending,
  open,
  menuLabel,
  menuText,
  pendingLabel,
  arrayLabel,
  appearanceLabel,
  operationsLabel,
  primaryLabel,
  nexus,
  dossier,
  missions,
  telemetry,
  controls,
  onToggle,
  onNavigate,
}) => (
  <>
    <YStack
      tag="nav"
      aria-label={pending ? pendingLabel : arrayLabel}
      aria-busy={pending}
      className="system-navigation system-navigation--compact"
      backgroundColor="$surface"
    >
      <XStack
        className="system-navigation-bar"
        alignItems="center"
        justifyContent="space-between"
        gap="$3"
        paddingHorizontal="$3"
        paddingVertical="$2"
      >
        {controls.brand}
        <Button
          className="system-controls-toggle"
          testID="appearance-controls-toggle"
          chromeless
          minHeight={44}
          onPress={onToggle}
          aria-expanded={open}
          aria-controls="registry-appearance-controls"
          aria-label={menuLabel}
          fontFamily="$body"
        >
          <Text
            className="system-controls-toggle-copy"
            fontFamily="$body"
            fontSize="$1"
            letterSpacing={1.4}
          >
            {menuText}
          </Text>
        </Button>
      </XStack>

      {open ? (
        <YStack
          id="registry-appearance-controls"
          className="system-controls-drawer"
          gap="$2"
          paddingHorizontal="$3"
          paddingTop="$2"
          paddingBottom="$3"
        >
          <Text
            className="readout-label"
            fontFamily="$body"
            fontSize="$1"
            letterSpacing={1.6}
            textTransform="uppercase"
          >
            {appearanceLabel}
          </Text>
          {controls.themeToggle}
          {controls.themeCustom}
        </YStack>
      ) : null}
    </YStack>

    <YStack
      tag="nav"
      aria-label={pending ? pendingLabel : arrayLabel}
      aria-busy={pending}
      className="system-navigation system-navigation--rail"
      backgroundColor="$surface"
      paddingHorizontal="$4"
      paddingVertical="$4"
    >
      <YStack className="system-navigation-header" gap="$2">
        {controls.brand}
        <Text
          className="readout-label"
          fontFamily="$body"
          fontSize="$1"
          letterSpacing={1.8}
          textTransform="uppercase"
        >
          {operationsLabel}
        </Text>
      </YStack>

      <YStack className="system-navigation-routes" flex={1} gap="$2" paddingTop="$6">
        <Text
          className="readout-label"
          fontFamily="$body"
          fontSize="$1"
          letterSpacing={1.8}
          textTransform="uppercase"
        >
          {primaryLabel}
        </Text>
        <NavLinks
          nexus={nexus}
          dossier={dossier}
          missions={missions}
          telemetry={telemetry}
          presentation="rail"
          onNavigate={onNavigate}
        />
      </YStack>

      <YStack className="system-navigation-controls" gap="$2" paddingTop="$4">
        <Text
          className="readout-label"
          fontFamily="$body"
          fontSize="$1"
          letterSpacing={1.8}
          textTransform="uppercase"
        >
          {appearanceLabel}
        </Text>
        {controls.themeToggle}
        {controls.themeCustom}
      </YStack>
    </YStack>
  </>
)

export default Nav
