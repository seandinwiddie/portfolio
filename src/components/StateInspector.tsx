import React, { useSyncExternalStore } from 'react';
import { YStack, XStack, Text, Button, ScrollView, Separator } from 'tamagui';
import { useAppSelector } from '../store/hooks';
import { actionLog, getServerSnapshot } from '../store/actionLog';
import { selectThemeMode, selectThemes } from '../features/themeToggle/themeToggleSlice';
import { selectBrandName } from '../features/brandName/brandNameSlice';
import {
  selectAppProcedures,
  selectDataSource,
  selectPortfolioFeatures,
} from '../features/body/bodySlice';

const timeOf = (at: number) => new Date(at).toLocaleTimeString(undefined, { hour12: false });

/**
 * A live view of the Redux store: every dispatched action and the current state
 * of each slice, updating as the visitor uses the site. The theme switcher and
 * the data fetch both run through this store, so it is a real trace, not a demo.
 */
const StateInspector: React.FC = () => {
  const [open, setOpen] = React.useState(false);

  const actions = useSyncExternalStore(actionLog.subscribe, actionLog.getSnapshot, getServerSnapshot);

  const themeMode = useAppSelector(selectThemeMode);
  const themes = useAppSelector(selectThemes);
  const brandName = useAppSelector(selectBrandName);
  const features = useAppSelector(selectPortfolioFeatures);
  const procedures = useAppSelector(selectAppProcedures);
  const source = useAppSelector(selectDataSource);

  const slices: ReadonlyArray<readonly [string, string]> = [
    ['themeToggle.mode', themeMode],
    ['themeToggle.themes', `${themes.length} discovered`],
    ['brandName.value', brandName || '—'],
    ['body.portfolioFeatures', `${features.length} items`],
    ['body.appProcedures', `${procedures.length} items`],
    ['body.source', source],
  ];

  return (
    <YStack
      position="absolute"
      bottom={0}
      right={0}
      left={0}
      alignItems="flex-end"
      padding="$3"
      pointerEvents="box-none"
    >
      {open ? (
        <YStack
          backgroundColor="$background"
          borderColor="$borderColor"
          borderWidth={1}
          borderRadius="$4"
          padding="$3"
          gap="$2"
          width="100%"
          maxWidth={420}
          maxHeight={360}
          elevation="$4"
        >
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontFamily="$heading" fontWeight="bold">Redux store — live</Text>
            <XStack gap="$2">
              <Button size="$2" chromeless onPress={() => actionLog.clear()}>clear</Button>
              <Button size="$2" chromeless onPress={() => setOpen(false)}>close</Button>
            </XStack>
          </XStack>

          <Separator />
          <Text fontFamily="$body" fontSize="$2" opacity={0.7}>state</Text>
          <YStack gap="$1">
            {slices.map(([label, value]) => (
              <XStack key={label} justifyContent="space-between" gap="$3">
                <Text fontFamily="$body" fontSize="$2" opacity={0.8}>{label}</Text>
                <Text fontFamily="$body" fontSize="$2" fontWeight="bold">{value}</Text>
              </XStack>
            ))}
          </YStack>

          <Separator />
          <Text fontFamily="$body" fontSize="$2" opacity={0.7}>
            dispatched actions ({actions.length})
          </Text>
          <ScrollView maxHeight={140}>
            <YStack gap="$1">
              {actions.length === 0 ? (
                <Text fontFamily="$body" fontSize="$2" opacity={0.6}>
                  Nothing yet — switch the theme and watch.
                </Text>
              ) : (
                actions.map((entry) => (
                  <XStack key={entry.id} justifyContent="space-between" gap="$3">
                    <Text fontFamily="$body" fontSize="$2" numberOfLines={1}>{entry.type}</Text>
                    <Text fontFamily="$body" fontSize="$1" opacity={0.6}>{timeOf(entry.at)}</Text>
                  </XStack>
                ))
              )}
            </YStack>
          </ScrollView>
        </YStack>
      ) : (
        <Button size="$3" onPress={() => setOpen(true)} aria-label="Open the live Redux store inspector">
          Redux {actions.length > 0 ? `(${actions.length})` : ''}
        </Button>
      )}
    </YStack>
  );
};

export default StateInspector;
