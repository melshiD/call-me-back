import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

// Frontend-only lint config. Scoped to the ACTIVE Vue frontend directories
// (views, components, router, stores, services, shared, plus top-level entry
// files). Raindrop-era service directories were deleted from src/ — see
// commit that removed api-gateway/, call-orchestrator/, persona-manager/,
// webhook-handler/, voice-pipeline/, etc.
const ACTIVE_FRONTEND_ALL = [
  'src/App.vue',
  'src/main.js',
  'src/components/**/*.{js,ts,tsx,vue}',
  'src/views/**/*.{js,ts,tsx,vue}',
  'src/router/**/*.{js,ts,tsx}',
  'src/stores/**/*.{js,ts,tsx}',
  'src/services/**/*.{js,ts,tsx}',
  'src/shared/**/*.{js,ts,tsx}',
  'src/assets/**/*.{js,ts,tsx}',
];

const ACTIVE_FRONTEND_TS = [
  'src/components/**/*.{ts,tsx}',
  'src/views/**/*.{ts,tsx}',
  'src/router/**/*.{ts,tsx}',
  'src/stores/**/*.{ts,tsx}',
  'src/services/**/*.{ts,tsx}',
  'src/shared/**/*.{ts,tsx}',
  'src/assets/**/*.{ts,tsx}',
];

export default [
  {
    files: ACTIVE_FRONTEND_ALL,
    ...js.configs.recommended,
  },
  {
    files: ACTIVE_FRONTEND_TS,
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        Request: 'readonly',
        Response: 'readonly',
        console: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-undef': 'off',
      'no-console': 'off',
    },
  },
  {
    ignores: [
      'dist/',
      'node_modules/',
      'reference/',
      'db/',
      // Everything outside src/ — legacy proxies, one-offs, scripts
      '*.js',
      '*.cjs',
      '*.mjs',
      'after_midterm/**',
      'deepgram-proxy/**',
      'design/**',
      'docs/**',
      'documentation/**',
      'eval_images/**',
      'log-query-service/**',
      'migrations/**',
      'public/**',
      'scripts/**',
      'server/**',
      'social-media-assets/**',
      'submission_docs/**',
      'tool-logs/**',
      'tools/**',
      'use_cases/**',
      'utilities/**',
      'voice-pipeline-nodejs/**',
      'vultr-db-proxy/**',
    ],
  },
];
