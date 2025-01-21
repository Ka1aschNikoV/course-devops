/** @type {import('eslint').Linter.Config[]} */
import globals from "globals";
export default [
    {
      files: ["service1/index.js"], // Target your specific file or files
      languageOptions: {
        ecmaVersion: 2021, // Use ES2021 features
        sourceType: "script", // Set source type to 'script' for CommonJS modules
        globals: {
          require: "readonly", // Allow `require`
          module: "readonly",  // Allow `module`
          exports: "readonly", // Allow `exports`
          __dirname: "readonly", // Allow `__dirname`
          __filename: "readonly", // Allow `__filename`
          ...globals.browser,
          ...globals.node,
        }
      },
      rules: {
        // Possible Errors
        "no-unused-vars": ["warn", { "vars": "all", "args": "after-used", "ignoreRestSiblings": false }],
        "no-extra-semi": "error",
        "no-undef": "error",
        
        // Best Practices
        "eqeqeq": ["error", "always"],
        "curly": "error",
        "no-console": "off", // Allow `console.log`, common in server-side debugging
        "no-debugger": "warn",
        
        // Stylistic Choices
        "semi": ["error", "always"],
        "quotes": ["error", "single", { "avoidEscape": true }],
        "indent": ["error", 2],
        "eol-last": ["error", "always"],
        "no-trailing-spaces": "error",
        
        // Node.js Specific Rules
        "callback-return": "warn", // Enforce return after callback
        "handle-callback-err": ["warn", "^(err|error)$"], // Handle `err` in callbacks
        "no-new-require": "error", // Disallow `new` with `require`
        "no-path-concat": "error", // Prevent string concatenation with `__dirname` and `__filename`
  
        // ES6 Rules
        "prefer-const": "warn",
        "no-var": "error",
        "arrow-spacing": ["error", { "before": true, "after": true }]
      }
    }
  ];
  