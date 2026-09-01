#!/usr/bin/env node
/** Print the checked-in independent production-browser acceptance prompt. */
import { readFileSync } from 'node:fs'

const promptPath = new URL('../../browser-playtests/PROMPT.md', import.meta.url)

process.stdout.write(readFileSync(promptPath, 'utf8'))
