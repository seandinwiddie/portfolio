import type React from 'react'
import { XStack, Anchor, Paragraph } from 'tamagui'
import type {
  UtilityRailLinkViewModel,
  UtilityRailViewProps,
} from '../../../../features/systems/bridge/chassis/utilityRail/utilityRailSelectors'

const UtilityRailLink: React.FC<UtilityRailLinkViewModel> = ({ url, label }) => (
  <Anchor
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    color="$link"
    display="flex"
    alignItems="center"
    justifyContent="center"
    minWidth={44}
    minHeight={44}
    paddingHorizontal="$2"
    textDecorationLine="none"
    hoverStyle={{ color: '$linkHover' }}
  >
    <Paragraph fontFamily="$body">{label}</Paragraph>
  </Anchor>
)

const renderLinks = (links: readonly UtilityRailLinkViewModel[]): React.ReactNode =>
  links.map((link) => <UtilityRailLink key={link.url} {...link} />)

const UtilityRail: React.FC<UtilityRailViewProps> = ({ links }) => (
  <XStack
    backgroundColor="$surface"
    borderTopColor="$borderColor"
    borderTopWidth={1}
    paddingHorizontal="$4"
    paddingVertical="$2"
    alignItems="center"
    justifyContent="space-between"
    gap="$3"
    flexWrap="wrap"
    tag="footer"
  >
    {renderLinks(links)}
  </XStack>
)

export default UtilityRail
