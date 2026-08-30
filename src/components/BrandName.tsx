import React from 'react';
import { Text, Spinner } from 'tamagui';
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
    // expo-router Link rather than a raw <a>: the anchor is invalid on native and
    // triggered a full page reload instead of client-side navigation on web.
    <Link href="/" asChild>
      <Text
        fontSize={24}
        fontWeight="bold"
        color="$color"
        fontFamily="$heading"  // This ensures Dank Mono is used
        cursor="pointer"
      >
        {brandName}
      </Text>
    </Link>
  );
};

export default BrandName;
