import React from 'react';
import { Text, Spinner } from 'tamagui';
import { useAppSelector } from '../app/hooks';

const BrandName: React.FC = () => {
  const { value: brandName, isLoading } = useAppSelector((state) => state.brandName);

  if (isLoading) {
    return <Spinner size="small" color="$color" />;
  }

  return (
    <Text 
      fontSize={24} 
      fontWeight="bold" 
      color="$color" 
      fontFamily="$heading"  // This ensures Dank Mono is used
    >
      <a href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
        {brandName}
      </a>
    </Text>
  );
};

export default BrandName;
