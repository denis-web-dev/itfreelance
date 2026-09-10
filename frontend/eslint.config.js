import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';
import pluginPrettier from 'eslint-plugin-prettier';
import unusedImports from 'eslint-plugin-unused-imports';

export default [
  {
    ignores: ['dist', 'node_modules', 'build', 'coverage', 'eslint.config.js'],
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      prettier: pluginPrettier,
      'unused-imports': unusedImports,
    },
    rules: {
      // Базовые рекомендуемые правила
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules, // важно для нового JSX-transform
      ...reactHooks.configs.recommended.rules,

      // React Refresh (Vite)
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // Неиспользуемые импорты и переменные
      'no-unused-vars': 'off', // отключаем в пользу unused-imports
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      // Стиль и качество
      'no-console': 'warn',
      'react/prop-types': 'off', // если не используешь PropTypes
      'react/jsx-uses-vars': 'error',

      // Prettier
      'prettier/prettier': 'error',
    },
  },

  // Этот конфиг должен быть последним — отключает все правила,
  // которые конфликтуют с Prettier
  prettier,
];
