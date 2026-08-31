# Graph Report - portfolio  (2026-08-31)

## Corpus Check
- 262 files · ~80,111 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1995 nodes · 4236 edges · 142 communities (94 shown, 48 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 58 edges (avg confidence: 0.66)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `adfa6894`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- layoutThunks.ts
- profile/about/aboutView.tsx
- style
- layoutView.tsx
- Portfolio App
- devDependencies
- compilerOptions
- scripts
- expo
- statusSelectors.ts
- formatter
- .tamagui/**
- skill_reviews.py
- dependencies
- include
- contextualSkillSmells.mjs
- vercel.json
- MetroRequireContext
- metro.config.js
- Adaptive Icon Alignment Grid
- Concentric Safe Zones
- burnt
- expo-build-properties
- expo-document-picker
- expo-file-system
- expo-font
- roleBoundaries.mjs
- expo-router
- expo-sharing
- astConformance.mjs
- expo-status-bar
- expo-system-ui
- expo-web-browser
- jest.setup.js
- react
- react-error-boundary
- react-native
- @react-native-async-storage/async-storage
- corePackageSourceContract.mjs
- react-native-qrcode-svg
- react-native-reanimated
- react-native-safe-area-context
- themeTypes.ts
- react-native-svg
- react-native-web
- @react-navigation/native
- @reduxjs/toolkit
- tamagui
- @tamagui/animations-react-native
- @tamagui/config
- @tamagui/font-inter
- @tamagui/lucide-icons
- @tamagui/react-native-media-driver
- @tamagui/shorthands
- @tamagui/themes
- @tamagui/toast
- check-feature-file-contract.mjs
- Human Portrait Favicon
- Monochrome Geometric Splash Screen
- apiDataAuthority.mjs
- sdin.dev — Engineering and Quality Contract
- parseSource
- apiEndpointTags.mjs
- experienceThunks.ts
- commandSelectors.ts
- apiTypes.ts
- checkConformance.mjs
- astReduxStateChecks.mjs
- openApiCodegen.mjs
- contributionGraphSelectors.ts
- reactReduxWiring.mjs
- check-ecs-conformance.mjs
- findingFor
- corePackageContract.node-test.mjs
- listenerWiring.mjs
- walkNodes
- ambientSceneSelectors.ts
- contentSelectors.ts
- themeCustomAdapters.ts
- themeProfiles.ts
- astShared.mjs
- errorBoundaryView.tsx
- projects/projects/projectsView.tsx
- themeCustomThunks.ts
- diagnosticsSlice.ts
- astCompositionChecks.mjs
- astDependencyChecks.mjs
- selectorMemoization.mjs
- projectsSelectors.ts
- blocking
- corePackageContract.mjs
- projectContext.mjs
- apiApi.ts
- apiListeners.ts
- navigationSelectors.ts
- corePackageDeclarationContract.mjs
- corePackageShared.mjs
- store.ts
- directFetchChecks.mjs
- corePackageDataContract.mjs
- projectsThunks.ts
- themeSelectionSelectors.ts
- package.json
- telemetryThunks.ts
- themeColorMath.ts
- fp_laws.node-test.mjs
- profile/home/homeView.tsx
- corePackageBehaviorContract.mjs
- suspicious
- projectActivityView.tsx
- rules
- views/notFound/notFoundView.tsx
- biome.json
- astNameChecks.mjs
- ignore
- moduleFileExtensions
- runFpChecks.mjs
- a11y
- complexity
- formatter
- correctness
- verify-all.sh
- runTests.mjs
- expo
- functional-programming-composition
- jest
- react-dom
- react-redux
- @tamagui/linear-gradient
- @tamagui/babel-plugin
- @tamagui/cli
- @tamagui/metro-plugin
- @testing-library/react
- @testing-library/react-native
- @types/jest
- astReporting.node-test.mjs
- {
  useGetInitialStateQuery,
  useGetGithubSummaryQuery,
  useGetGithubCommitsQuery,
  useGetApiStatusQuery,
  useGetBrandNameQuery,
  useGetDescriptionQuery,
}

## God Nodes (most connected - your core abstractions)
1. `walkNodes()` - 76 edges
2. `parseSource()` - 42 edges
3. `.tamagui/**` - 38 edges
4. `resolveTypescript()` - 37 edges
5. `compilerOptions` - 28 edges
6. `useAppSelector` - 27 edges
7. `findingFor()` - 23 edges
8. `blocking()` - 22 edges
9. `createProjectContext()` - 22 edges
10. `scripts` - 21 edges

## Surprising Connections (you probably didn't know these)
- `Yarn Workflow` --conceptually_related_to--> `Yarn Configuration`  [INFERRED]
  README.md → .yarnrc.yml
- `createProject()` --calls--> `createProjectContext()`  [EXTRACTED]
  scripts/redux/reactReduxWiring.node-test.mjs → scripts/redux/projectContext.mjs
- `useTelemetryComposition()` --indirect_call--> `selectExperienceMode()`  [INFERRED]
  src/features/systems/shell/frame/telemetry/telemetryThunks.ts → src/features/entities/shell/controls/experience/experienceSelectors.ts
- `useArchiveControlComposition()` --indirect_call--> `selectThemeMode()`  [INFERRED]
  src/features/systems/shell/controls/archiveControl/archiveControlThunks.ts → src/features/entities/shell/themes/themeSelection/themeSelectionSelectors.ts
- `useThemeCustomController()` --indirect_call--> `selectThemeMode()`  [INFERRED]
  src/features/systems/shell/themes/themeCustom/themeCustomThunks.ts → src/features/entities/shell/themes/themeSelection/themeSelectionSelectors.ts

## Import Cycles
- 3-file cycle: `src/features/systems/platform/foundation/boot/bootListeners.ts -> src/store.ts -> src/features/systems/shell/controls/experience/experienceListeners.ts -> src/features/systems/platform/foundation/boot/bootListeners.ts`
- 3-file cycle: `src/features/systems/platform/foundation/api/apiListeners.ts -> src/features/systems/platform/foundation/boot/bootListeners.ts -> src/store.ts -> src/features/systems/platform/foundation/api/apiListeners.ts`
- 3-file cycle: `src/features/systems/platform/foundation/boot/bootListeners.ts -> src/store.ts -> src/features/systems/shell/themes/themeSelection/themeSelectionListeners.ts -> src/features/systems/platform/foundation/boot/bootListeners.ts`
- 4-file cycle: `src/features/systems/platform/foundation/composition/compositionThunks.ts -> src/store.ts -> src/features/systems/shell/controls/experience/experienceListeners.ts -> src/features/systems/shell/controls/experience/experienceThunks.ts -> src/features/systems/platform/foundation/composition/compositionThunks.ts`

## Communities (142 total, 48 thin omitted)

### Community 0 - "layoutThunks.ts"
Cohesion: 0.39
Nodes (7): plugins, expo-font, restoreExperience, LayoutViewModel, selectLayoutReady(), selectLayoutViewModel(), useLayoutComposition()

### Community 1 - "profile/about/aboutView.tsx"
Cohesion: 0.10
Nodes (24): GithubRepo, AboutDomainViewModel, AboutLanguageSpectrumViewModel, AboutLanguageViewModel, AboutPrincipleViewModel, AboutRepoViewModel, AboutStatViewModel, AboutViewProps (+16 more)

### Community 2 - "style"
Cohesion: 0.20
Nodes (10): style, noArguments, noNonNullAssertion, noParameterAssign, noUnusedTemplateLiteral, useConst, useDefaultParameterLast, useEnumInitializers (+2 more)

### Community 3 - "layoutView.tsx"
Cohesion: 0.20
Nodes (9): expo-router, ThemeToggleViewProps, BrandNameViewProps, selectBrandNameViewModel(), useBrandNameComposition(), unstable_settings, ThemeToggle(), BrandName() (+1 more)

### Community 4 - "Portfolio App"
Cohesion: 0.20
Nodes (12): api.sdin.dev Data, Bundled Initial State Fallback, Expo, Portfolio App, React Native, Redux Toolkit, Route-Only App Directory, RTK Query (+4 more)

### Community 5 - "devDependencies"
Cohesion: 0.09
Nodes (23): @babel/core, @biomejs/biome, @expo/metro-config, @expo/metro-runtime, jest-environment-jsdom, jest-expo, devDependencies, @babel/core (+15 more)

### Community 6 - "compilerOptions"
Cohesion: 0.05
Nodes (36): dom, esnext, jest, compilerOptions, allowJs, allowSyntheticDefaultImports, baseUrl, downlevelIteration (+28 more)

### Community 7 - "scripts"
Cohesion: 0.10
Nodes (21): scripts, android, check:api-data-authority, check:ecs, check:fan-out, check:feature-files, check:fp, check:rtk (+13 more)

### Community 8 - "expo"
Cohesion: 0.07
Nodes (26): backgroundColor, foregroundImage, adaptiveIcon, typedRoutes, expo, android, assetBundlePatterns, experiments (+18 more)

### Community 9 - "statusSelectors.ts"
Cohesion: 0.06
Nodes (44): ApiStatus, GithubSummary, BodyDataSource, API_LEVELS, API_VALUES, FEED_LEVELS, FEED_VALUES, LEGACY_API_VALUES (+36 more)

### Community 10 - "formatter"
Cohesion: 0.22
Nodes (9): formatter, enabled, formatWithErrors, ignore, indentStyle, indentWidth, lineWidth, **/*/generated-new.ts (+1 more)

### Community 11 - ".tamagui/**"
Cohesion: 0.13
Nodes (22): .tamagui/**, CTAS, GLYPHS, InstallQrViewProps, rowsAt(), selectInstallQrViewModel(), selectWelcomeViewModelAt(), SignalTraceViewProps (+14 more)

### Community 12 - "skill_reviews.py"
Cohesion: 0.06
Nodes (76): Enum, Namespace, display_path(), explain(), Finding, format_json(), format_sarif(), format_text() (+68 more)

### Community 13 - "dependencies"
Cohesion: 0.18
Nodes (11): babel-preset-expo, expo-linking, expo-splash-screen, dependencies, babel-preset-expo, expo-linking, expo-splash-screen, react-native-gesture-handler (+3 more)

### Community 14 - "include"
Cohesion: 0.18
Nodes (10): expo-env.d.ts, .expo/types/**/*.ts, ./tsconfig.base, compilerOptions, resolveJsonModule, strict, extends, include (+2 more)

### Community 15 - "contextualSkillSmells.mjs"
Cohesion: 0.07
Nodes (48): collectApiCompositionSmells(), adapterIdentityNotice(), allocatingCalls, broadSubscriptionNotice(), callName(), collectContextualSkillSmells(), directlyReturnsParameter(), isAllocation() (+40 more)

### Community 16 - "vercel.json"
Cohesion: 0.29
Nodes (6): buildCommand, cleanUrls, devCommand, framework, outputDirectory, trailingSlash

### Community 18 - "metro.config.js"
Cohesion: 0.67
Nodes (3): config, { getDefaultConfig }, { withTamagui }

### Community 19 - "Adaptive Icon Alignment Grid"
Cohesion: 1.00
Nodes (3): Adaptive Icon Alignment Grid, Concentric Safe Zones, Square Alignment Grid

### Community 20 - "Concentric Safe Zones"
Cohesion: 1.00
Nodes (3): Concentric Safe Zones, Icon Alignment Grid, Square Alignment Grid

### Community 26 - "roleBoundaries.mjs"
Cohesion: 0.08
Nodes (44): collectBehaviorFindings(), collectPurityFindings(), rtkBoundaryHits, contextStub, bareRoleLeafNames, checkRoleBoundaries(), collectFactoryFindings(), collectImportFindings() (+36 more)

### Community 29 - "astConformance.mjs"
Cohesion: 0.09
Nodes (36): arityFindings(), findingsFor(), payloadFindings(), byRule(), findingsFor(), collectFpAstFindings(), collectFpAstFindingsForUnits(), collectFpAstFindingsFromSource() (+28 more)

### Community 38 - "corePackageSourceContract.mjs"
Cohesion: 0.10
Nodes (40): addBindings(), bindingNames(), bindingScopes(), isLexicallyBound(), isLexicalScope(), nearestScope(), callSpecifier(), candidatePaths() (+32 more)

### Community 42 - "themeTypes.ts"
Cohesion: 0.13
Nodes (21): initialThemeSelectionState, isPersistableThemeMode(), nextBuiltInTheme(), ThemeSelectionAuthority, themeSelectionSlice, ThemeSelectionState, ThemeSelectionStatus, validatedCatalog() (+13 more)

### Community 57 - "check-feature-file-contract.mjs"
Cohesion: 0.13
Nodes (31): collectFanOutFindings(), FEATURE_BUCKETS, featureStructureViolations(), overBudget(), projectRoot, runFanOutCheck(), subdirs(), unexpected() (+23 more)

### Community 64 - "apiDataAuthority.mjs"
Cohesion: 0.12
Nodes (30): ../../../../../styles/themes/palette.json, argumentsList, context, defaultRoot, findings, projectRoot, scriptDirectory, apiBoundaryFindings() (+22 more)

### Community 65 - "sdin.dev — Engineering and Quality Contract"
Cohesion: 0.06
Nodes (29): Accessibility and UX acceptance criteria, API contracts, Architecture contract, Automated release gates, Browser release matrix, Contribution-calendar invariant, Enforced boundary, Focused release scenarios (+21 more)

### Community 66 - "parseSource"
Cohesion: 0.16
Nodes (28): collectApiCompositionFindings(), duplicateBaseUrlFindings(), hasEmptyEndpointsFactory(), literalBaseUrl(), queryModules, rootsFor(), unwrap(), collectApiStoreWiringFindings() (+20 more)

### Community 67 - "apiEndpointTags.mjs"
Cohesion: 0.12
Nodes (22): apiRoot, endpointApi, projectRoot, root, slice, bindingsFor(), checkApiEndpointTags(), collectApiEndpointTagAnalysis() (+14 more)

### Community 68 - "experienceThunks.ts"
Cohesion: 0.14
Nodes (18): ExperienceMode, ExperienceState, experienceModeCycled, storedExperienceRestored, ExperienceRoot, ExperienceToggleViewProps, LABEL_BY_MODE, selectExperienceToggleViewProps (+10 more)

### Community 69 - "commandSelectors.ts"
Cohesion: 0.07
Nodes (44): ArchiveControlViewProps, ArchiveLineViewModel, QUERY_STATUS_LABELS, selectArchiveFeedState(), selectArchiveLines(), selectArchivePlaceholder(), selectPromptLine(), applyEffect() (+36 more)

### Community 70 - "apiTypes.ts"
Cohesion: 0.12
Nodes (19): About, AboutDomain, AboutPrinciple, Activity, ActivityEvent, AppData, CommitTypeCount, ContentItem (+11 more)

### Community 71 - "checkConformance.mjs"
Cohesion: 0.08
Nodes (21): apiCompositionFindings, apiStoreWiringFindings, args, combatDefeatOwnerFindings, context, defaultRoot, endpointTagReviews, gameplayTurnOwnerFindings (+13 more)

### Community 72 - "astReduxStateChecks.mjs"
Cohesion: 0.19
Nodes (24): importedMember(), importedTypeAt(), reduxBindingsFor(), reduxFactories, reduxFactoryAt(), wrapperTypeAt(), wrapperTypes, wrapperValueAt() (+16 more)

### Community 73 - "openApiCodegen.mjs"
Cohesion: 0.19
Nodes (24): analyzeConfig(), bindingsFor(), collectOpenApiCodegenFindings(), collectOpenApiCodegenSmells(), configObjects(), createApiBindings(), discover(), emptyRootStatus() (+16 more)

### Community 74 - "contributionGraphSelectors.ts"
Cohesion: 0.13
Nodes (18): Contributions, ContributionCellViewModel, ContributionGraphViewProps, ContributionLegendViewModel, ContributionTickViewModel, dayOfWeek(), MONTH_OFFSETS, monthOf() (+10 more)

### Community 75 - "reactReduxWiring.mjs"
Cohesion: 0.17
Nodes (22): collectReactReduxWiringFindings(), definitionsOf(), exportedNames(), hookTypes, importsFrom(), inspectHooks(), isValueImport(), labelOf() (+14 more)

### Community 76 - "check-ecs-conformance.mjs"
Cohesion: 0.17
Nodes (22): checkFeatureDomains(), checkRoleBuckets(), checkRootFiles(), checkSourcePresence(), checkViews(), fail(), featureDomains, featuresRoot (+14 more)

### Community 77 - "findingFor"
Cohesion: 0.21
Nodes (20): dispositionForScope(), findingFor(), collectFpSignatureFindings(), accessedProperties(), declaredObjectProperties(), firstDestructureOf(), identifierUseCount(), objectShapesFor() (+12 more)

### Community 78 - "corePackageContract.node-test.mjs"
Cohesion: 0.13
Nodes (20): behaviorCases, capabilityCases, checkerPath, codesOf(), declarationCases, expectCode(), fixture(), payloadCases (+12 more)

### Community 79 - "listenerWiring.mjs"
Cohesion: 0.24
Nodes (18): branchConstraints(), collectListenerWiringFindings(), definitionsOf(), exportedNames(), exportedStartBindings(), isValueImport(), labelOf(), lineOf() (+10 more)

### Community 80 - "walkNodes"
Cohesion: 0.19
Nodes (23): callName(), collectApiAndAdapterFindings(), collectAsyncThunkFindings(), collectRawHookFindings(), collectReducerFindings(), collectSelectedValueMutationFindings(), collectSkillAstFindings(), collectThunkPollingFindings() (+15 more)

### Community 81 - "ambientSceneSelectors.ts"
Cohesion: 0.10
Nodes (24): AmbientSceneLoadState, AmbientSceneState, MotionComponent, PositionComponent, SceneEntity, SceneEntityId, SceneKind, ScenePriority (+16 more)

### Community 82 - "contentSelectors.ts"
Cohesion: 0.15
Nodes (15): ContentItemViewModel, ContentSectionViewModel, ContentViewProps, PortfolioFeaturesViewProps, selectContentViewModel, selectContentViewModelFromItems(), selectItems(), useContentRoute() (+7 more)

### Community 83 - "themeCustomAdapters.ts"
Cohesion: 0.11
Nodes (26): activeThemeCss(), completeDeclarationsFrom(), declarationEntriesFrom(), installStylesheet(), isThemeCssVariable(), orderedDeclarationsFrom(), parseDeclaration(), removeCustomThemeStyle() (+18 more)

### Community 84 - "themeProfiles.ts"
Cohesion: 0.11
Nodes (30): AYU_REVISION, ayuDarkPalette, ayuLightPalette, ayuMiragePalette, ayuSource(), AyuThemePalette, accessibleControlBorderOf(), accessibleTextOf() (+22 more)

### Community 85 - "astShared.mjs"
Cohesion: 0.12
Nodes (34): acceptedFrameworkClasses(), acceptedFrameworkNews(), className(), classOwner(), collectFpClassFindings(), endsWithPath(), hasParameterProperty(), isDelegatedCall() (+26 more)

### Community 86 - "errorBoundaryView.tsx"
Cohesion: 0.39
Nodes (5): reportRenderFailure(), ErrorBoundaryViewProps, selectRenderFailureMessage(), ErrorBoundary(), Fallback()

### Community 87 - "projects/projects/projectsView.tsx"
Cohesion: 0.15
Nodes (13): PanelViewProps, ProjectCommitArchiveViewModel, ProjectCommitViewModel, ProjectLanguagesViewProps, ProjectLanguageViewModel, ProjectStatViewModel, ProjectArchive(), renderCommits() (+5 more)

### Community 88 - "themeCustomThunks.ts"
Cohesion: 0.13
Nodes (19): selectCustomThemeName(), selectThemeCustomLoadLabel(), ThemeCustomRoot, ThemeCustomViewProps, initialThemeCustomState, themeCustomSlice, ThemeCustomState, ThemeCustomStatus (+11 more)

### Community 89 - "diagnosticsSlice.ts"
Cohesion: 0.20
Nodes (11): DiagnosticsState, LoggedAction, ObservedAction, diagnosticActionObserved, diagnosticsCleared, DiagnosticsRoot, diagnosticsSlice, initialState (+3 more)

### Community 91 - "astCompositionChecks.mjs"
Cohesion: 0.26
Nodes (15): collectConditionalChains(), collectDirectRecursion(), collectFpCompositionFindings(), collectNestedCompose(), composeBindingsFor(), isComposeCall(), isNestedConditional(), ownsDirectSelfCall() (+7 more)

### Community 92 - "astDependencyChecks.mjs"
Cohesion: 0.24
Nodes (16): collectFpDependencyFindings(), dependencyDisposition(), moduleSpecifierAt(), normalizedRel(), relativeCandidates(), sourceExtensions, targetFor(), boundaryPath() (+8 more)

### Community 93 - "selectorMemoization.mjs"
Cohesion: 0.22
Nodes (16): analyzeSelectorMemoization(), collectionCallsFor(), collectionMethods, collectSelectorMemoizationReviews(), dependsOn(), functionName(), insideCreateSelector(), localBindings() (+8 more)

### Community 94 - "projectsSelectors.ts"
Cohesion: 0.19
Nodes (14): ACTIVITY_INFLECTIONS, activityLabel(), ProjectOwnersViewProps, ProjectOwnerViewModel, ProjectRepoViewModel, relativeAgeAt(), selectCommitKind(), selectDegradedMessage() (+6 more)

### Community 95 - "blocking"
Cohesion: 0.23
Nodes (15): attempt(), capabilityFinding(), capabilitySpecs, inspectCapabilities(), inspectMonoid(), inspectValidation(), isTagged(), missingAt() (+7 more)

### Community 96 - "corePackageContract.mjs"
Cohesion: 0.26
Nodes (16): capture(), formatFinding(), inspectCorePackage(), inspectInstalled(), inspectLoadedSurfaces(), manifestFailure(), projectManifestResult(), resolutionFailure() (+8 more)

### Community 97 - "projectContext.mjs"
Cohesion: 0.16
Nodes (14): createProject(), createProject(), listenerSource, storeSource, createProject(), emptyApi, injectedOutput, createProjectContext() (+6 more)

### Community 98 - "apiApi.ts"
Cohesion: 0.22
Nodes (12): GithubCommits, InitialStateResponse, API_TIMEOUT_MS, apiSlice, normalize(), makeStore(), TEST_AMBIENT_SCENE, TEST_INITIAL_STATE (+4 more)

### Community 99 - "apiListeners.ts"
Cohesion: 0.11
Nodes (21): BrandNameState, NavigationState, bodyDataReceived, bodyDataRequestFailed, bodyDataRequestStarted, bodySlice, initialState, ambientSceneReceived (+13 more)

### Community 100 - "navigationSelectors.ts"
Cohesion: 0.19
Nodes (12): NavigationController, NavigationControls, NavigationHref, NavigationLinkControlViewProps, NavigationLinksViewProps, NavigationLinkViewProps, NavigationViewProps, selectMenuLabel() (+4 more)

### Community 102 - "corePackageDeclarationContract.mjs"
Cohesion: 0.25
Nodes (15): callableDeclaration(), canonicalType(), constructorProblems(), constructorShapes, expectedShapes, exported(), exportedNames(), genericMap() (+7 more)

### Community 103 - "corePackageShared.mjs"
Cohesion: 0.22
Nodes (14): ascendToPackage(), atPath(), bindingNames(), declarationNames(), declaredValueExports(), defaulted(), exportDeclarationNames(), exported() (+6 more)

### Community 104 - "store.ts"
Cohesion: 0.12
Nodes (17): listenerMiddleware, startAppListening, useAppStore, saveStoredExperience(), AppDispatch, AppState, AppStore, rootReducer (+9 more)

### Community 105 - "directFetchChecks.mjs"
Cohesion: 0.27
Nodes (11): asyncThunkFetchNeedsCondition(), asyncThunkHasCondition(), callName(), fetchCallsIn(), fetchMethod(), thunkName(), callNamed(), collectDirectFetchFindings() (+3 more)

### Community 106 - "corePackageDataContract.mjs"
Cohesion: 0.25
Nodes (13): constructorSpecs, expectedKeys(), hasDataDescriptors(), hasPlainPrototype(), inspectConstructor(), inspectRuntimeData(), invoke(), jsonFinding() (+5 more)

### Community 107 - "projectsThunks.ts"
Cohesion: 0.22
Nodes (9): selectContributionVisualization(), PageHeadViewModel, PageHeadViewProps, selectPageHeadViewModel(), ProjectsViewProps, useProjectsRoute(), Projects(), ProjectsRoute() (+1 more)

### Community 108 - "themeSelectionSelectors.ts"
Cohesion: 0.13
Nodes (28): selectActionLog(), CUSTOM_CONTRIBUTION_RAMP, CUSTOM_VISUALIZATION, selectSurface(), selectTamaguiTheme(), selectThemeLabel(), selectThemeMode(), selectThemes() (+20 more)

### Community 109 - "package.json"
Cohesion: 0.15
Nodes (12): jest, preset, setupFilesAfterEnv, transformIgnorePatterns, main, name, packageManager, private (+4 more)

### Community 110 - "telemetryThunks.ts"
Cohesion: 0.23
Nodes (9): FEED_LABELS, FeedState, selectFeedLabel(), selectTelemetryViewModel(), TelemetryCellViewProps, TelemetryProjection, TelemetryViewProps, useTelemetryComposition() (+1 more)

### Community 111 - "themeColorMath.ts"
Cohesion: 0.24
Nodes (13): alphaFrom(), channelHex(), contrastRatio(), HEX_CHANNEL_OFFSETS, hexFrom(), linearChannel(), MIX_STEPS, mixHex() (+5 more)

### Community 112 - "fp_laws.node-test.mjs"
Cohesion: 0.23
Nodes (8): double(), eitherDouble(), eitherIncrement(), eitherSamples, increment(), maybeDouble(), maybeIncrement(), maybeSamples

### Community 113 - "profile/home/homeView.tsx"
Cohesion: 0.20
Nodes (9): ScreenViewProps, HomePresenceViewModel, HomeViewProps, selectHomeViewModel(), WEB_PRESENCES, Home(), HomePage(), renderPresences() (+1 more)

### Community 114 - "corePackageBehaviorContract.mjs"
Cohesion: 0.49
Nodes (10): attempt(), behaviorFinding(), bounceFrom(), inspectCapabilityBehavior(), inspectPartial(), inspectPipe(), inspectPredicates(), inspectSequence() (+2 more)

### Community 115 - "suspicious"
Cohesion: 0.20
Nodes (10): suspicious, noArrayIndexKey, noAssignInExpressions, noConfusingVoidType, noConsoleLog, noDoubleEquals, noEmptyInterface, noExplicitAny (+2 more)

### Community 116 - "projectActivityView.tsx"
Cohesion: 0.24
Nodes (6): ProjectActivityKindViewModel, ProjectActivityRepoViewModel, ProjectActivityViewModel, ProjectActivity(), renderKinds(), renderRepos()

### Community 117 - "rules"
Cohesion: 0.22
Nodes (9): linter, enabled, rules, noAccumulatingSpread, noDelete, performance, security, noDangerouslySetInnerHtml (+1 more)

### Community 118 - "views/notFound/notFoundView.tsx"
Cohesion: 0.39
Nodes (4): NotFoundViewProps, useNotFoundRoute(), NotFoundRoute(), NotFound()

### Community 119 - "biome.json"
Cohesion: 0.25
Nodes (7): files, parser, organizeImports, enabled, overrides, allowComments, $schema

### Community 120 - "astNameChecks.mjs"
Cohesion: 0.43
Nodes (7): bindingNames(), collectFpNameFindings(), declarationNames(), forbiddenWordIn(), forbiddenWords, identifierWords(), nounDisposition()

### Community 121 - "ignore"
Cohesion: 0.29
Nodes (7): ignore, dist/**, .expo/**, graphify-out/**, tamagui-web.css, tsconfig.tsbuildinfo, .yarn/**

### Community 122 - "moduleFileExtensions"
Cohesion: 0.29
Nodes (7): moduleFileExtensions, node, ts, tsx, js, json, jsx

### Community 123 - "runFpChecks.mjs"
Cohesion: 0.29
Nodes (6): checks, failed, nodeFixtures, projectRoot, results, scriptRoot

### Community 126 - "a11y"
Cohesion: 0.33
Nodes (6): noHeaderScope, noSvgWithoutTitle, useAltText, useButtonType, useMediaCaption, a11y

### Community 127 - "complexity"
Cohesion: 0.33
Nodes (6): noBannedTypes, noForEach, useLiteralKeys, useOptionalChain, useSimplifiedLogicExpression, complexity

### Community 128 - "formatter"
Cohesion: 0.33
Nodes (6): jsxQuoteStyle, quoteStyle, semicolons, trailingCommas, javascript, formatter

### Community 130 - "correctness"
Cohesion: 0.40
Nodes (5): noConstructorReturn, noInnerDeclarations, noUnnecessaryContinue, useExhaustiveDependencies, correctness

### Community 131 - "verify-all.sh"
Cohesion: 0.50
Nodes (4): FP_PROJECT_ROOT, FP_SOURCE_ROOT, run_check(), verify-all.sh script

### Community 132 - "runTests.mjs"
Cohesion: 0.50
Nodes (3): result, scriptDir, testFiles

## Knowledge Gaps
- **513 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+508 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **48 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `.tamagui/**` connect `.tamagui/**` to `profile/about/aboutView.tsx`, `layoutView.tsx`, `statusSelectors.ts`, `experienceThunks.ts`, `commandSelectors.ts`, `contributionGraphSelectors.ts`, `contentSelectors.ts`, `errorBoundaryView.tsx`, `projects/projects/projectsView.tsx`, `themeCustomThunks.ts`, `projectsSelectors.ts`, `navigationSelectors.ts`, `store.ts`, `projectsThunks.ts`, `telemetryThunks.ts`, `profile/home/homeView.tsx`, `projectActivityView.tsx`, `views/notFound/notFoundView.tsx`, `ignore`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `ignore` connect `ignore` to `.tamagui/**`, `biome.json`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `files` connect `biome.json` to `ignore`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _513 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `profile/about/aboutView.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10160427807486631 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._