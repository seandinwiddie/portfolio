import path from 'node:path'
import { FP_AST_RULES } from './astRules.mjs'
import { findingFor, walkNodes } from './astShared.mjs'

const forbiddenWords = new Set(['manager', 'helper', 'util', 'utils', 'bag', 'fixture'])

const identifierWords = (name) =>
  String(name)
    .split(/[^A-Za-z0-9]+/)
    .flatMap(
      (part) => part.match(/[A-Z]+(?=[A-Z][a-z]|[0-9]|$)|[A-Z]?[a-z]+|[0-9]+/g) ?? [part]
    )
    .map((word) => word.toLowerCase())

const forbiddenWordIn = (name) => {
  const words = identifierWords(name)
  const terminal = words.at(-1)
  if (forbiddenWords.has(terminal)) return { word: terminal, terminal: true }
  const embedded = words.find((word) => forbiddenWords.has(word))
  return embedded ? { word: embedded, terminal: false } : null
}

const nounDisposition = ({ word, terminal }) =>
  terminal && word !== 'fixture' ? 'BLOCK' : 'REVIEW'

const bindingNames = (typescript, name) => {
  if (typescript.isIdentifier(name)) return [name]
  if (typescript.isObjectBindingPattern(name) || typescript.isArrayBindingPattern(name)) {
    return name.elements.flatMap((element) =>
      typescript.isBindingElement(element) ? bindingNames(typescript, element.name) : []
    )
  }
  return []
}

const declarationNames = (typescript, node) => {
  if (typescript.isVariableDeclaration(node)) return bindingNames(typescript, node.name)
  if (typescript.isParameter(node)) return bindingNames(typescript, node.name)
  if (
    typescript.isFunctionDeclaration(node) ||
    typescript.isClassDeclaration(node) ||
    typescript.isClassExpression(node) ||
    typescript.isInterfaceDeclaration(node) ||
    typescript.isTypeAliasDeclaration(node) ||
    typescript.isEnumDeclaration(node) ||
    typescript.isModuleDeclaration(node) ||
    typescript.isMethodDeclaration(node) ||
    typescript.isPropertyDeclaration(node) ||
    typescript.isPropertySignature(node) ||
    typescript.isGetAccessorDeclaration(node) ||
    typescript.isSetAccessorDeclaration(node)
  )
    return node.name ? [node.name] : []
  return []
}

export const collectFpNameFindings = (file, typescript, sourceFile) => {
  const findings = []
  const stem = path
    .basename(file)
    .replace(/\.[^.]+$/, '')
    .replace(/\.(?:native|web|ios|android)$/, '')
  const fileMatch = forbiddenWordIn(stem)
  if (fileMatch) {
    findings.push(
      findingFor(
        FP_AST_RULES.wrapperNoun,
        file,
        sourceFile,
        null,
        `runtime filename ${fileMatch.terminal ? 'ends in' : 'contains'} forbidden wrapper noun ${fileMatch.word}`,
        nounDisposition(fileMatch)
      )
    )
  }
  const positions = new Set()
  walkNodes(typescript, sourceFile, (node) => {
    declarationNames(typescript, node).forEach((nameNode) => {
      const name = nameNode.getText(sourceFile).replace(/^['"]|['"]$/g, '')
      const match = forbiddenWordIn(name)
      const position = nameNode.getStart(sourceFile)
      if (!match || positions.has(position)) return
      positions.add(position)
      findings.push(
        findingFor(
          FP_AST_RULES.wrapperNoun,
          file,
          sourceFile,
          nameNode,
          `declaration ${name} ${match.terminal ? 'ends in' : 'contains'} forbidden wrapper noun ${match.word}`,
          nounDisposition(match)
        )
      )
    })
  })
  return findings
}
