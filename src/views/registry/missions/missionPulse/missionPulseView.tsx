import type React from 'react'
import { Anchor, Text, XStack, YStack } from 'tamagui'
import type {
  MissionActivityKindViewModel,
  MissionActivityRepoViewModel,
  MissionActivityViewModel,
} from '../../../../features/systems/registry/missions/operations/operationsSelectors'
import Panel from '../../../aperture/panel/panelView'

const Pill: React.FC<React.PropsWithChildren> = ({ children }) => (
  <XStack
    paddingHorizontal="$3"
    paddingVertical="$1"
    borderRadius="$10"
    borderWidth={1}
    borderColor="$borderColor"
    alignItems="center"
    gap="$2"
  >
    {children}
  </XStack>
)

const ActivityKind: React.FC<MissionActivityKindViewModel> = ({ label, count }) => (
  <Pill>
    <Text fontFamily="$body" fontSize="$3">
      {label}
    </Text>
    <Text className="readout-label" fontFamily="$body" fontSize="$2">
      {count}
    </Text>
  </Pill>
)

const renderKinds = (items: readonly MissionActivityKindViewModel[]): React.ReactNode =>
  items.map((item) => <ActivityKind key={item.id} {...item} />)

const ActivityRepo: React.FC<MissionActivityRepoViewModel> = ({
  label,
  href,
  detail,
}) => (
  <XStack justifyContent="space-between" gap="$3" flexWrap="wrap">
    <Anchor
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      fontFamily="$body"
      fontSize="$3"
      flexShrink={1}
      minWidth={44}
      minHeight={44}
      display="flex"
      alignItems="center"
    >
      {label}
    </Anchor>
    <Text fontFamily="$body" fontSize="$3" opacity={0.8}>
      {detail}
    </Text>
  </XStack>
)

const renderRepos = (items: readonly MissionActivityRepoViewModel[]): React.ReactNode =>
  items.map((item) => <ActivityRepo key={item.id} {...item} />)

const MissionActivity: React.FC<MissionActivityViewModel> = ({
  label,
  meter,
  kinds,
  repos,
  summary,
}) => (
  <Panel label={label} meter={meter}>
    <YStack gap="$3">
      <XStack flexWrap="wrap" gap="$2">
        {renderKinds(kinds)}
      </XStack>
      <YStack gap="$2">{renderRepos(repos)}</YStack>
      {summary ? (
        <Text className="readout-label" fontFamily="$body" fontSize="$2">
          {summary}
        </Text>
      ) : null}
    </YStack>
  </Panel>
)

export default MissionActivity
