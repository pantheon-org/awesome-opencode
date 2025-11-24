module.exports = [
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: [
      'node_modules/**',
      'dist/**',
      'bun.lock',
      'package-lock.json',
      '*.d.ts',
      '**/*.spec.ts',
    ],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
      'prefer-arrow': require('eslint-plugin-prefer-arrow'),
      sonarjs: require('eslint-plugin-sonarjs'),
      import: require('eslint-plugin-import'),
      tsdoc: require('eslint-plugin-tsdoc'),
      jsdoc: require('eslint-plugin-jsdoc'),
      prettier: require('eslint-plugin-prettier'),
    },
    settings: {
      'import/resolver': {
        typescript: {},
      },
      jsdoc: {
        mode: 'typescript',
      },
    },
    rules: {
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          tabWidth: 2,
          semi: true,
          trailingComma: 'all',
        },
      ],

      'max-lines': ['warn', { max: 200, skipBlankLines: true, skipComments: true }],
      'max-statements': ['error', 30],
      'prefer-arrow/prefer-arrow-functions': [
        'warn',
        {
          disallowPrototype: true,
          singleReturnOnly: false,
          classPropertiesAllowed: false,
        },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-var': 'error',
      'prefer-const': 'error',

      complexity: ['warn', 10],
      'import/max-dependencies': ['warn', { max: 10 }],
      'import/no-cycle': 'error',

      'tsdoc/syntax': 'off',

      'jsdoc/require-jsdoc': 'warn',
      'jsdoc/require-param': 'off',
      'jsdoc/check-tag-names': 'off',
      'jsdoc/no-undefined-types': 'off',
      'jsdoc/require-param-type': 'off',
      'jsdoc/require-returns-type': 'off',
    },
  },
  {
    files: ['**/*.test.ts'],
    rules: {
      'tsdoc/syntax': 'off',
      'prettier/prettier': 'off',
      'max-lines': 'off',
    },
  },
];
