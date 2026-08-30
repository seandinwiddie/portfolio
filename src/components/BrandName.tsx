import React from 'react';
import { Text, Spinner, Button } from 'tamagui';
import { Link } from 'expo-router';
import { useAppSelector } from '../store/hooks';
import { selectBrandName, selectBrandNameLoading } from '../features/brandName/brandNameSlice';

const BrandName: React.FC = () => {
  const brandName = useAppSelector(selectBrandName);
  const isLoading = useAppSelector(selectBrandNameLoading);

  if (isLoading) {
    return <Spinner size="small" color="$color" />;
  }

  return (
    // asChild onto a Button, not a Text: react-native-web renders Text as a
    // <span>, so the brand was a span carrying an inert href -- not keyboard
    // focusable, no open-in-new-tab, and announced as a link with no
    // destination. A Button renders a real <a href> with tabindex.
    <Link href="/" push asChild>
      <Button chromeless paddingHorizontal="$0" aria-label={`${brandName} — home`}>
        <Text fontSize={24} fontWeight="bold" color="$color" fontFamily="$heading">
          {brandName}
        </Text>
      </Button>
    </Link>
  );
};

export default BrandName;
