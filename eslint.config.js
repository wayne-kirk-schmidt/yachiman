// eslint.config.js
export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly"
      }
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "error",
      "no-redeclare": "error",
      "no-unreachable": "error",
      "eqeqeq": ["error", "always"],
      "no-implicit-globals": "error"
    }
  }
];

