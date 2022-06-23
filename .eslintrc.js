module.exports = {
  extends: ['alloy', 'alloy/react', 'alloy/typescript'],
  env: {
    // Your environments (which contains several predefined global variables)
    //
    // browser: true,
    // node: true,
    // mocha: true,
    // jest: true,
    // jquery: true
  },
  globals: {
    // Your global variables (setting to false means it's not allowed to be reassigned)
    //
    // myGlobal: false
  },
  rules: {
    'max-params': 'off',
    complexity: 'off',
    'no-param-reassign': 'off',
    'max-nested-callbacks': 'off',
    'react/no-unknown-property': [
      'error',
      { ignore: ['class', 'classList', 'stop-color', 'autofocus'] },
    ],
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@typescript-eslint/member-ordering': 'off',
    '@typescript-eslint/no-parameter-properties': 'off',
    '@typescript-eslint/no-invalid-void-type': 'off',
  },
};
