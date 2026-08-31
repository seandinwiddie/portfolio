import assert from 'node:assert/strict'
import test from 'node:test'
import {
  collectSkillReviewNotices,
  formatSkillReviewNotice,
} from './skillReviewNotices.mjs'

const contextFor = (texts) => ({
  projectRoot: process.cwd(),
  srcRoot: `${process.cwd()}/src`,
  sourceFiles: texts.map((_, index) => `source-${index}.ts`),
  roleForFile: () => null,
  relativeToProject: (filePath) => filePath,
  readText: (filePath) => texts[Number(filePath.match(/\d+/)?.[0] ?? 0)],
})

test('all nine Redux skills emit non-blocking contextual review notices', () => {
  const reviews = collectSkillReviewNotices(contextFor([])).filter(
    ({ level }) => level === 'REVIEW'
  )
  assert.equal(reviews.length, 9)
  assert.equal(new Set(reviews.map(({ skill }) => skill)).size, 9)
  reviews.forEach((review) => {
    assert.match(review.skillFile, /SKILL\.md$/)
    assert.match(review.reference, /^https:\/\//)
    assert.match(review.guidance, /Review/)
  })
})

test('observable risk indicators add explicit non-blocking smell notices', () => {
  const notices = collectSkillReviewNotices(
    contextFor([
      "createAsyncThunk('x', async () => fetch('/x'));",
      'listenerMiddleware.startListening({});',
    ])
  )
  const smells = notices.filter(({ level }) => level === 'SMELL')
  assert.equal(smells.length, 2)
  assert.match(smells.map(({ guidance }) => guidance).join('\n'), /Fetching thunks exist/)
  assert.match(
    smells.map(({ guidance }) => guidance).join('\n'),
    /Listener workflows exist/
  )
})

test('formatted notices link the skill and primary reference and ask for review', () => {
  const [notice] = collectSkillReviewNotices(contextFor([]))
  const output = formatSkillReviewNotice(notice).join('\n')
  assert.match(output, /^\[REVIEW\]/)
  assert.match(output, /Skill: .*SKILL\.md/)
  assert.match(output, /Local reference: .*store-lifetime\.md/)
  assert.match(output, /Reference: https:\/\//)
  assert.match(output, /Guidance: Read /)
})

test('effects broad subscriptions and unstable query selections are smells', () => {
  const notices = collectSkillReviewNotices(
    contextFor([
      `
    useEffect(() => { dispatch(load()) }, [])
    const all = useAppSelector((state) => state)
    const options = { selectFromResult: ({ data }) => ({ posts: [...data] }) }
  `,
    ])
  )
  const output = notices
    .filter(({ level }) => level === 'SMELL')
    .map(({ guidance }) => guidance)
    .join('\n')
  assert.match(output, /effect dispatches store work/)
  assert.match(output, /selector subscription appears broad/)
  assert.match(output, /selectFromResult returns a newly allocated value/)
  const stable = collectSkillReviewNotices(
    contextFor(['const options = { selectFromResult: ({ data }) => ({ posts: data }) }'])
  )
    .map(({ guidance }) => guidance)
    .join('\n')
  assert.doesNotMatch(stable, /selectFromResult returns a newly allocated value/)
})

test('an adapter using the conventional id default emits a contextual smell', () => {
  const notices = collectSkillReviewNotices(
    contextFor(['const posts = createEntityAdapter<Post>();'])
  )
  assert.match(
    notices.map(({ guidance }) => guidance).join('\n'),
    /relies on the conventional entity\.id default/
  )
})
