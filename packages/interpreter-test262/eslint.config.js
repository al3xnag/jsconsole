import { defineConfig } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default defineConfig([
  { files: ['**/*.{js,mjs,cjs,ts,mts}'] },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts}'],
    languageOptions: {
      globals: globals.node,
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts}'],
    plugins: { js },
    extends: ['js/recommended'],
  },
  tseslint.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts,mts}'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      'prefer-rest-params': 'off',
    },
  },
  {
    files: ['**/*.cjs'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
])
