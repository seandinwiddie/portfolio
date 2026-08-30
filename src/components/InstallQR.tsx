import React from 'react';
import { YStack, XStack, Text, Paragraph, Anchor } from 'tamagui';
import QRCode from 'react-native-qrcode-svg';
import { Platform } from 'react-native';

const SITE_URL = 'https://portfolio.sdin.dev';

/**
 * This is the same Expo codebase running on web, iOS and Android. Set
 * EXPO_PUBLIC_NATIVE_APP_URL (an EAS Update / TestFlight / Play link) and the
 * code becomes a native install; until then it points at the site so a visitor
 * can still open it on a phone.
 */
const NATIVE_URL = process.env.EXPO_PUBLIC_NATIVE_APP_URL;
const target = NATIVE_URL || SITE_URL;
const isNative = Boolean(NATIVE_URL);

const InstallQR: React.FC = () => {
  // The QR is only useful to someone holding a second device.
  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <YStack
      alignItems="center"
      gap="$3"
      padding="$4"
      borderWidth={1}
      borderColor="$borderColor"
      borderRadius="$4"
      maxWidth={420}
    >
      <Text fontFamily="$heading" fontWeight="bold" ta="center">
        {isNative ? 'Also a native app' : 'Open this on your phone'}
      </Text>
      <Paragraph fontFamily="$body" ta="center" fontSize="$3" opacity={0.85}>
        {isNative
          ? 'One Expo codebase — this same page ships to iOS and Android. Scan to install it.'
          : 'One Expo codebase — this same page also builds as a native iOS and Android app. Scan to open it here.'}
      </Paragraph>
      {/* White quiet-zone: QR contrast must not depend on the active theme. */}
      <YStack backgroundColor="#ffffff" padding="$3" borderRadius="$3">
        <QRCode value={target} size={160} backgroundColor="#ffffff" color="#000000" />
      </YStack>
      <Anchor href={target} target="_blank" rel="noopener noreferrer" fontFamily="$body" fontSize="$2">
        {target.replace(/^https:\/\//, '')}
      </Anchor>
    </YStack>
  );
};

export default InstallQR;
