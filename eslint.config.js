const gts = require('gts');
const { Linter } = require('eslint');

module.exports = [
    {
        ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'vitest.config.ts', 'eslint.config.js', 'test/**'],
    },
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: require('@typescript-eslint/parser'),
            parserOptions: {
                project: './tsconfig.json',
            },
        },
        plugins: {
            '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
        },
        rules: {
            ...require('@typescript-eslint/eslint-plugin').configs.recommended.rules,
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        },
    },
];
