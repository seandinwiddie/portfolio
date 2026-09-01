import type React from 'react'
import { Text, XStack, YStack } from 'tamagui'
import type {
  UnitPlateRowViewModel,
  UnitPlateViewProps,
} from '../../../../features/systems/registry/dossier/ingress/ingressSelectors'

const PlateRow: React.FC<UnitPlateRowViewModel> = ({ label, value }) => (
  <XStack justifyContent="space-between" gap="$4" flexWrap="wrap">
    <Text
      className="readout-label"
      fontFamily="$body"
      fontSize="$2"
      letterSpacing={2}
      textTransform="uppercase"
    >
      {label}
    </Text>
    <Text fontFamily="$body" fontSize="$2" letterSpacing={1} flexShrink={1} ta="right">
      {value}
    </Text>
  </XStack>
)

const renderRows = (rows: readonly UnitPlateRowViewModel[]): React.ReactNode =>
  rows.map((row) => <PlateRow key={row.id} {...row} />)

const UnitPlate: React.FC<UnitPlateViewProps> = ({ visible, rows, heading, status }) =>
  visible ? (
    <YStack
      className="panel-frame plate-scan"
      borderWidth={1}
      borderColor="$borderColor"
      backgroundColor="$surface"
      padding="$4"
      gap="$2"
      width="100%"
      maxWidth={520}
    >
      <YStack
        className="plate-scan-beam"
        testID="unit-plate-scan-beam"
        aria-hidden={true}
      />
      <XStack justifyContent="space-between" alignItems="center" gap="$3" flexWrap="wrap">
        <Text
          className="readout-label"
          fontFamily="$body"
          fontSize="$1"
          letterSpacing={3}
        >
          {heading}
        </Text>
        <Text
          className="readout-label"
          fontFamily="$body"
          fontSize="$1"
          letterSpacing={2}
        >
          {status}
        </Text>
      </XStack>
      <YStack gap="$1">{renderRows(rows)}</YStack>
    </YStack>
  ) : null

export default UnitPlate
