import type React from 'react'
import { Text, Spinner, Button } from 'tamagui'
import { Link } from 'expo-router'
import type { BrandNameViewProps } from '../../../../features/systems/shell/frame/brandName/brandNameSelectors'

const BrandName: React.FC<BrandNameViewProps> = ({
  brandName,
  accessibilityLabel,
  isLoading,
}) =>
  isLoading ? (
    <Spinner size="small" color="$color" />
  ) : (
    // asChild onto a Button, not a Text: react-native-web renders Text as a
    // <span>, so the brand was a span carrying an inert href -- not keyboard
    // focusable, no open-in-new-tab, and announced as a link with no
    // destination. A Button renders a real <a href> with tabindex.
    <Link href="/" push asChild>
      <Button chromeless paddingHorizontal="$0" aria-label={accessibilityLabel}>
        <Text fontSize={24} fontWeight="bold" color="$color" fontFamily="$heading">
          {brandName}
        </Text>
      </Button>
    </Link>
  )

export default BrandName
