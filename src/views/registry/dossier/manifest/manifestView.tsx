import type React from 'react'
import { Anchor, H1, H3, Paragraph, Spinner, Text, XStack, YStack } from 'tamagui'
import type {
  DossierDomainViewModel,
  DossierLanguageSpectrumViewModel,
  DossierLanguageViewModel,
  DossierPrincipleViewModel,
  DossierRepoViewModel,
  DossierStatViewModel,
  DossierViewProps,
} from '../../../../features/systems/registry/dossier/manifest/manifestSelectors'
import Panel from '../../../aperture/panel/panelView'
import Screen from '../../../aperture/screen/screenView'

const StatColumn: React.FC<DossierStatViewModel> = ({ value, label }) => (
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

const renderStats = (stats: readonly DossierStatViewModel[]): React.ReactNode =>
  stats.map((stat) => <StatColumn key={stat.id} {...stat} />)

const RepoChip: React.FC<DossierRepoViewModel> = ({ name, language, htmlUrl }) => (
  <Anchor
    href={htmlUrl}
    target="_blank"
    rel="noopener noreferrer"
    textDecorationLine="none"
    color="$link"
    minHeight={44}
    display="flex"
    justifyContent="center"
    hoverStyle={{ color: '$linkHover' }}
  >
    <XStack
      paddingHorizontal="$3"
      paddingVertical="$1"
      borderWidth={1}
      borderColor="$controlBorder"
      gap="$2"
      alignItems="center"
      minHeight={44}
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

const renderRepos = (repos: readonly DossierRepoViewModel[]): React.ReactNode =>
  repos.map((repo) => <RepoChip key={repo.id} {...repo} />)

const DomainPanel: React.FC<DossierDomainViewModel> = ({
  title,
  summary,
  detail,
  indexLabel,
  meter,
  className,
  evidence,
  evidenceLabel,
}) => (
  <YStack className={`dossier-domain ${className ?? ''}`}>
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
                {evidenceLabel}
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

const renderDomains = (domains: readonly DossierDomainViewModel[]): React.ReactNode =>
  domains.map((domain) => <DomainPanel key={domain.id} {...domain} />)

const SpectrumSegment: React.FC<DossierLanguageViewModel> = ({ count, opacity }) => (
  <YStack flexGrow={count} flexBasis={0} backgroundColor="$accent" opacity={opacity} />
)

const renderSpectrum = (
  languages: readonly DossierLanguageViewModel[]
): React.ReactNode =>
  languages.map((language) => <SpectrumSegment key={language.id} {...language} />)

const LanguageLabel: React.FC<DossierLanguageViewModel> = ({ language, percentage }) => (
  <XStack gap="$2" alignItems="center">
    <Text fontFamily="$body" fontSize="$2">
      {language}
    </Text>
    <Text className="readout-label" fontFamily="$body" fontSize="$1">
      {percentage}
    </Text>
  </XStack>
)

const renderLanguageLabels = (
  languages: readonly DossierLanguageViewModel[]
): React.ReactNode =>
  languages.map((language) => <LanguageLabel key={language.id} {...language} />)

const LanguageSpectrum: React.FC<DossierLanguageSpectrumViewModel> = ({
  label,
  meter,
  languages,
}) => (
  <YStack className="dossier-language stagger-5">
    <Panel label={label} meter={meter}>
      <YStack gap="$3">
        <XStack className="spectrum">{renderSpectrum(languages)}</XStack>
        <XStack gap="$3" flexWrap="wrap" rowGap="$2">
          {renderLanguageLabels(languages)}
        </XStack>
      </YStack>
    </Panel>
  </YStack>
)

const PrincipleRow: React.FC<DossierPrincipleViewModel> = ({ title, description }) => (
  <YStack gap="$1">
    <H3 fontFamily="$heading" fontSize="$5">
      {title}
    </H3>
    <Paragraph className="readout-label" fontFamily="$body">
      {description}
    </Paragraph>
  </YStack>
)

const renderPrinciples = (
  principles: readonly DossierPrincipleViewModel[]
): React.ReactNode =>
  principles.map((principle) => <PrincipleRow key={principle.id} {...principle} />)

const Dossier: React.FC<DossierViewProps> = ({
  dataStatus,
  intro,
  stats,
  domains,
  languageSpectrum,
  principles,
  principlesMeter,
  principlesLabel,
  eyebrow,
}) => (
  <Screen className="dossier-console">
    {dataStatus.pendingLabel ? (
      <XStack gap="$2" alignItems="center">
        <Spinner />
        <Text fontFamily="$body">{dataStatus.pendingLabel}</Text>
      </XStack>
    ) : null}
    {dataStatus.errorLabel ? (
      <Text role="alert" fontFamily="$body">
        {dataStatus.errorLabel}
      </Text>
    ) : null}
    {dataStatus.staleLabel ? (
      <Text accessibilityLiveRegion="polite" fontFamily="$body">
        {dataStatus.staleLabel}
      </Text>
    ) : null}
    {intro ? (
      <YStack className="dossier-intro ignite ignite-1" gap="$4">
        <Text
          className="readout-label"
          fontFamily="$body"
          fontSize="$1"
          letterSpacing={4}
        >
          {eyebrow}
        </Text>
        <H1 className="dossier-headline" fontFamily="$heading" fontWeight="bold">
          {intro.headline}
        </H1>
        <YStack className="rule" height={1} backgroundColor="$borderColor" width="45%" />
        <Paragraph className="dossier-statement" fontFamily="$body" opacity={0.85}>
          {intro.statement}
        </Paragraph>
      </YStack>
    ) : null}

    <XStack
      className="dossier-stats ignite ignite-2"
      gap="$6"
      flexWrap="wrap"
      rowGap="$4"
    >
      {renderStats(stats)}
    </XStack>
    <YStack className="dossier-domain-rail">{renderDomains(domains)}</YStack>
    {languageSpectrum ? <LanguageSpectrum {...languageSpectrum} /> : null}
    {principles.length > 0 ? (
      <YStack className="dossier-principles">
        <Panel label={principlesLabel} meter={principlesMeter}>
          <YStack gap="$4">{renderPrinciples(principles)}</YStack>
        </Panel>
      </YStack>
    ) : null}
  </Screen>
)

export default Dossier
