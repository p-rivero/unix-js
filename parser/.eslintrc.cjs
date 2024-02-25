module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    'project': './tsconfig.json'
  },
  extends: ['../.eslintrc.cjs'],
  rules: {
    'no-console': 'off',
  },
  ignorePatterns: ['**/*.guard.ts'],
}
