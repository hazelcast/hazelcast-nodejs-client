/*
 * Copyright (c) 2008-2022, Hazelcast, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: '../tsconfig.eslint.json',
        tsconfigRootDir: __dirname
    },
    plugins: [
        '@typescript-eslint',
    ],
    ignorePatterns: [
        '.eslintrc.js'
    ],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    rules: {
        '@typescript-eslint/no-floating-promises': [ 'error', { ignoreIIFE: true } ],
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/interface-name-prefix': 'off',
        '@typescript-eslint/no-empty-interface': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-unused-vars': [ 'error', { args: 'none' } ],
        'no-prototype-builtins': 'off',
        'prefer-rest-params': 'off',
        'max-len': [ 'error', 130, 4 ],
        'quotes': ['error', 'single'],
        'keyword-spacing': 'error',
        'space-before-blocks': 'warn',
        'space-in-parens': 'error',
        'curly': 'error',
    }
};
