import type React from 'react'
import { Anchor, Text, Spinner } from 'tamagui'
import { Link } from 'expo-router'
import type { BrandNameViewProps } from '../../../../features/systems/bridge/chassis/brandName/brandNameSelectors'

const BrandName: React.FC<BrandNameViewProps> = ({
  brandName,
  accessibilityLabel,
  isLoading,
  visible,
}) =>
  visible ? (
    <Link href="/" push asChild>
      <Anchor
        display="flex"
        alignItems="center"
        minHeight={44}
        paddingHorizontal="$0"
        aria-label={accessibilityLabel}
        textDecorationLine="none"
      >
        {isLoading ? (
          <Spinner size="small" color="$color" />
        ) : (
          <Text fontSize={24} fontWeight="bold" color="$color" fontFamily="$heading">
            {brandName || '◈'}
          </Text>
        )}
      </Anchor>
    </Link>
  ) : null

export default BrandName
