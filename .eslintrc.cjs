module.exports = {
  root: true,
  plugins: [
    '@typescript-eslint',
    '@stylistic',
    'only-warn'
  ],
  extends: [
    'eslint:all',
    'plugin:@typescript-eslint/all'
  ],
  env: {
    'node': true
  },
  rules: {
    'semi': [ 'error', 'never' ],
    '@typescript-eslint/semi': [ 'error', 'never' ],
    'one-var': [ 'error', 'never' ],
    'quotes': [ 'error', 'single', { 'avoidEscape': true } ],
    '@typescript-eslint/quotes': [ 'error', 'single', { 'avoidEscape': true } ],
    'default-case': 'off',
    'sort-keys': 'off',
    'multiline-comment-style': 'off',
    'capitalized-comments': 'off',
    'no-negated-condition': 'off',
    'sort-imports': 'off',
    'max-classes-per-file': 'off',
    'id-length': 'off',
    'func-style': [ 'error', 'declaration', { 'allowArrowFunctions': true } ],
    'no-ternary': 'off',
    'no-undefined': 'off',
    'max-statements': 'off',
    'no-plusplus': 'off',
    'no-inline-comments': 'off',
    '@typescript-eslint/consistent-type-imports': [ 'error', { 'fixStyle': 'inline-type-imports' } ],
    '@typescript-eslint/object-curly-spacing': [ 'error', 'always' ],
    '@typescript-eslint/lines-between-class-members': 'off',
    '@typescript-eslint/space-before-function-paren': [ 'error', 'never' ],
    '@typescript-eslint/sort-type-constituents': 'off',
    '@typescript-eslint/no-magic-numbers': 'off',
    '@typescript-eslint/max-params': [ 'warn', { 'max': 4 } ],
    '@typescript-eslint/class-methods-use-this': [ 'warn', { 'ignoreOverrideMethods': true } ],
    '@typescript-eslint/no-unused-vars': [ 'error', { 'argsIgnorePattern': '^_' } ],
    '@typescript-eslint/member-delimiter-style': [
      'error', {
        'multiline': { 'delimiter': 'none' },
        'singleline': { 'delimiter': 'semi' },
      }
    ],
    '@typescript-eslint/prefer-readonly-parameter-types': 'off',
    '@typescript-eslint/explicit-function-return-type': [ 'warn', { 'allowExpressions': true } ],
    '@typescript-eslint/member-ordering': 'off',
    '@typescript-eslint/no-confusing-void-expression': 'off',
  }
}
