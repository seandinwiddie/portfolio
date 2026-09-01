import type React from 'react'
import { FlatList, type ListRenderItem } from 'react-native'
import { YStack, XStack, Text, Input, Button } from 'tamagui'
import type {
  ArchiveControlViewProps,
  ArchiveLineViewModel,
} from '../../../../features/systems/bridge/console/archiveControl/archiveControlSelectors'
import { MAX_ARCHIVE_COMMAND_LENGTH } from '../../../../features/systems/bridge/console/archiveControl/command/commandSelectors'

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
  announcement,
  placeholder,
  heading,
  closeLabel,
  closeText,
  commandLabel,
  dialogLabel,
  openLabel,
  triggerLabel,
  isWeb,
  onOpen,
  onClose,
  onEntryChange,
  onSubmit,
  onInputKey,
  onDialogMount,
  onDialogCancel,
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
          {heading}
        </Text>
        <Button
          testID="archive-control-close"
          chromeless
          size="$2"
          minWidth={44}
          minHeight={44}
          fontFamily="$body"
          fontSize="$1"
          onPress={onClose}
          cursor="pointer"
          accessibilityLabel={closeLabel}
          accessibilityRole="button"
        >
          {closeText}
        </Button>
      </XStack>

      <FlatList
        data={lines}
        renderItem={renderLine}
        keyExtractor={(item) => item.id}
        style={{ maxHeight: 220 }}
      />
      <Text
        className="visually-hidden"
        aria-live="polite"
        accessibilityLiveRegion="polite"
      >
        {announcement}
      </Text>

      <XStack gap="$2" alignItems="center">
        <Text className="readout-label" fontFamily="$heading" fontSize="$3">
          {'>'}
        </Text>
        <Input
          testID="archive-control-input"
          flex={1}
          size="$3"
          minHeight={44}
          value={entry}
          maxLength={MAX_ARCHIVE_COMMAND_LENGTH}
          onChangeText={onEntryChange}
          onSubmitEditing={onSubmit}
          onKeyPress={(event) => onInputKey(event.nativeEvent.key)}
          placeholder={placeholder}
          accessibilityLabel={commandLabel}
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
      <dialog
        ref={onDialogMount}
        className="archive-control-dialog"
        aria-label={dialogLabel}
        aria-modal="true"
        onCancel={onDialogCancel}
      >
        {panel}
      </dialog>
    ) : (
      <YStack
        className="archive-control-native-mount"
        position="absolute"
        bottom={56}
        left={12}
        right={12}
        maxWidth={640}
        zIndex={100}
        accessibilityLabel={dialogLabel}
        accessibilityViewIsModal
      >
        {panel}
      </YStack>
    )
  ) : (
    <XStack
      className="archive-control-trigger-mount"
      position="absolute"
      bottom={56}
      left={12}
      pointerEvents="box-none"
    >
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
        accessibilityLabel={openLabel}
        accessibilityRole="button"
        aria-keyshortcuts={ARCHIVE_KEY_SHORTCUTS}
      >
        {triggerLabel}
      </Button>
    </XStack>
  )
}

export default ArchiveControl
