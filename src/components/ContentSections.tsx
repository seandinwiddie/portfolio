import React from 'react';
import { ScrollView, YStack, Card, H2, Paragraph, AnimatePresence } from 'tamagui';
import { useAppSelector } from '../store/hooks';
import { selectAppProcedures, selectPortfolioFeatures } from '../features/body/bodySlice';
import type { ContentItem } from '../data/schemas';

// Home.tsx and About.tsx were byte-identical copies of this markup. The two
// sections differ only in this declaration data, so one renderer is folded over
// it rather than repeating the JSX per section.
interface SectionSpec {
  readonly idPrefix: string;
  readonly heading: string;
  readonly emptyLabel: string;
}

const SECTIONS: readonly SectionSpec[] = [
  { idPrefix: 'feature', heading: 'Portfolio Features', emptyLabel: 'No portfolio features available' },
  { idPrefix: 'procedure', heading: 'App Procedures', emptyLabel: 'No app procedures available' },
];

// Returns a flat array so the elements stay *keyed direct children* of
// AnimatePresence -- nesting them under a wrapper component hides the keys and
// the enter/exit animations stop tracking them.
const sectionNodes = (spec: SectionSpec, items: ContentItem[]): React.ReactNode[] => [
  <H2
    key={`${spec.idPrefix}-header`}
    animation="lazy"
    enterStyle={{ opacity: 0, y: -10 }}
    fontFamily="$heading"
  >
    {spec.heading}
  </H2>,
  ...(items.length > 0
    ? items.map((item) => (
        <Card
          key={`${spec.idPrefix}-${item.id}`}
          padding="$4"
          elevate
          animation="lazy"
          enterStyle={{ opacity: 0, x: -10 }}
          exitStyle={{ opacity: 0, x: -10 }}
        >
          <H2 color="$color" fontFamily="$heading">{item.title}</H2>
          <Paragraph fontFamily="$body">{item.description}</Paragraph>
        </Card>
      ))
    : [
        <Paragraph key={`${spec.idPrefix}-empty`} fontFamily="$body">
          {spec.emptyLabel}
        </Paragraph>,
      ]),
];

const ContentSections: React.FC = () => {
  const portfolioFeatures = useAppSelector(selectPortfolioFeatures);
  const appProcedures = useAppSelector(selectAppProcedures);
  const itemsByPrefix: Record<string, ContentItem[]> = {
    feature: portfolioFeatures,
    procedure: appProcedures,
  };

  return (
    <ScrollView>
      <YStack padding="$4" space="$4">
        <AnimatePresence>
          {SECTIONS.flatMap((spec) => sectionNodes(spec, itemsByPrefix[spec.idPrefix]))}
        </AnimatePresence>
      </YStack>
    </ScrollView>
  );
};

export default ContentSections;
