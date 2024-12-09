
/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["test/**/*.js"], // Target test files specifically
    languageOptions: {
      globals: {
        // Define Mocha and Chai globals
        describe: "readonly",
        it: "readonly",
        before: "readonly",
        after: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        expect: "readonly",
        should: "readonly",
        assert: "readonly"
      }
    },
    plugins: {
      // Load plugins
      mocha: require("eslint-plugin-mocha"),
      "chai-friendly": require("eslint-plugin-chai-friendly")
    },
    rules: {
      // Turn off the default no-unused-expressions rule
      "no-unused-expressions": "off",
      // Use Chai-friendly no-unused-expressions instead
      "chai-friendly/no-unused-expressions": "error",
      // Optionally include Mocha rules
      "mocha/no-exclusive-tests": "error", // Prevent accidental `.only` in tests
      "mocha/no-pending-tests": "warn" // Warn on tests without an implementation
    }
  }
];