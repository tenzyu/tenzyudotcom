import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import eslintConfigPrettier from 'eslint-config-prettier'
import importPlugin from 'eslint-plugin-import'
import unusedImportsPlugin from 'eslint-plugin-unused-imports'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  // shadcn-ui はリント対象外
  { ignores: ['src/components/shadcn-ui/**'] },

  ...nextCoreWebVitals,

  js.configs.recommended,
  tseslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  eslintConfigPrettier,

  // @typescript-eslintに関する設定
  {
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/no-deprecated': 'warn',
    },
  },

  // related to import
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'type'],
          alphabetize: { order: 'asc', caseInsensitive: true },
          'newlines-between': 'always', // import groups 1行空ける
        },
      ],
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
    },
  },
  {
    plugins: {
      'unused-imports': unusedImportsPlugin,
    },
    rules: {
      'unused-imports/no-unused-imports': 'error',
    },
  },

  // tailwindcss
  {
    settings: {
      tailwindcss: {
        whitelist: ['hidden-scrollbar', '-webkit-scrollbar'],
      },
    },
  },

  // その他設定
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
    languageOptions: {
      globals: {
        React: 'readonly',
      },
    },
    rules: {
      'react/jsx-boolean-value': 'error',
      'react/jsx-curly-brace-presence': 'error',
    },
  },
)
