import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Ignore build output and dependencies
  globalIgnores(['dist', 'node_modules', '*.config.js']),
  
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // TypeScript specific rules - relaxed for practical use
      '@typescript-eslint/no-explicit-any': 'warn',  // Warn instead of error
      '@typescript-eslint/no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-unused-expressions': ['error', {
        allowShortCircuit: true,  // Allow && and ||
        allowTernary: true,        // Allow ternary expressions
        allowTaggedTemplates: true
      }],
      
      // React specific rules
      'react-hooks/exhaustive-deps': 'warn',  // Warn about missing dependencies
      'react-refresh/only-export-components': ['warn', { 
        allowConstantExport: true 
      }],
      
      // Code quality rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],  // Warn on console.log
      'no-debugger': 'warn',
      'no-case-declarations': 'error',
      
      // Import/organization rules
      'sort-imports': ['warn', {
        ignoreCase: true,
        ignoreDeclarationSort: true,  // Use other tools for import sorting
        ignoreMemberSort: false
      }]
    }
  },
  
  // Configuration for JavaScript config files
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: { ...globals.node, ...globals.browser },
    },
  }
])
