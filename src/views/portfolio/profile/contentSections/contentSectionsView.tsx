import type React from 'react'
import { Card, H2, Paragraph, ScrollView, YStack } from 'tamagui'
import type {
  ContentItemViewModel,
  ContentSectionViewModel,
  ContentViewProps,
} from '../../../../features/systems/portfolio/profile/content/contentSelectors'

const ContentCard: React.FC<ContentItemViewModel> = ({ title, description }) => (
  <Card padding="$4" elevate backgroundColor="$surface">
    <H2 color="$color" fontFamily="$heading">
      {title}
    </H2>
    <Paragraph fontFamily="$body">{description}</Paragraph>
  </Card>
)

const renderItems = ([
  item,
  ...rest
]: readonly ContentItemViewModel[]): React.ReactNode =>
  item ? (
    <>
      <ContentCard {...item} />
      {renderItems(rest)}
    </>
  ) : null

const ContentSection: React.FC<ContentSectionViewModel> = ({
  heading,
  emptyLabel,
  items,
}) => (
  <>
    <H2 fontFamily="$heading">{heading}</H2>
    {items.length > 0 ? (
      renderItems(items)
    ) : (
      <Paragraph fontFamily="$body">{emptyLabel}</Paragraph>
    )}
  </>
)

const renderSections = ([
  section,
  ...rest
]: readonly ContentSectionViewModel[]): React.ReactNode =>
  section ? (
    <>
      <ContentSection {...section} />
      {renderSections(rest)}
    </>
  ) : null

const ContentSections: React.FC<ContentViewProps> = ({ sections }) => (
  <ScrollView>
    <YStack padding="$4" space="$4">
      {renderSections(sections)}
    </YStack>
  </ScrollView>
)

export default ContentSections
