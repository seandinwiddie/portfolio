import type React from 'react'
import { Text, XStack, YStack } from 'tamagui'
import type {
  UnitPlateRowViewModel,
  UnitPlateViewProps,
} from '../../../../features/systems/portfolio/profile/welcome/welcomeSelectors'

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

const renderRows = ([row, ...rest]: readonly UnitPlateRowViewModel[]): React.ReactNode =>
  row ? (
    <>
      <PlateRow {...row} />
      {renderRows(rest)}
    </>
  ) : null

const UnitPlate: React.FC<UnitPlateViewProps> = ({ visible, rows }) =>
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
      <XStack justifyContent="space-between" alignItems="center" gap="$3" flexWrap="wrap">
        <Text
          className="readout-label"
          fontFamily="$body"
          fontSize="$1"
          letterSpacing={3}
        >
          ARCHIVE UNIT RECORD
        </Text>
        <Text
          className="readout-label"
          fontFamily="$body"
          fontSize="$1"
          letterSpacing={2}
        >
          ● OPERATIONAL
        </Text>
      </XStack>
      <YStack gap="$1">{renderRows(rows)}</YStack>
    </YStack>
  ) : null

export default UnitPlate
