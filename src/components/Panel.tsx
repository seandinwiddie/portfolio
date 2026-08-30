import React from 'react';
import { YStack, XStack, Text } from 'tamagui';

/**
 * A bracketed readout panel.
 *
 * The corner brackets and the all-caps eyebrow are the instrument vernacular
 * the repos already use (ASCII frames, [VOID::WATCHER], runic markers). The
 * eyebrow is structural rather than decorative: it names what the panel is a
 * readout OF, and the optional `meter` carries that panel's own count.
 */
interface PanelProps {
  label: string;
  meter?: string | number;
  children: React.ReactNode;
}

const Panel: React.FC<PanelProps> = ({ label, meter, children }) => (
  <YStack
    // Web-only: corner brackets have no React Native equivalent.
    className="panel-frame"
    borderWidth={1}
    borderColor="$borderColor"
    padding="$4"
    gap="$3"
    backgroundColor="$background"
  >
    <XStack justifyContent="space-between" alignItems="center" gap="$3" flexWrap="wrap">
      <Text
        fontFamily="$body"
        fontSize="$2"
        letterSpacing={3}
        textTransform="uppercase"
        opacity={0.7}
      >
        {label}
      </Text>
      {meter !== undefined ? (
        <Text fontFamily="$body" fontSize="$2" letterSpacing={2} opacity={0.5}>
          {meter}
        </Text>
      ) : null}
    </XStack>
    {children}
  </YStack>
);

export default Panel;
