/**
 * Collects root store assembly violations for this app.
 * User Story: As an app maintainer, I need one root store that visibly
 * assembles configureStore and owns all Redux integration.
 * @signature export const collectStoreBoundaryFindings = (context) => string[]
 */
export const collectStoreBoundaryFindings = (context) => {
  const storeBoundarySet = new Set(context.storeFiles)
  const configureStoreSet = new Set(context.configureStoreFiles)
  const findings = context.configureStoreFiles
    .filter((filePath) => !storeBoundarySet.has(filePath))
    .map(
      (filePath) =>
        `${context.relativeToProject(filePath)}: configureStore must be assembled by the app root store`
    )

  if (context.storeFiles.length === 0) {
    findings.push(
      `${context.relativeToProject(context.srcRoot)}: app must define one root store.ts`
    )
  } else if (context.storeFiles.length > 1) {
    findings.push(
      ...context.storeFiles.map(
        (filePath) =>
          `${context.relativeToProject(filePath)}: app has more than one root store`
      )
    )
  } else if (!configureStoreSet.has(context.storeFiles[0])) {
    findings.push(
      `${context.relativeToProject(context.storeFiles[0])}: app root store must assemble configureStore directly`
    )
  }

  return findings
}
