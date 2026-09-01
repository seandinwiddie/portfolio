import type React from 'react'
import { Card, H2, Paragraph, ScrollView, YStack } from 'tamagui'
import type {
  RegistryRecordViewModel,
  RecordBankViewModel,
  RecordsViewProps,
} from '../../../../features/systems/registry/dossier/records/recordsSelectors'

const RecordCard: React.FC<RegistryRecordViewModel> = ({ title, description }) => (
  <Card className="system-glass-surface" padding="$4" elevate backgroundColor="$surface">
    <H2 color="$color" fontFamily="$heading">
      {title}
    </H2>
    <Paragraph fontFamily="$body">{description}</Paragraph>
  </Card>
)

const renderItems = (items: readonly RegistryRecordViewModel[]): React.ReactNode =>
  items.map((item) => <RecordCard key={item.id} {...item} />)

const RecordBank: React.FC<RecordBankViewModel> = ({ heading, emptyLabel, items }) => (
  <>
    <H2 fontFamily="$heading">{heading}</H2>
    {items.length > 0 ? (
      renderItems(items)
    ) : (
      <Paragraph fontFamily="$body">{emptyLabel}</Paragraph>
    )}
  </>
)

const renderSections = (sections: readonly RecordBankViewModel[]): React.ReactNode =>
  sections.map((section) => <RecordBank key={section.id} {...section} />)

const RecordBanks: React.FC<RecordsViewProps> = ({ sections }) => (
  <ScrollView>
    <YStack padding="$4" space="$4">
      {renderSections(sections)}
    </YStack>
  </ScrollView>
)

export default RecordBanks
