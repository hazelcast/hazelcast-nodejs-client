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
'use strict';

const chai = require('chai');
const { FieldKind } = require('../../../../lib');
const { FieldDescriptor } = require('../../../../lib/serialization/generic_record/FieldDescriptor');
const { ObjectDataOutput, ObjectDataInput } = require('../../../../lib/serialization/ObjectData');
const {
    createSerializationService
} = require('../../../integration/backward_compatible/parallel/serialization/compact/CompactUtil');
const { Schema } = require('../../../../lib/serialization/compact/Schema');
const { RabinFingerprint64 } = require('../../../../lib/serialization/compact/RabinFingerprint');
const { BitsUtil } = require('../../../../lib/util/BitsUtil');
chai.should();

const verifySchema = (typeName, schema, fields, rabinFingerPrint, fieldDefinitionMap) => {
    schema.typeName.should.be.eq(typeName);
    schema.fieldDefinitionMap.size.should.be.eq(fields.length);
    schema.fieldDefinitionMap.should.be.deep.eq(fieldDefinitionMap);
    RabinFingerprint64.ofSchema(schema).eq(rabinFingerPrint).should.be.true;
};

describe('SchemaTest', function () {
    it('should construct from readData and serialize via writeData', function () {
        const fields = [];
        for (const f in FieldKind) {
            const fieldKind = +f;
            // enums are reverse mapped.
            if (!isNaN(+fieldKind)) {
                fields.push(new FieldDescriptor(FieldKind[fieldKind], fieldKind));
            }
        }
        const {serializationService} = createSerializationService();
        const out = new ObjectDataOutput(serializationService, serializationService.serializationConfig.isBigEndian);
        const schema = new Schema('something', fields.sort((field1, field2) => {
            return field1.fieldName > field2.fieldName ? 1 : -1;
        }));
        schema.writeData(out);

        const input = new ObjectDataInput(out.toBuffer(), 0, null, true);
        const schema2 = new Schema();
        schema2.readData(input);

        verifySchema('something', schema2, fields, RabinFingerprint64.ofSchema(schema), schema.fieldDefinitionMap);
    });

    it('construct correctly when no arguments given', function () {
        const schema = new Schema();
        schema.typeName.should.be.eq('');
        schema.fields.should.be.deep.eq([]);
        schema.fieldDefinitionMap.size.should.be.eq(0);
    });

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
});
