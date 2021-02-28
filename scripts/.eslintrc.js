/*
 * Copyright (c) 2008-2021, Hazelcast, Inc. All Rights Reserved.
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
    'env': {
        'commonjs': true,
        'node': true,
        'es6': true
    },
    'extends': 'eslint:recommended',
    'parserOptions': {
        'ecmaVersion': 12
    },
    'rules': {
        'arrow-spacing': [
            'warn',
            {
                'after': true,
                'before': true
            }
        ],
        'strict': 'error',
        'block-spacing': 'warn',
        'brace-style': [
            'warn',
            '1tbs'
        ],
        'camelcase': 'warn',
        'comma-spacing': [
            'warn',
            {
                'after': true,
                'before': false
            }
        ],
        'comma-style': [
            'warn',
            'last'
        ],
        'eol-last': 'error',
        'eqeqeq': 'warn',
        'func-call-spacing': 'warn',
        'indent': 'warn',
        'keyword-spacing': [
            'error',
            {
                'after': true,
                'before': true
            }
        ],
        'linebreak-style': [
            'warn',
            'unix'
        ],
        'max-depth': 'error',
        'max-len': ['warn', {
            'code': 120
        }],
        'prefer-const': 'warn',
        'prefer-named-capture-group': 'error',
        'quotes': [
            'error',
            'single'
        ],
        'semi': 'warn',
        'semi-style': [
            'error',
            'last'
        ],
        'space-before-blocks': 'warn',
        'space-before-function-paren': 'warn',
        'spaced-comment': [
            'warn',
            'always'
        ],
        'no-trailing-spaces': 'warn',
        'no-multiple-empty-lines': ['warn', {
            'max': 1
        }],
        'padded-blocks': ['error', 'never']
    }
};
