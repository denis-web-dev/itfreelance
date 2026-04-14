import react from 'eslint-plugin-react';
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';
import pluginPrettier from 'eslint-plugin-prettier';
import unusedImports from 'eslint-plugin-unused-imports';

export default [
  {
    files: ['**/*.{js,jsx}'],
    ignores: ['dist', 'node_modules'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    settings: { react: { version: 'detect' } },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      prettier: pluginPrettier,
      'unused-imports': unusedImports,
      react,
    },
    rules: {
      'import/no-unresolved': 'off',
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'no-console': 'warn',
      'no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^React$',
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          vars: 'all',
          args: 'after-used',
        },
      ],
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': 'off',
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'prettier/prettier': 'error',
      'react/jsx-uses-vars': 'error',
      'import/no-unused-modules': 'off',
    },
  },
  prettier,
];
