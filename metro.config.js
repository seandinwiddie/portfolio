// Learn more https://docs.expo.io/guides/customizing-metro
/**
 * @type {import('expo/metro-config').MetroConfig}
 */
const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname, {
  // [Web-only]: Enables CSS support in Metro.
  isCSSEnabled: true,
})

config.resolver.sourceExts.push('mjs')

// Enable Tamagui and add nice web support with optimizing compiler + CSS extraction.
// This must be the value we export -- reassigning `module.exports` afterwards would
// throw the wrapped config away.
const { withTamagui } = require('@tamagui/metro-plugin')

module.exports = withTamagui(config, {
  components: ['tamagui'],
  config: './tamagui.config.ts',
  outputCSS: './tamagui-web.css',
})
