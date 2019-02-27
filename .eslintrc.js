module.exports = {
  parser: "babel-eslint",
  parserOptions: {
    ecmaVersion: 6,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true
    }
  },
  env: {
    es6: true,
    browser: true,
    node: true
  },
  settings: {
    ecmascript: 6,
    jsx: true,
    "import/extensions": [".js", ".jsx"],
    flowtype: {
      onlyFilesWithFlowAnnotation: true
    }
  },
  extends: [
    "airbnb",
    "plugin:react/recommended",
    "plugin:jest/recommended",
    "plugin:flowtype/recommended",
    "plugin:prettier/recommended",
    "prettier",
    "prettier/flowtype",
    "prettier/react",
    "prettier/standard"
  ],
  plugins: [
    "flowtype",
    "flowtype-errors",
    "jsx-a11y",
    "prettier",
    "react"
  ],
  rules: {
    "prettier/prettier": ["error"],
    // "react/jsx-filename-extension": [1, { extensions: [".js", ".jsx"] }],
    // "import/no-extraneous-dependencies": [0],
    camelcase: [0],
    eqeqeq: [1],
    quotes: [2, "double", { avoidEscape: true }],
    "arrow-body-style": [0],
    "arrow-parens": [0],
    "class-methods-use-this": [0],
    "comma-dangle": [0],
    "react/require-default-props": [0],
    "flowtype-errors/show-errors": 2,
    "max-len": [0],
    "new-cap": [0],
    "no-console": [0],
    "no-param-reassign": [0],
    "no-underscore-dangle": [0],
    "prefer-arrow-callback": [0],
    "prefer-destructuring": [0],
    "no-use-before-define": ["error", { classes: false }],
    "spaced-comment": ["error", "always", { markers: [":", "::"] }],
    "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "react/jsx-wrap-multilines": [0],
    "react/no-deprecated": [2],
    "react/jsx-uses-vars": [2],
    "react/prefer-es6-class": [2],
    "react/no-multi-comp": [2],
    "react/no-find-dom-node": [2]
  }
};
