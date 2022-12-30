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
'use strict';

const chai = require('chai');
const { FieldKind } = require('../../../../lib');
const { FieldDescriptor } = require('../../../../lib/serialization/generic_record/FieldDescriptor');
const { Schema } = require('../../../../lib/serialization/compact/Schema');
const { BitsUtil } = require('../../../../lib/util/BitsUtil');
chai.should();

describe('SchemaTest', function () {
    it('should work with multiple booleans', function () {
        const boolCount = 100;
        const boolFields = new Array(100);
        for (let i = 0; i < boolCount; i++) {
            boolFields[i] = new FieldDescriptor(i.toString(), FieldKind.BOOLEAN);
        }

        const fields = [
            ...boolFields, new FieldDescriptor('fixSized', FieldKind.INT32), new FieldDescriptor('varSized', FieldKind.STRING)
        ];
        const schema = new Schema('something', fields);

        schema.numberVarSizeFields.should.be.eq(1);

        const expectedLength = Math.ceil(boolCount / 8) + 4;
        schema.fixedSizeFieldsLength.should.be.eq(expectedLength);

        schema.fieldDefinitionMap.get('fixSized').offset.should.be.eq(0);
        schema.fieldDefinitionMap.get('varSized').index.should.be.eq(0);

        let positionSoFar = 4;
        let bitPositionSoFar = 0;
        for (const fieldDescriptor of boolFields) {
            if (bitPositionSoFar === BitsUtil.BITS_IN_A_BYTE) {
                positionSoFar++;
                bitPositionSoFar = 0;
            }

            const schemaField = schema.fieldDefinitionMap.get(fieldDescriptor.fieldName);
            schemaField.offset.should.be.eq(positionSoFar);
            schemaField.bitOffset.should.be.eq(bitPositionSoFar);

            bitPositionSoFar += 1;
        }
    });

    it('should return true when compare same FieldDescriptor', function() {
        const field1 = new FieldDescriptor('SameField', FieldKind.INT32);
        const field2 = new FieldDescriptor('SameField', FieldKind.INT32);
        chai.expect(field1.equals(field2)).to.be.true;
    });

    it('should return false when compare different name FieldDescriptor', function() {
        const field1 = new FieldDescriptor('SameField', FieldKind.INT32);
        const field2 = new FieldDescriptor('SameField2', FieldKind.INT32);
        chai.expect(field1.equals(field2)).to.be.false;
    });

    it('should return false when compare different kind FieldDescriptor', function() {
        const field1 = new FieldDescriptor('SameField', FieldKind.INT32);
        const field2 = new FieldDescriptor('SameField', FieldKind.INT64);
        chai.expect(field1.equals(field2)).to.be.false;
    });
});
