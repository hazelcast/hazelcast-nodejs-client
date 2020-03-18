/*
 * Copyright (c) 2008-2020, Hazelcast, Inc. All Rights Reserved.
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

var expect = require('chai').expect;
var validate = require('jsonschema').validate;
var fs = require('fs');
var path = require('path');

describe('SchemaValidationTest', function () {

    var schema;

    before(function () {
        schema = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../config-schema.json'), 'utf8'));
    });

    function validateCandidate(candidate) {
        var candidateJson = JSON.parse(candidate);
        return validate(candidateJson, schema, {nestedErrors: true});
    }

    it('hazelcast-client-full.json passes validation', function () {
        var fulljson = fs.readFileSync(path.resolve(__dirname, 'configurations/full.json'), 'utf8');
        expect(validateCandidate(fulljson).valid).to.be.true;
    });

    it('invalid configuration is caught by the validator', function () {
        var invalidJson = fs.readFileSync(path.resolve(__dirname, 'configurations/invalid.json'), 'utf8');
        expect(validateCandidate(invalidJson).errors[0]).to.exist.with.property('message', 'must have a minimum value of 1000');
    });
});

