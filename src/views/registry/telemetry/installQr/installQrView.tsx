import type React from 'react'
import QRCode from 'react-native-qrcode-svg'
import { Anchor, Paragraph, Text, YStack } from 'tamagui'
import type { InstallQrViewProps } from '../../../../features/systems/registry/dossier/ingress/ingressSelectors'

const InstallQR: React.FC<InstallQrViewProps> = ({
  visible,
  target,
  linkLabel,
  title,
  description,
}) =>
  visible ? (
    <YStack
      alignItems="center"
      gap="$3"
      padding="$4"
      borderWidth={1}
      borderColor="$borderColor"
      backgroundColor="$surface"
      className="panel-frame"
      maxWidth={420}
    >
      <Text fontFamily="$heading" fontWeight="bold" ta="center">
        {title}
      </Text>
      <Paragraph fontFamily="$body" ta="center" fontSize="$3">
        {description}
      </Paragraph>
      <YStack backgroundColor="#ffffff" padding="$3" borderRadius="$3">
        <QRCode value={target} size={160} backgroundColor="#ffffff" color="#000000" />
      </YStack>
      <Anchor
        href={target}
        target="_blank"
        rel="noopener noreferrer"
        fontFamily="$body"
        fontSize="$2"
        minWidth={44}
        minHeight={44}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        {linkLabel}
      </Anchor>
    </YStack>
  ) : null

export default InstallQR
