import type React from 'react'
import { Anchor, H1, H3, Paragraph, Spinner, Text, XStack, YStack } from 'tamagui'
import type {
  AboutDomainViewModel,
  AboutLanguageSpectrumViewModel,
  AboutLanguageViewModel,
  AboutPrincipleViewModel,
  AboutRepoViewModel,
  AboutStatViewModel,
  AboutViewProps,
} from '../../../../features/systems/portfolio/profile/about/aboutSelectors'
import Panel from '../../../shared/panel/panelView'
import Screen from '../../../shared/screen/screenView'

const StatColumn: React.FC<AboutStatViewModel> = ({ value, label }) => (
  <YStack minWidth={104} gap="$1">
    <Text fontFamily="$heading" fontSize="$9" fontWeight="bold" letterSpacing={-1}>
      {value}
    </Text>
    <Text
      className="readout-label"
      fontFamily="$body"
      fontSize="$1"
      letterSpacing={2}
      textTransform="uppercase"
    >
      {label}
    </Text>
  </YStack>
)

const renderStats = ([stat, ...rest]: readonly AboutStatViewModel[]): React.ReactNode =>
  stat ? (
    <>
      <StatColumn {...stat} />
      {renderStats(rest)}
    </>
  ) : null

const RepoChip: React.FC<AboutRepoViewModel> = ({ name, language, htmlUrl }) => (
  <Anchor
    href={htmlUrl}
    target="_blank"
    rel="noopener noreferrer"
    textDecorationLine="none"
    color="$link"
    hoverStyle={{ color: '$linkHover' }}
  >
    <XStack
      paddingHorizontal="$3"
      paddingVertical="$1"
      borderWidth={1}
      borderColor="$controlBorder"
      gap="$2"
      alignItems="center"
      hoverStyle={{ borderColor: '$focus' }}
    >
      <Text fontFamily="$body" fontSize="$2">
        {name}
      </Text>
      {language ? (
        <Text className="readout-label" fontFamily="$body" fontSize="$1">
          {language}
        </Text>
      ) : null}
    </XStack>
  </Anchor>
)

const renderRepos = ([repo, ...rest]: readonly AboutRepoViewModel[]): React.ReactNode =>
  repo ? (
    <>
      <RepoChip {...repo} />
      {renderRepos(rest)}
    </>
  ) : null

const DomainPanel: React.FC<AboutDomainViewModel> = ({
  title,
  summary,
  detail,
  indexLabel,
  meter,
  className,
  evidence,
}) => (
  <YStack className={className}>
    <Panel label={title} meter={meter}>
      <XStack gap="$4" alignItems="flex-start">
        <Text
          className="domain-index"
          fontFamily="$heading"
          fontWeight="bold"
          display="none"
          $gtSm={{ display: 'flex' }}
        >
          {indexLabel}
        </Text>
        <YStack gap="$3" flexShrink={1}>
          <Paragraph fontFamily="$body" fontSize="$5">
            {summary}
          </Paragraph>
          <Paragraph className="readout-label" fontFamily="$body">
            {detail}
          </Paragraph>
          {evidence.length > 0 ? (
            <YStack gap="$2">
              <Text
                className="readout-label"
                fontFamily="$body"
                fontSize="$1"
                letterSpacing={2}
                textTransform="uppercase"
              >
                evidence
              </Text>
              <XStack gap="$2" flexWrap="wrap" rowGap="$2">
                {renderRepos(evidence)}
              </XStack>
            </YStack>
          ) : null}
        </YStack>
      </XStack>
    </Panel>
  </YStack>
)

const renderDomains = ([
  domain,
  ...rest
]: readonly AboutDomainViewModel[]): React.ReactNode =>
  domain ? (
    <>
      <DomainPanel {...domain} />
      {renderDomains(rest)}
    </>
  ) : null

const SpectrumSegment: React.FC<AboutLanguageViewModel> = ({ count, opacity }) => (
  <YStack flexGrow={count} flexBasis={0} backgroundColor="$accent" opacity={opacity} />
)

const renderSpectrum = ([
  language,
  ...rest
]: readonly AboutLanguageViewModel[]): React.ReactNode =>
  language ? (
    <>
      <SpectrumSegment {...language} />
      {renderSpectrum(rest)}
    </>
  ) : null

const LanguageLabel: React.FC<AboutLanguageViewModel> = ({ language, percentage }) => (
  <XStack gap="$2" alignItems="center">
    <Text fontFamily="$body" fontSize="$2">
      {language}
    </Text>
    <Text className="readout-label" fontFamily="$body" fontSize="$1">
      {percentage}
    </Text>
  </XStack>
)

const renderLanguageLabels = ([
  language,
  ...rest
]: readonly AboutLanguageViewModel[]): React.ReactNode =>
  language ? (
    <>
      <LanguageLabel {...language} />
      {renderLanguageLabels(rest)}
    </>
  ) : null

const LanguageSpectrum: React.FC<AboutLanguageSpectrumViewModel> = ({
  meter,
  languages,
}) => (
  <YStack className="stagger-5">
    <Panel label="Language range" meter={meter}>
      <YStack gap="$3">
        <XStack className="spectrum">{renderSpectrum(languages)}</XStack>
        <XStack gap="$3" flexWrap="wrap" rowGap="$2">
          {renderLanguageLabels(languages)}
        </XStack>
      </YStack>
    </Panel>
  </YStack>
)

const PrincipleRow: React.FC<AboutPrincipleViewModel> = ({ title, description }) => (
  <YStack gap="$1">
    <H3 fontFamily="$heading" fontSize="$5">
      {title}
    </H3>
    <Paragraph className="readout-label" fontFamily="$body">
      {description}
    </Paragraph>
  </YStack>
)

const renderPrinciples = ([
  principle,
  ...rest
]: readonly AboutPrincipleViewModel[]): React.ReactNode =>
  principle ? (
    <>
      <PrincipleRow {...principle} />
      {renderPrinciples(rest)}
    </>
  ) : null

const About: React.FC<AboutViewProps> = ({
  intro,
  stats,
  domains,
  languageSpectrum,
  principles,
  principlesMeter,
}) => (
  <Screen>
    {intro ? (
      <YStack className="ignite ignite-1" gap="$4" maxWidth={760}>
        <Text
          className="readout-label"
          fontFamily="$body"
          fontSize="$1"
          letterSpacing={4}
        >
          ORBITAL REGISTRY · DOSSIER 01
        </Text>
        <H1 className="dossier-headline" fontFamily="$heading" fontWeight="bold">
          {intro.headline}
        </H1>
        <YStack className="rule" height={1} backgroundColor="$borderColor" width="45%" />
        <Paragraph className="dossier-statement" fontFamily="$body" opacity={0.85}>
          {intro.statement}
        </Paragraph>
      </YStack>
    ) : (
      <XStack gap="$2" alignItems="center">
        <Spinner />
        <Text fontFamily="$body">Loading…</Text>
      </XStack>
    )}

    <XStack className="ignite ignite-2" gap="$6" flexWrap="wrap" rowGap="$4">
      {renderStats(stats)}
    </XStack>
    {renderDomains(domains)}
    {languageSpectrum ? <LanguageSpectrum {...languageSpectrum} /> : null}
    {principles.length > 0 ? (
      <Panel label="How I work" meter={principlesMeter}>
        <YStack gap="$4">{renderPrinciples(principles)}</YStack>
      </Panel>
    ) : null}
  </Screen>
)

export default About
