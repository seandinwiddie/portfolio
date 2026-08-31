export type AyuThemePalette = Readonly<{
  surfaceBase: string
  surfaceLift: string
  panel: string
  popup: string
  editorForeground: string
  uiForeground: string
  uiLine: string
  editorLine: string
  selection: string
  lineNumber: string
  accent: string
  accentOn: string
  error: string
  vcsAdded: string
  tag: string
  function: string
  entity: string
  string: string
  regexp: string
  markup: string
  keyword: string
  special: string
  comment: string
  constant: string
  operator: string
}>

export const ayuDarkPalette = {
  surfaceBase: '#0D1017',
  surfaceLift: '#10141C',
  panel: '#141821',
  popup: '#0F131A',
  editorForeground: '#BFBDB6',
  uiForeground: '#5A6378',
  uiLine: '#1B1F29',
  editorLine: '#161A24',
  selection: '#3388FF40',
  lineNumber: '#5A6378A6',
  accent: '#E6B450',
  accentOn: '#765B24',
  error: '#D95757',
  vcsAdded: '#70BF56',
  tag: '#39BAE6',
  function: '#FFB454',
  entity: '#59C2FF',
  string: '#AAD94C',
  regexp: '#95E6CB',
  markup: '#F07178',
  keyword: '#FF8F40',
  special: '#E6C08A',
  comment: '#5A6673',
  constant: '#D2A6FF',
  operator: '#F29668',
} as const satisfies AyuThemePalette

export const ayuLightPalette = {
  surfaceBase: '#F8F9FA',
  surfaceLift: '#FCFCFC',
  panel: '#FAFAFA',
  popup: '#FFFFFF',
  editorForeground: '#5C6166',
  uiForeground: '#828E9F',
  uiLine: '#6B7D8F1F',
  editorLine: '#828E9F1A',
  selection: '#035BD626',
  lineNumber: '#828E9F66',
  accent: '#F29718',
  accentOn: '#7E4B01',
  error: '#E65050',
  vcsAdded: '#6CBF43',
  tag: '#55B4D4',
  function: '#EBA400',
  entity: '#22A4E6',
  string: '#86B300',
  regexp: '#4CBF99',
  markup: '#F07171',
  keyword: '#FA8532',
  special: '#E59645',
  comment: '#ADAEB1',
  constant: '#A37ACC',
  operator: '#F2A191',
} as const satisfies AyuThemePalette

export const ayuMiragePalette = {
  surfaceBase: '#1F2430',
  surfaceLift: '#242936',
  panel: '#282E3B',
  popup: '#1C212C',
  editorForeground: '#CCCAC2',
  uiForeground: '#707A8C',
  uiLine: '#171B24',
  editorLine: '#1A1F29',
  selection: '#409FFF40',
  lineNumber: '#707A8C80',
  accent: '#FFCC66',
  accentOn: '#735923',
  error: '#FF6666',
  vcsAdded: '#87D96C',
  tag: '#5CCFE6',
  function: '#FFCD66',
  entity: '#73D0FF',
  string: '#D5FF80',
  regexp: '#95E6CB',
  markup: '#F28779',
  keyword: '#FFA659',
  special: '#D9BE98',
  comment: '#6E7C8F',
  constant: '#DFBFFF',
  operator: '#F29E74',
} as const satisfies AyuThemePalette

export const AYU_REVISION = 'e3f44fdf2a1c83e3f183d4e8acd40c6a452dcb1c'

export const ayuSource = (variant: 'dark' | 'light' | 'mirage') => ({
  name: `Ayu ${variant[0].toUpperCase()}${variant.slice(1)}`,
  revision: AYU_REVISION,
  url: `https://github.com/ayu-theme/ayu-colors/blob/${AYU_REVISION}/themes/${variant}.yaml`,
})
