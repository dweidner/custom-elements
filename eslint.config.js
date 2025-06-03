import { defineConfig } from 'eslint/config';

import js from '@eslint/js';
import jsdoc from 'eslint-plugin-jsdoc';
import globals from 'globals';

const config = defineConfig([
  js.configs['recommended'],
  jsdoc.configs['flat/recommended'],
  {
    files: [
      'scripts/**/*.js',
    ],
    plugins: {
      js,
      jsdoc,
    },
    rules: {
      'indent': ['error', 2],
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'linebreak-style': ['error', 'unix'],
      'comma-dangle': ['error', 'always-multiline'],
      'jsdoc/tag-lines': ['error', 'never', {'startLines': 1}],
      'jsdoc/require-description': 'off',
      'jsdoc/require-param-description': 'off',
      'jsdoc/require-property-description': 'off',
      'jsdoc/require-returns-description': 'off',
    },
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 'latest',
      globals: {
        ...globals.node,
      },
    },
  },
]);

export default config;
