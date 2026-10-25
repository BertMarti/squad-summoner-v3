import js from '@eslint/js'
import globals from 'globals'
import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

// ESLint revisa errores y malas prácticas; el formato lo decide Prettier (npm run format).
export default defineConfigWithVueTs(
  {
    name: 'squad-summoner/archivos',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },
  {
    name: 'squad-summoner/ignorados',
    ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'server/node_modules/**', 'server/.wwebjs_*/**'],
  },
  js.configs.recommended,
  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  {
    name: 'squad-summoner/reglas',
    rules: {
      // Seguridad (AGENTS.md): nada de HTML de datos ni alert().
      'vue/no-v-html': 'error',
      'no-alert': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
    },
  },
  {
    name: 'squad-summoner/servidor-y-scripts',
    files: ['server/**/*.js', 'scripts/**/*.mjs'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    name: 'squad-summoner/servidor-commonjs',
    files: ['server/**/*.js'],
    ignores: ['server/test/**'],
    languageOptions: { sourceType: 'commonjs' },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  skipFormatting,
)
