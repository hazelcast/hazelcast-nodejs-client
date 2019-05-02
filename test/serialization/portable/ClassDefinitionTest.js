/*
 * Copyright (c) 2008-2019, Hazelcast, Inc. All Rights Reserved.
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
var assert = require('chai').assert;
var CD = require('../../../').ClassDefinition;
var FD = require('../../../').FieldDefinition;
var FT = require('../../../').FieldDefinition;

describe('ClassDefinitionTest', function () {
    var a = new CD(1, 2, 3);

    it('getFieldType():firstField should be type of FT.INT.', function () {
        a.addFieldDefinition(new FD(0, 'firstField', FT.INT, 10, 10));
        var type = a.getFieldType('firstField');
        expect(type).equal(FT.INT);
    });

    it('getFieldType():secondField should be type of FT.STRING.', function () {
        a.addFieldDefinition(new FD(1, 'secondField', FT.CHAR_ARRAY, 11, 11));
        var type = a.getFieldType('secondField');
        expect(type).equal(FT.CHAR_ARRAY);
    });

    it('getFieldType():thirdField should be null because we will not add it. (It does not exist.)', function () {
        expect(a.getFieldType.bind(a, 'thirdField')).to.throw(Error);
    });


    it('hasField():field was added so it should be return true.', function () {
        a.addFieldDefinition(new FD(2, 'aField', FT.INT, 10, 10));
        expect(a.hasField('aField')).to.be.true;
    });

    it('hasField():field was not added so it should be return false.', function () {
        var res = a.hasField('anotherField');
        expect(res).to.be.false;
    });

    it('getFieldById():When index is not an integer it should throw an range exception.', function () {
        expect(a.getFieldById.bind(a, 0.3)).to.throw(Error);
    });

    it('getFieldById():When index is negative it should throw an range exception.', function () {
        expect(a.getFieldById.bind(a, -2)).to.throw(Error);
    });

    it('getFieldById():When a field with given index is found.', function () {
        expect(a.getFieldById.bind(a, 0)).to.not.throw(Error);
    });

    it('getFieldById():When index is more than or equal to total number of fields it should throw an range exception.', function () {
        expect(a.getFieldById.bind(a, 3)).to.throw(Error);
    });

    it('equals():When parameter passed is not a ClassDefinitionObject.', function () {
        var a1 = new CD();
        var b1 = new FD();
        var res = a1.equals(b1);
        expect(res).to.equal(false);
    });

    it('equals():When one of the fields (or more) is not matched with the parameter.', function () {
        var a1 = new CD(1, 3, 4);
        var b1 = new CD(1, 3, 6);
        var res = a1.equals(b1);
        expect(res).to.equal(false);
    });

    it('equals():When parameter is equal.', function () {
        var a1 = new CD(1, 3, 6);
        var b1 = new CD(1, 3, 6);
        var res = a1.equals(b1);
        expect(res).to.equal(true);
    });

});
