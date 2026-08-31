import type React from 'react'
import { FlatList, type ListRenderItem } from 'react-native'
import { YStack, XStack, Text, Input, Button } from 'tamagui'
import type {
  ArchiveControlViewProps,
  ArchiveLineViewModel,
} from '../../../../features/systems/shell/controls/archiveControl/archiveControlSelectors'

const ARCHIVE_KEY_SHORTCUTS = 'Control+K Meta+K `'

const renderLine: ListRenderItem<ArchiveLineViewModel> = ({ item }) => (
  <Text className={item.className} fontFamily="$heading" fontSize="$2">
    {item.text}
  </Text>
)

const ArchiveControl: React.FC<ArchiveControlViewProps> = ({
  open,
  entry,
  lines,
  placeholder,
  isWeb,
  onOpen,
  onClose,
  onEntryChange,
  onSubmit,
  onInputKey,
}) => {
  const panel = (
    <YStack
      className="panel-frame"
      width="100%"
      backgroundColor="$surface"
      borderWidth={1}
      borderColor="$borderColor"
      padding="$3"
      gap="$2"
    >
      <XStack justifyContent="space-between" alignItems="center">
        <Text
          className="readout-label"
          fontFamily="$body"
          fontSize="$1"
          letterSpacing={3}
        >
          ARCHIVE CONTROL
        </Text>
        <Button
          testID="archive-control-close"
          chromeless
          size="$2"
          fontFamily="$body"
          fontSize="$1"
          onPress={onClose}
          cursor="pointer"
          accessibilityLabel="Close Archive Control"
          accessibilityRole="button"
        >
          close
        </Button>
      </XStack>

      <FlatList
        data={lines}
        renderItem={renderLine}
        keyExtractor={(item) => item.id}
        style={{ maxHeight: 220 }}
      />

      <XStack gap="$2" alignItems="center">
        <Text className="readout-label" fontFamily="$heading" fontSize="$3">
          &gt;
        </Text>
        <Input
          testID="archive-control-input"
          flex={1}
          size="$3"
          value={entry}
          onChangeText={onEntryChange}
          onSubmitEditing={onSubmit}
          onKeyPress={(event) => onInputKey(event.nativeEvent.key)}
          placeholder={placeholder}
          accessibilityLabel="Archive Control command"
          fontFamily="$heading"
          borderWidth={0}
          backgroundColor="transparent"
          autoFocus
          blurOnSubmit={false}
        />
      </XStack>
    </YStack>
  )

  return open ? (
    isWeb ? (
      <dialog open className="archive-control-dialog" aria-label="Archive Control">
        {panel}
      </dialog>
    ) : (
      <YStack
        position="absolute"
        bottom={56}
        left={12}
        right={12}
        maxWidth={640}
        zIndex={100}
        accessibilityLabel="Archive Control"
        accessibilityViewIsModal
      >
        {panel}
      </YStack>
    )
  ) : (
    <XStack position="absolute" bottom={56} left={12} pointerEvents="box-none">
      <Button
        testID="archive-control-trigger"
        chromeless
        size="$2"
        backgroundColor="$surface"
        borderWidth={1}
        borderColor="$controlBorder"
        fontFamily="$body"
        fontSize="$1"
        letterSpacing={2}
        onPress={onOpen}
        cursor="pointer"
        accessibilityLabel="Open Archive Control"
        accessibilityRole="button"
        aria-keyshortcuts={ARCHIVE_KEY_SHORTCUTS}
      >
        ` ARCHIVE CONTROL
      </Button>
    </XStack>
  )
}

export default ArchiveControl
